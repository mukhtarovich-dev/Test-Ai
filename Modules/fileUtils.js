const fs = require('fs');
const path = require('path');

function parseMarkdown(mdContent) {
    console.log("📜 Parsing markdown content...");
    const platforms = [];

    const lines = mdContent.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('| Category') && !line.startsWith('|---'));

    const tableRowPattern = /^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*\[([^\]]+)\]\((https?:\/\/[^\)]+)\)\s*\|$/;

    for (const line of lines) {
        const tableMatch = line.match(tableRowPattern);
        if (tableMatch) {
            platforms.push({
                parent: tableMatch[1].trim(),
                sub: tableMatch[2].trim(),
                name: tableMatch[3].trim(),
                url: tableMatch[5].trim()
            });
            console.log("✅ Platform found (table):", tableMatch[3].trim());
            continue;
        }

        const linkMatch = line.match(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/);
        if (linkMatch) {
            platforms.push({
                parent: 'Unknown',
                sub: 'Unknown',
                name: linkMatch[1].trim(),
                url: linkMatch[2].trim()
            });
            console.log("✅ Platform found (simple link):", linkMatch[1].trim());
        }
    }

    return platforms;
}

function sanitizePath(name) {
    return name.replace(/[<>:"/\\|?*]+/g, '_').replace(/\s+/g, '_');
}

function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '');
    } catch (error) {
        console.error(`❌ URL parse error: ${url}`);
        return sanitizePath(url);
    }
}

async function saveAsMHTML(url, savePath, browser) {
    try {
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'load', timeout: 60000 });

        const session = await page.target().createCDPSession();
        const { data } = await session.send('Page.captureSnapshot', { format: 'mhtml' });
        fs.writeFileSync(savePath, data);
        console.log(`📄 MHTML saqlandi: ${savePath}`);

        await page.close();
    } catch (error) {
        console.error(`❌ MHTML saqlashda xatolik: ${url} - ${error.message}`);
    }
}

async function createPlatformFolder(platform, browser, baseDir) {
    console.log("📂 Papka yaratilmoqda:", platform.name);

    const safeParent = sanitizePath(platform.parent);
    const safeSub = sanitizePath(platform.sub);
    const domain = extractDomain(platform.url);
    const safeFolderName = domain === 'github.com' ?
        sanitizePath(platform.name) :
        sanitizePath(domain);

    const movedDir = path.join(baseDir, 'Moved');
    if (!fs.existsSync(movedDir)) {
        fs.mkdirSync(movedDir, { recursive: true });
    }

    const parentDir = path.join(movedDir, safeParent);
    if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
    }

    const subDir = path.join(parentDir, safeSub);
    if (!fs.existsSync(subDir)) {
        fs.mkdirSync(subDir, { recursive: true });
    }

    const parsedDir = path.join(baseDir, 'parsed');
    const folderPath = path.join(parsedDir, safeFolderName);
    const targetPath = path.join(subDir, safeFolderName);

    if (fs.existsSync(folderPath)) {
        if (fs.existsSync(targetPath)) {
            fs.rmSync(targetPath, { recursive: true, force: true });
            console.log(`🔄 ${safeFolderName} overwrite qilinmoqda: ${targetPath}`);
        }
        fs.renameSync(folderPath, targetPath);
        console.log(`📁 ${safeFolderName} move qilindi: ${targetPath}`);
    } else {
        if (!fs.existsSync(targetPath)) {
            fs.mkdirSync(targetPath, { recursive: true });
            console.log(`📂 Yangi katalog yaratildi: ${targetPath}`);
            const urlFilePath = path.join(targetPath, `${safeFolderName}.url`);
            fs.writeFileSync(urlFilePath, `[InternetShortcut]\nURL=${platform.url}\n`, 'utf8');
            console.log(`🔗 URL fayl saqlandi: ${urlFilePath}`);

            const mhtmlFilePath = path.join(targetPath, `${safeFolderName}.mhtml`);
            await saveAsMHTML(platform.url, mhtmlFilePath, browser);
        }
    }
}

module.exports = {
    parseMarkdown,
    sanitizePath,
    extractDomain,
    saveAsMHTML,
    createPlatformFolder
};
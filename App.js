const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const {
    parseMarkdown,
    createPlatformFolder
} = require('./Modules/platformUtils');





















































































































async function main() {
    const args = process.argv.slice(2);
    if (args.length < 1) {
        console.error("❌ Foydalanish: node script.js <markdown_file>");
        process.exit(1);
    }

    const markdownFile = args[0];
    const baseDir = path.dirname(markdownFile);

    console.log(`📄 Markdown fayl o'qilmoqda: ${markdownFile}`);
    const mdContent = fs.readFileSync(markdownFile, 'utf8');

    const platforms = parseMarkdown(mdContent);
    console.log(`🔍 ${platforms.length} ta platforma topildi`);

    const browser = await puppeteer.launch({ headless: true });

    for (const platform of platforms) {
        await createPlatformFolder(platform, browser, baseDir);
    }

    await browser.close();
    console.log("✅ Jarayon tugadi!");
}

main().catch(console.error);
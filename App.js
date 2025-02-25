const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { parseMarkdown, createPlatformFolder } = require('./Modules/fileUtils');

async function main() {
    const args = process.argv.slice(2);
    const mdFilePath = args[0];

    if (!mdFilePath) {
        console.error("❌ Please provide the path to the markdown file");
        process.exit(1);
    }

    if (!fs.existsSync(mdFilePath)) {
        console.error(`❌ File not found: ${mdFilePath}`);
        process.exit(1);
    }

    const mdContent = fs.readFileSync(mdFilePath, 'utf8');
    const platforms = parseMarkdown(mdContent);
    const baseDir = path.dirname(mdFilePath);

    const browser = await puppeteer.launch();

    try {
        for (const platform of platforms) {
            await createPlatformFolder(platform, browser, baseDir);
        }
    } finally {
        await browser.close();
    }

    console.log("✨ Process completed successfully!");
}

main().catch(error => {
    console.error("❌ An error occurred:", error);
    process.exit(1);
});
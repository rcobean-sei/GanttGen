// Script to capture a screenshot of the Tauri app UI
const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

async function captureScreenshot() {
    // Mock the Tauri API for the screenshot
    const mockTauriScript = `
        window.__TAURI__ = {
            core: {
                invoke: async (cmd, args) => {
                    if (cmd === 'get_palette_info') {
                        return [
                            { id: 'alternating', name: 'Alternating (Default)', description: 'Best task differentiation with red/purple mix', colors: ['#F01840', '#402848', '#C01830', '#705E74', '#901226'], accent_border: null, accent_color: null },
                            { id: 'alternating_b', name: 'Alternating + Border', description: 'Alternating with red left border accent', colors: ['#F01840', '#402848', '#C01830', '#705E74', '#901226'], accent_border: '#C01830', accent_color: null },
                            { id: 'reds', name: 'Reds', description: 'Warm, energetic red gradient', colors: ['#F01840', '#C01830', '#901226', '#600C1C', '#300810'], accent_border: null, accent_color: null },
                            { id: 'reds_b', name: 'Reds + Purple Border', description: 'Red gradient with purple left border', colors: ['#F01840', '#C01830', '#901226', '#600C1C', '#300810'], accent_border: '#402848', accent_color: null },
                            { id: 'purples_a', name: 'Purples + Burgundy Text', description: 'Purple gradient with burgundy task names', colors: ['#705E74', '#402848', '#2A1C30'], accent_border: null, accent_color: '#901226' },
                            { id: 'purples_b', name: 'Purples + Red Border', description: 'Purple gradient with red left border', colors: ['#705E74', '#402848', '#2A1C30'], accent_border: '#C01830', accent_color: null },
                            { id: 'purples_c', name: 'Purples + Both Accents', description: 'Purple with burgundy text and red border', colors: ['#705E74', '#402848', '#2A1C30'], accent_border: '#C01830', accent_color: '#901226' }
                        ];
                    }
                    return null;
                }
            },
            dialog: { open: async () => null, save: async () => null },
            event: { listen: async () => () => {} },
            shell: { open: async () => {} },
            path: { dirname: async (p) => p.split('/').slice(0, -1).join('/') }
        };
    `;

    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Set viewport to match Tauri window size
    await page.setViewportSize({ width: 1100, height: 750 });

    // Load the HTML file
    const htmlPath = path.resolve(__dirname, '../src/index.html');

    // Read and modify HTML to inject mock Tauri API
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');
    htmlContent = htmlContent.replace('<script src="app.js"></script>',
        `<script>${mockTauriScript}</script><script src="app.js"></script>`);

    // Write temporary file
    const tempHtml = path.resolve(__dirname, '../src/temp-preview.html');
    fs.writeFileSync(tempHtml, htmlContent);

    await page.goto('file://' + tempHtml);

    // Wait for the page to render
    await page.waitForTimeout(500);

    // Screenshot the full app
    const screenshotPath = path.resolve(__dirname, '../screenshot-app.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log('Screenshot saved to:', screenshotPath);

    // Cleanup
    fs.unlinkSync(tempHtml);
    await browser.close();
}

captureScreenshot().catch(console.error);

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(distDir, reqPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(fs.readFileSync(filePath));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(4567, async () => {
  console.log('Static test server listening on port 4567');
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    errors.push(err.message);
  });

  try {
    await page.goto('http://localhost:4567');
    console.log('Page loaded successfully');

    // 1. Verify Logo image is rendered in header
    const logoImg = page.locator('img.brand-logo-img');
    await logoImg.waitFor();
    const logoSrc = await logoImg.getAttribute('src');
    console.log('Header logo image verified:', logoSrc);
    if (!logoSrc || !logoSrc.includes('logo.svg')) {
      throw new Error(`Expected logo.svg, got ${logoSrc}`);
    }

    // 2. Verify Canvas is rendered
    const canvas = page.locator('canvas#stage');
    await canvas.waitFor();
    console.log('Canvas is present');

    // 3. Verify Cells List contains initial 7 cells with Photoshop layer styling
    const cellItems = page.locator('.cell-item');
    const initialCellCount = await cellItems.count();
    console.log('Initial layer cell count:', initialCellCount);
    if (initialCellCount !== 7) {
      throw new Error(`Expected 7 cells, got ${initialCellCount}`);
    }

    // Verify layer eye icon
    const eyeIcons = page.locator('.layer-visibility-icon');
    const eyeCount = await eyeIcons.count();
    console.log('Photoshop layer eye icons present:', eyeCount);
    if (eyeCount !== 7) {
      throw new Error(`Expected 7 eye icons, got ${eyeCount}`);
    }

    // 4. Test CNN cell selection & preview (index 1)
    await cellItems.nth(1).click();
    await page.waitForTimeout(100);
    const kernelLabel = await page.getByText(/Kernel Size/i);
    await kernelLabel.waitFor();
    const cnnTimeText = await page.locator('.preview-player-time').innerText();
    console.log('CNN cell preview time verified:', cnnTimeText);
    if (!cnnTimeText.startsWith('00:17.')) {
      throw new Error(`Expected CNN preview time around 00:17.x, got ${cnnTimeText}`);
    }

    // 4b. Test Eye icon click (seek to start of cell)
    const eyeIconCnn = page.locator('.layer-visibility-icon').nth(1);
    await eyeIconCnn.click();
    await page.waitForTimeout(100);
    const cnnStartTime = await page.locator('.preview-player-time').innerText();
    console.log('CNN cell start time via eye icon:', cnnStartTime);
    if (!cnnStartTime.startsWith('00:14.')) {
      throw new Error(`Expected CNN start time around 00:14.x, got ${cnnStartTime}`);
    }

    // 5. Test RNN cell inspector (index 2)
    await cellItems.nth(2).click();
    await page.waitForTimeout(100);
    const rnnTokens = await page.getByText(/Input Sequence Tokens/i);
    await rnnTokens.waitFor();
    console.log('RNN inspector verified');

    // 6. Test LSTM cell inspector (index 3)
    await cellItems.nth(3).click();
    await page.waitForTimeout(100);
    const lstmGate = await page.getByText(/Highlight Gate Mechanism/i);
    await lstmGate.waitFor();
    console.log('LSTM inspector verified');

    // 7. Test YOLO cell inspector (index 4)
    await cellItems.nth(4).click();
    await page.waitForTimeout(100);
    const yoloGrid = await page.getByText(/S × S Grid Cells/i);
    await yoloGrid.waitFor();
    console.log('YOLO inspector verified');

    // 8. Test Matplotlib cell inspector (index 5)
    await cellItems.nth(5).click();
    await page.waitForTimeout(100);
    const pltCode = await page.getByText(/Matplotlib Python Script/i);
    await pltCode.waitFor();
    console.log('Matplotlib inspector verified');

    // 9. Test AI/ML dropdown menu to add an ANN cell
    const aiMenuBtn = page.getByRole('button', { name: /AI \/ ML Models/i });
    await aiMenuBtn.click();
    const dropdownAnn = page.locator('.ai-menu-item').filter({ hasText: 'ANN (Multi-Layer Perceptron)' });
    await dropdownAnn.waitFor();
    await dropdownAnn.click();

    const countAfterAdd = await cellItems.count();
    console.log('Cell count after adding new ANN cell:', countAfterAdd);
    if (countAfterAdd !== 8) {
      throw new Error(`Expected 8 cells, got ${countAfterAdd}`);
    }

    // 10. Test Play button
    const playBtn = page.locator('.controls-row').getByRole('button', { name: 'Play', exact: true });
    await playBtn.click();
    console.log('Clicked Play button');

    await page.waitForTimeout(600);
    const timeDisplay = await page.locator('.time-display').innerText();
    console.log('Time display during playback:', timeDisplay);

    // 11. Test Reset button
    const resetBtn = page.locator('.controls-row').getByRole('button', { name: 'Reset', exact: true });
    await resetBtn.click();
    const timeDisplayAfterReset = await page.locator('.time-display').innerText();
    console.log('Time display after Reset:', timeDisplayAfterReset);

    // 11b. Test Video Forward & Backward Keyboard Shortcuts
    console.log('Testing ArrowRight and ArrowLeft keybindings...');
    // Step forward 1s with ArrowRight
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);
    let timeText = await page.locator('.preview-player-time').innerText();
    console.log('Time after ArrowRight (+1s):', timeText);
    if (!timeText.startsWith('00:01.0')) {
      throw new Error(`Expected time around 00:01.0, got ${timeText}`);
    }

    // Step forward 5s with Shift+ArrowRight
    await page.keyboard.press('Shift+ArrowRight');
    await page.waitForTimeout(100);
    timeText = await page.locator('.preview-player-time').innerText();
    console.log('Time after Shift+ArrowRight (+5s):', timeText);
    if (!timeText.startsWith('00:06.0')) {
      throw new Error(`Expected time around 00:06.0, got ${timeText}`);
    }

    // Step backward 1s with ArrowLeft
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(100);
    timeText = await page.locator('.preview-player-time').innerText();
    console.log('Time after ArrowLeft (-1s):', timeText);
    if (!timeText.startsWith('00:05.0')) {
      throw new Error(`Expected time around 00:05.0, got ${timeText}`);
    }

    // Step backward 5s with Shift+ArrowLeft
    await page.keyboard.press('Shift+ArrowLeft');
    await page.waitForTimeout(100);
    timeText = await page.locator('.preview-player-time').innerText();
    console.log('Time after Shift+ArrowLeft (-5s):', timeText);
    if (!timeText.startsWith('00:00.0')) {
      throw new Error(`Expected time around 00:00.0, got ${timeText}`);
    }

    // Test SkipForward and SkipBack buttons in preview controls
    const skipFwdBtn = page.locator('button[aria-label="Step forward 1 second"]');
    await skipFwdBtn.click();
    await page.waitForTimeout(100);
    timeText = await page.locator('.preview-player-time').innerText();
    console.log('Time after clicking SkipForward button (+1s):', timeText);
    if (!timeText.startsWith('00:01.0')) {
      throw new Error(`Expected time around 00:01.0, got ${timeText}`);
    }

    const skipBackBtn = page.locator('button[aria-label="Step backward 1 second"]');
    await skipBackBtn.click();
    await page.waitForTimeout(100);
    timeText = await page.locator('.preview-player-time').innerText();
    console.log('Time after clicking SkipBack button (-1s):', timeText);
    if (!timeText.startsWith('00:00.0')) {
      throw new Error(`Expected time around 00:00.0, got ${timeText}`);
    }

    // 11c. Test Fullscreen Mode and Fullscreen Controls CSS
    console.log('Testing Fullscreen View and Controls CSS...');
    const fullscreenToggleBtn = page.locator('button[aria-label="Enter fullscreen"]');
    await fullscreenToggleBtn.click();
    await page.waitForTimeout(200);

    const previewContainer = page.locator('.preview-container');
    const isFullscreenActive = await previewContainer.evaluate((el) => {
      return el.classList.contains('preview-fullscreen');
    });
    console.log('Fullscreen class active:', isFullscreenActive);
    if (!isFullscreenActive) {
      throw new Error('Expected preview container to have preview-fullscreen class');
    }

    // Verify fullscreen controls styles
    const controlsStyle = await page.locator('.preview-player-controls').evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        position: computed.position,
        zIndex: computed.zIndex,
        display: computed.display,
      };
    });
    console.log('Fullscreen controls computed styles:', controlsStyle);
    if (controlsStyle.position !== 'absolute') {
      throw new Error(`Expected position absolute for fullscreen controls, got ${controlsStyle.position}`);
    }

    // Test Exit Fullscreen button
    const exitFullscreenBtn = page.locator('.preview-fullscreen-close-btn');
    await exitFullscreenBtn.waitFor();
    await exitFullscreenBtn.click();
    await page.waitForTimeout(200);

    const isFullscreenAfterExit = await previewContainer.evaluate((el) => {
      return el.classList.contains('preview-fullscreen');
    });
    console.log('Fullscreen active after exit:', isFullscreenAfterExit);
    if (isFullscreenAfterExit) {
      throw new Error('Expected preview-fullscreen class to be removed after clicking exit button');
    }

    // Test F key for fullscreen toggle
    await page.keyboard.press('KeyF');
    await page.waitForTimeout(200);
    const isFullscreenViaF = await previewContainer.evaluate((el) => el.classList.contains('preview-fullscreen'));
    console.log('Fullscreen active after pressing F:', isFullscreenViaF);
    if (!isFullscreenViaF) {
      throw new Error('Expected fullscreen to toggle on pressing F');
    }

    await page.keyboard.press('KeyF');
    await page.waitForTimeout(200);
    const isFullscreenAfterFExit = await previewContainer.evaluate((el) => el.classList.contains('preview-fullscreen'));
    console.log('Fullscreen active after pressing F again:', isFullscreenAfterFExit);
    if (isFullscreenAfterFExit) {
      throw new Error('Expected fullscreen to exit on pressing F again');
    }

    // 12. Test MP4 Export Download
    console.log('Testing MP4 Export...');
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
    const saveAllBtn = page.getByRole('button', { name: /Save All/i });
    await saveAllBtn.click();
    await page.waitForTimeout(300);
    const stopSaveBtn = page.getByRole('button', { name: /Stop & Save/i });
    await stopSaveBtn.click();

    const download = await downloadPromise;
    const downloadFilename = download.suggestedFilename();
    console.log('Exported file name:', downloadFilename);
    if (!downloadFilename.endsWith('.mp4')) {
      throw new Error(`Expected .mp4 export filename, got: ${downloadFilename}`);
    }

    // 13. Test Delete cell
    const deleteBtn = page.locator('.cell-action-btn.danger').last();
    await deleteBtn.click();
    const finalCount = await cellItems.count();
    console.log('Cell count after deleting:', finalCount);

    if (errors.length > 0) {
      console.error('Page errors encountered:', errors);
      process.exit(1);
    } else {
      console.log('ALL TESTS (MP4 EXPORT + LOGO.SVG + PHOTOSHOP LAYERS + MODULAR CSS) PASSED!');
    }
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
    server.close();
  }
});

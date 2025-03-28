
import { test } from '@playwright/test';
import { expect } from '@playwright/test';

test('DebugButton_2025-03-28', async ({ page, context }) => {
  
    // Navigate to URL
    await page.goto('http://localhost:3000');

    // Take screenshot
    await page.screenshot({ path: 'homepage.png', { fullPage: true } });

    // Click element
    await page.click('text=Start Researching');

    // Take screenshot
    await page.screenshot({ path: 'research-page.png' });

    // Take screenshot
    await page.screenshot({ path: 'scrolled-down.png' });

    // Take screenshot
    await page.screenshot({ path: 'final-report-section.png' });

    // Click element
    await page.click('text=Debug: Add Sample Content');

    // Take screenshot
    await page.screenshot({ path: 'after-clicking-debug.png' });

    // Take screenshot
    await page.screenshot({ path: 'word-count-area.png' });
});
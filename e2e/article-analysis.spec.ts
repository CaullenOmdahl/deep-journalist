import { test, expect } from '@playwright/test';

test.describe('Article Analysis Flow', () => {
  const TEST_ARTICLE_URL = 'https://example.com/test-article';

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should analyze an article successfully', async ({ page }) => {
    // Enter article URL
    await page.fill('[data-testid="url-input"]', TEST_ARTICLE_URL);
    await page.click('[data-testid="analyze-button"]');

    // Wait for analysis to complete
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="research-results"]')).toBeVisible({ timeout: 30000 });

    // Verify results are displayed
    await expect(page.locator('[data-testid="sources-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="bias-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="fact-check-section"]')).toBeVisible();

    // Check sidebar statistics
    await expect(page.locator('[data-testid="source-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="credibility-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="bias-score"]')).toBeVisible();
  });

  test('should handle invalid URLs', async ({ page }) => {
    // Enter invalid URL
    await page.fill('[data-testid="url-input"]', 'not-a-url');
    await expect(page.locator('[data-testid="analyze-button"]')).toBeDisabled();

    // Enter malformed URL
    await page.fill('[data-testid="url-input"]', 'http://');
    await expect(page.locator('[data-testid="analyze-button"]')).toBeDisabled();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error response
    await page.route('**/api/analyze', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    // Attempt analysis
    await page.fill('[data-testid="url-input"]', TEST_ARTICLE_URL);
    await page.click('[data-testid="analyze-button"]');

    // Verify error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  test('should clear analysis results', async ({ page }) => {
    // Enter article URL and analyze
    await page.fill('[data-testid="url-input"]', TEST_ARTICLE_URL);
    await page.click('[data-testid="analyze-button"]');
    await expect(page.locator('[data-testid="research-results"]')).toBeVisible({ timeout: 30000 });

    // Clear results
    await page.click('[data-testid="clear-button"]');

    // Verify results are cleared
    await expect(page.locator('[data-testid="research-results"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="url-input"]')).toBeEmpty();
  });

  test('should handle paywall detection', async ({ page }) => {
    // Mock paywall detection response
    await page.route('**/api/analyze', route => {
      route.fulfill({
        status: 402,
        body: JSON.stringify({ error: 'Paywall detected' })
      });
    });

    // Attempt analysis
    await page.fill('[data-testid="url-input"]', TEST_ARTICLE_URL);
    await page.click('[data-testid="analyze-button"]');

    // Verify paywall message
    await expect(page.locator('[data-testid="paywall-message"]')).toBeVisible();
  });

  test('performance requirements', async ({ page }) => {
    const startTime = Date.now();

    // Enter article URL and analyze
    await page.fill('[data-testid="url-input"]', TEST_ARTICLE_URL);
    await page.click('[data-testid="analyze-button"]');

    // Wait for analysis to complete
    await expect(page.locator('[data-testid="research-results"]')).toBeVisible({ timeout: 30000 });

    const analysisTime = Date.now() - startTime;
    expect(analysisTime).toBeLessThan(10000); // Analysis should complete within 10 seconds
  });
}); 
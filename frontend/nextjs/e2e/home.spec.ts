import { test, expect } from '@playwright/test';

test('home page loads correctly', async ({ page }) => {
  await page.goto('/');
  
  // Check if the page title is correct
  await expect(page).toHaveTitle(/Deep Journalist/);
  
  // Check if the main heading is present
  const heading = page.getByRole('heading', { level: 1 });
  await expect(heading).toBeVisible();
  
  // Check if the article input form is present
  const articleInput = page.getByPlaceholder('Paste your article here...');
  await expect(articleInput).toBeVisible();
  
  // Check if the analyze button is present
  const analyzeButton = page.getByRole('button', { name: /analyze/i });
  await expect(analyzeButton).toBeVisible();
});

test('article analysis flow', async ({ page }) => {
  await page.goto('/');
  
  // Type an article into the input
  const articleInput = page.getByPlaceholder('Paste your article here...');
  await articleInput.fill('This is a test article about climate change.');
  
  // Click the analyze button
  const analyzeButton = page.getByRole('button', { name: /analyze/i });
  await analyzeButton.click();
  
  // Wait for analysis results
  await expect(page.getByText(/Analysis Results/)).toBeVisible({ timeout: 30000 });
  
  // Check if bias score is displayed
  await expect(page.getByText(/Bias Score/)).toBeVisible();
  
  // Check if source verification is displayed
  await expect(page.getByText(/Source Verification/)).toBeVisible();
});

test.describe('Home Page', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check if the title is present
    await expect(page.getByRole('heading', { name: 'Deep Journalist' })).toBeVisible();
    
    // Check if the description is present
    await expect(page.getByText('AI-powered journalistic research assistant')).toBeVisible();
    
    // Check if the textarea is present
    const textarea = page.getByPlaceholder('Paste your article here...');
    await expect(textarea).toBeVisible();
    
    // Check if the analyze button is present
    const analyzeButton = page.getByRole('button', { name: 'Analyze Article' });
    await expect(analyzeButton).toBeVisible();
  });

  test('should show error when submitting empty article', async ({ page }) => {
    await page.goto('/');
    
    // Click analyze without entering text
    await page.getByRole('button', { name: 'Analyze Article' }).click();
    
    // Check if error message appears
    await expect(page.getByText('Please enter an article to analyze')).toBeVisible();
  });

  test('should analyze article successfully', async ({ page }) => {
    await page.goto('/');
    
    // Enter test article
    await page.getByPlaceholder('Paste your article here...').fill('This is a test article about AI technology.');
    
    // Click analyze
    await page.getByRole('button', { name: 'Analyze Article' }).click();
    
    // Wait for analysis to complete and check results
    await expect(page.getByText('Bias Analysis')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Source Verification')).toBeVisible();
    await expect(page.getByText('Key Points')).toBeVisible();
  });

  test('should have main components visible', async ({ page }) => {
    await page.goto('/');
    
    // Check header
    const header = page.getByRole('banner');
    await expect(header).toBeVisible();
    await expect(header.getByRole('link', { name: 'Deep Journalist' })).toBeVisible();
    
    // Check hero section
    const hero = page.getByRole('region', { name: /hero/i });
    await expect(hero).toBeVisible();
    await expect(hero.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(hero.getByRole('textbox')).toBeVisible();
    await expect(hero.getByRole('button', { name: /analyze/i })).toBeVisible();
  });

  test('should be able to input URL and trigger analysis', async ({ page }) => {
    await page.goto('/');
    
    // Input a test URL
    const urlInput = page.getByRole('textbox');
    await urlInput.fill('https://example.com/test-article');
    
    // Click analyze button
    const analyzeButton = page.getByRole('button', { name: /analyze/i });
    await expect(analyzeButton).toBeEnabled();
    
    // We don't actually click the button here since it would trigger a real API call
    // In a real test, you might want to mock the API response
  });

  test('should show research sidebar when analysis is available', async ({ page }) => {
    await page.goto('/');
    
    // Since we need to mock the analysis state, we can use page.evaluate
    await page.evaluate(() => {
      window.history.pushState({}, '', '/?url=https://example.com/test-article');
    });
    
    // Check if research sidebar becomes visible
    const sidebar = page.getByRole('complementary');
    await expect(sidebar).toBeVisible();
    await expect(sidebar.getByText(/analysis/i)).toBeVisible();
  });
}); 
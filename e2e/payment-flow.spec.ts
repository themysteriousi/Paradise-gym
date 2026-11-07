import { test, expect } from '@playwright/test';

test.describe('Payments & Collections Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const demoBtn = page.getByRole('button', { name: /Explore Demo Mode/i });
    if (await demoBtn.isVisible()) {
      await demoBtn.click();
    }
  });

  test('views payment ledger and opens record payment modal', async ({ page }) => {
    await page.getByRole('button', { name: /Payments/i }).click();

    // Verify payments overview
    await expect(page.getByText(/Fee Collections & Receipts/i)).toBeVisible();

    // Verify Record Payment button
    const recordBtn = page.getByRole('button', { name: /Record Payment/i });
    await expect(recordBtn).toBeVisible();
    await recordBtn.click();

    // Modal opens
    await expect(page.getByText(/Record Member Fee/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Single/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Split/i })).toBeVisible();
  });
});


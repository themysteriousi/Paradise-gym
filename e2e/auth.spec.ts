import { test, expect } from '@playwright/test';

test.describe('Authentication & Dashboard Journey', () => {
  test('logs into demo mode and lands on operational dashboard', async ({ page }) => {
    await page.goto('/');

    // If on login page, click Explore Demo Mode
    const demoBtn = page.getByRole('button', { name: /Explore Demo Mode/i });
    if (await demoBtn.isVisible()) {
      await demoBtn.click();
    }

    // Verify main app shell is loaded
    await expect(page.getByText(/Paradise Gym/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Dashboard/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Members/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Attendance/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Payments/i })).toBeVisible();
  });
});


import { test, expect } from '@playwright/test';

test.describe('Attendance & Scanner Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const demoBtn = page.getByRole('button', { name: /Explore Demo Mode/i });
    if (await demoBtn.isVisible()) {
      await demoBtn.click();
    }
  });

  test('opens attendance tab and performs manual check-in search fallback', async ({ page }) => {
    await page.getByRole('button', { name: /Attendance/i }).click();

    await expect(page.getByText(/Attendance Check-In/i)).toBeVisible();

    // Verify manual search fallback input exists
    const manualInput = page.getByPlaceholder(/Search member name or phone/i);
    await expect(manualInput).toBeVisible();

    // Type a member name
    await manualInput.fill('Aarav');
    await expect(page.getByText(/Aarav Sharma/i).first()).toBeVisible();
  });
});


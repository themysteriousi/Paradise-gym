import { test, expect } from '@playwright/test';

test.describe('Member Lifecycle & Directory Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const demoBtn = page.getByRole('button', { name: /Explore Demo Mode/i });
    if (await demoBtn.isVisible()) {
      await demoBtn.click();
    }
  });

  test('navigates to members tab and searches for a member', async ({ page }) => {
    await page.getByRole('button', { name: /Members/i }).click();

    // Verify member search input is present
    const searchInput = page.getByPlaceholder(/Search by name or phone/i);
    await expect(searchInput).toBeVisible();

    // Search for a common demo member
    await searchInput.fill('Sharma');
    await expect(page.getByText(/Sharma/i).first()).toBeVisible();
  });
});

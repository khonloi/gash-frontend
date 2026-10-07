import { test, expect } from '@playwright/test';

test.describe('Cart Flow', () => {
  test('displays empty cart state on /cart when no items are added', async ({ page }) => {
    await page.goto('/cart');

    await expect(page.getByRole('heading', { name: 'Shopping Cart', level: 1 })).toBeVisible();
    await expect(page.getByText('Your cart is empty')).toBeVisible();

    const shopNowBtn = page.getByRole('link', { name: 'Shop Now' });
    await expect(shopNowBtn).toBeVisible();
    await shopNowBtn.click();
    await expect(page).toHaveURL('/');
  });

  test('toggles the cart drawer sidebar from the header navbar', async ({ page }) => {
    await page.goto('/');

    const cartIconBtn = page.getByRole('button', { name: /Open cart/i });
    await expect(cartIconBtn).toBeVisible();
    await cartIconBtn.click();

    // Verify drawer dialog appears
    const cartDrawer = page.getByRole('dialog', { name: /Shopping Cart Drawer/i });
    await expect(cartDrawer).toBeVisible();

    // Close drawer
    const closeBtn = page.getByRole('button', { name: /Close cart/i });
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    await expect(cartDrawer).not.toBeVisible();
  });
});

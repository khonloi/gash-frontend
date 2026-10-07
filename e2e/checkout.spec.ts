import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test('displays empty cart fallback when navigating to /checkout with no items', async ({
    page,
  }) => {
    await page.goto('/checkout');

    await expect(page.getByText('Your cart is empty')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Continue Shopping' })).toBeVisible();
  });

  test('loads checkout form with items present in cart storage', async ({ page }) => {
    // Inject cart items into localStorage before page load
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'jocksport-cart-storage',
        JSON.stringify({
          state: {
            items: [
              {
                id: 'p-1-default-default',
                productId: 'p-1',
                title: 'Nike Air Max 270',
                brand: 'Nike',
                price: 160,
                imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
                quantity: 1,
              },
            ],
          },
          version: 0,
        })
      );
    });

    await page.goto('/checkout');

    // Verify checkout form sections
    await expect(page.getByText('Contact Information')).toBeVisible();
    await expect(page.getByText('Shipping Address')).toBeVisible();
    await expect(page.getByText('Shipping Method')).toBeVisible();
    await expect(page.getByText('Payment Method')).toBeVisible();

    // Verify item in summary
    await expect(page.getByText('Nike Air Max 270')).toBeVisible();

    // Trigger validation error on empty fields
    const submitBtn = page.getByRole('button', { name: /Complete Order/i });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    await expect(page.getByText('Email or phone number is required.')).toBeVisible();
  });
});

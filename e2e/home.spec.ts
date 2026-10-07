import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays correct title and branding', async ({ page }) => {
    await expect(page).toHaveTitle(/JOCKSPORT/i);
    const mainHeading = page.locator('h1').first();
    await expect(mainHeading).toBeVisible();
  });

  test('renders header navigation links', async ({ page }) => {
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();

    // Check brand logo link
    const logoLink = page.getByRole('link', { name: /JOCKSPORT/i }).first();
    await expect(logoLink).toBeVisible();

    // Check main collection links
    const runningLink = page.getByRole('link', { name: /^Running$/i }).first();
    await expect(runningLink).toBeVisible();
  });

  test('renders hero carousel with interactive navigation controls', async ({ page }) => {
    const carouselSection = page.getByRole('region', { name: /Featured promotions/i });
    await expect(carouselSection).toBeVisible();

    // Carousel buttons
    const nextBtn = page.getByRole('button', { name: /Next slide/i });
    const prevBtn = page.getByRole('button', { name: /Previous slide/i });
    await expect(nextBtn).toBeVisible();
    await expect(prevBtn).toBeVisible();

    // Click next slide
    await nextBtn.click();

    // Slide indicator dots
    const dots = page.getByRole('tablist', { name: /Carousel slides/i });
    await expect(dots).toBeVisible();
  });

  test('renders value guarantee trust features', async ({ page }) => {
    await expect(page.getByText(/100% Genuine Guarantee/i)).toBeVisible();
    await expect(page.getByText(/Fast & Free Shipping/i)).toBeVisible();
  });
});

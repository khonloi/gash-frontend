import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CheckoutError from './error';

describe('CheckoutError Boundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders checkout error reassurance and safe cart recovery action', () => {
    const error = new Error('Payment gateway timeout');
    const reset = vi.fn();

    render(<CheckoutError error={error} reset={reset} />);

    expect(
      screen.getByRole('heading', { level: 2, name: /checkout session interrupted/i })
    ).toBeDefined();
    expect(screen.getByText(/no payment or card was charged/i)).toBeDefined();
    expect(screen.getByText('Checkout Error')).toBeDefined();

    const retryButton = screen.getByRole('button', { name: /retry checkout/i });
    fireEvent.click(retryButton);
    expect(reset).toHaveBeenCalledTimes(1);

    const cartLink = screen.getByRole('link', { name: /return to cart/i });
    expect(cartLink.getAttribute('href')).toBe('/cart');
  });
});

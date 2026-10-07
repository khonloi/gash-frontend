import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CartError from './error';

describe('CartError Boundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders cart error information with customized recovery options', () => {
    const error = new Error('Cart sync failed');
    const reset = vi.fn();

    render(<CartError error={error} reset={reset} />);

    expect(
      screen.getByRole('heading', { level: 2, name: /unable to load your shopping cart/i })
    ).toBeDefined();
    expect(screen.getByText(/selections are safely preserved/i)).toBeDefined();
    expect(screen.getByText('Cart Error')).toBeDefined();

    const reloadButton = screen.getByRole('button', { name: /reload cart/i });
    fireEvent.click(reloadButton);
    expect(reset).toHaveBeenCalledTimes(1);

    const browseLink = screen.getByRole('link', { name: /browse collections/i });
    expect(browseLink.getAttribute('href')).toBe('/collections/all');
  });
});

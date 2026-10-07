import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CollectionError from './error';

describe('CollectionError Boundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders collections category error and retry/browse links', () => {
    const error = new Error('Category fetch failure');
    const reset = vi.fn();

    render(<CollectionError error={error} reset={reset} />);

    expect(
      screen.getByRole('heading', { level: 2, name: /failed to load collection/i })
    ).toBeDefined();
    expect(screen.getByText('Catalog Error')).toBeDefined();

    const reloadButton = screen.getByRole('button', { name: /reload products/i });
    fireEvent.click(reloadButton);
    expect(reset).toHaveBeenCalledTimes(1);

    const allCollectionsLink = screen.getByRole('link', { name: /all collections/i });
    expect(allCollectionsLink.getAttribute('href')).toBe('/collections/all');
  });
});

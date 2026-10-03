import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CollectionControlBar } from './CollectionControlBar';

describe('CollectionControlBar', () => {
  it('renders total count correctly', () => {
    render(
      <CollectionControlBar
        totalCount={48}
        sortValue="featured"
        onSortChange={vi.fn()}
        viewMode="grid"
        onViewModeChange={vi.fn()}
      />
    );

    expect(screen.getByText('48')).toBeDefined();
    expect(screen.getByText(/Products/i)).toBeDefined();
  });

  it('triggers onSortChange when select value is updated', () => {
    const handleSortChange = vi.fn();
    render(
      <CollectionControlBar
        totalCount={48}
        sortValue="featured"
        onSortChange={handleSortChange}
        viewMode="grid"
        onViewModeChange={vi.fn()}
      />
    );

    const select = screen.getByLabelText('Sort by:');
    fireEvent.change(select, { target: { value: 'price_asc' } });

    expect(handleSortChange).toHaveBeenCalledWith('price_asc');
  });

  it('triggers onViewModeChange and sets aria-pressed correctly', () => {
    const handleViewModeChange = vi.fn();
    render(
      <CollectionControlBar
        totalCount={48}
        sortValue="featured"
        onSortChange={vi.fn()}
        viewMode="grid"
        onViewModeChange={handleViewModeChange}
      />
    );

    const gridBtn = screen.getByRole('button', { name: 'Grid view' });
    const listBtn = screen.getByRole('button', { name: 'List view' });

    expect(gridBtn.getAttribute('aria-pressed')).toBe('true');
    expect(listBtn.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(listBtn);
    expect(handleViewModeChange).toHaveBeenCalledWith('list');
  });
});

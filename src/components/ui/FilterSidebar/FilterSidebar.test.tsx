import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterSidebar, FilterCategory } from './FilterSidebar';

describe('FilterSidebar', () => {
  const mockCategories: FilterCategory[] = [
    {
      id: 'brand',
      title: 'Brand',
      type: 'checkbox',
      options: [
        { id: 'nike', label: 'Nike', count: 12 },
        { id: 'adidas', label: 'Adidas', count: 8 },
      ],
    },
    {
      id: 'color',
      title: 'Color',
      type: 'color',
      options: [
        { id: 'black', label: 'Black', colorCode: '#000000' },
        { id: 'white', label: 'White', colorCode: '#ffffff' },
      ],
    },
  ];

  it('renders filter categories and checkbox options', () => {
    render(
      <FilterSidebar categories={mockCategories} activeFilters={{}} onFilterChange={vi.fn()} />
    );

    expect(screen.getByText('Brand')).toBeDefined();
    expect(screen.getByText('Nike')).toBeDefined();
    expect(screen.getByText('Adidas')).toBeDefined();
  });

  it('calls onFilterChange when a checkbox option is toggled', () => {
    const handleFilterChange = vi.fn();
    render(
      <FilterSidebar
        categories={mockCategories}
        activeFilters={{}}
        onFilterChange={handleFilterChange}
      />
    );

    const nikeCheckbox = screen.getByLabelText(/Nike/i);
    fireEvent.click(nikeCheckbox);

    expect(handleFilterChange).toHaveBeenCalledWith('brand', 'nike');
  });

  it('renders active filter badge and calls onClearFilters when clear button is clicked', () => {
    const handleClear = vi.fn();
    render(
      <FilterSidebar
        categories={mockCategories}
        activeFilters={{ brand: ['nike'] }}
        onFilterChange={vi.fn()}
        onClearFilters={handleClear}
      />
    );

    const clearBtn = screen.getByRole('button', { name: /Clear all/i });
    expect(clearBtn).toBeDefined();

    fireEvent.click(clearBtn);
    expect(handleClear).toHaveBeenCalledTimes(1);
  });
});

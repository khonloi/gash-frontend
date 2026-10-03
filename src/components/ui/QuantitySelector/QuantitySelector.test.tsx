import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuantitySelector } from './QuantitySelector';

describe('QuantitySelector', () => {
  it('renders current value', () => {
    render(<QuantitySelector value={3} onChange={vi.fn()} />);
    expect(screen.getByText('3')).toBeDefined();
  });

  it('increments value on plus click', () => {
    const handleChange = vi.fn();
    render(<QuantitySelector value={2} onChange={handleChange} />);

    const plusBtn = screen.getByRole('button', { name: 'Increase quantity' });
    fireEvent.click(plusBtn);

    expect(handleChange).toHaveBeenCalledWith(3);
  });

  it('decrements value on minus click', () => {
    const handleChange = vi.fn();
    render(<QuantitySelector value={2} onChange={handleChange} min={1} />);

    const minusBtn = screen.getByRole('button', { name: 'Decrease quantity' });
    fireEvent.click(minusBtn);

    expect(handleChange).toHaveBeenCalledWith(1);
  });

  it('disables decrease button when value equals min', () => {
    render(<QuantitySelector value={1} onChange={vi.fn()} min={1} />);

    const minusBtn = screen.getByRole('button', { name: 'Decrease quantity' });
    expect(minusBtn.hasAttribute('disabled')).toBe(true);
  });

  it('disables increase button when value equals max', () => {
    render(<QuantitySelector value={5} onChange={vi.fn()} max={5} />);

    const plusBtn = screen.getByRole('button', { name: 'Increase quantity' });
    expect(plusBtn.hasAttribute('disabled')).toBe(true);
  });

  it('disables both buttons when disabled is true', () => {
    render(<QuantitySelector value={3} onChange={vi.fn()} disabled={true} />);

    const minusBtn = screen.getByRole('button', { name: 'Decrease quantity' });
    const plusBtn = screen.getByRole('button', { name: 'Increase quantity' });

    expect(minusBtn.hasAttribute('disabled')).toBe(true);
    expect(plusBtn.hasAttribute('disabled')).toBe(true);
  });
});

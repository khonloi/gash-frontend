import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HeroCarousel } from './HeroCarousel';

describe('HeroCarousel', () => {
  it('renders initial slide content correctly', () => {
    render(<HeroCarousel />);

    expect(screen.getByText('BACK TO YOUR ROUTINE')).toBeDefined();
    expect(screen.getByText('EXTRA 15% OFF*')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Previous slide' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Next slide' })).toBeDefined();
  });

  it('cycles to next and previous slides on arrow button clicks', () => {
    render(<HeroCarousel />);

    const nextBtn = screen.getByRole('button', { name: 'Next slide' });
    fireEvent.click(nextBtn);

    // After clicking next, slide 2 title should be active
    expect(screen.getByText('ULTRA BOOST & RUNNING')).toBeDefined();

    const prevBtn = screen.getByRole('button', { name: 'Previous slide' });
    fireEvent.click(prevBtn);

    // After clicking prev, slide 1 title should be active again
    expect(screen.getByText('BACK TO YOUR ROUTINE')).toBeDefined();
  });

  it('navigates to slide when dot indicator is clicked', () => {
    render(<HeroCarousel />);

    const slide3Dot = screen.getByRole('tab', { name: 'Go to slide 3' });
    fireEvent.click(slide3Dot);

    expect(screen.getByText('SUMMER TRAINING GEAR')).toBeDefined();
  });
});

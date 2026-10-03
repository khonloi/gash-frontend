import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SectionHeading } from './SectionHeading';

describe('SectionHeading', () => {
  it('renders heading with text', () => {
    render(<SectionHeading>Featured Products</SectionHeading>);
    expect(screen.getByRole('heading', { level: 2, name: 'Featured Products' })).toBeDefined();
  });

  it('renders custom heading level and subtitle', () => {
    render(
      <SectionHeading as="h3" subtitle="Explore the newest arrivals">
        New In
      </SectionHeading>
    );

    expect(screen.getByRole('heading', { level: 3, name: 'New In' })).toBeDefined();
    expect(screen.getByText('Explore the newest arrivals')).toBeDefined();
  });

  it('renders action element alongside heading', () => {
    render(<SectionHeading action={<a href="/all">View All</a>}>Trending</SectionHeading>);

    expect(screen.getByRole('link', { name: 'View All' })).toBeDefined();
  });
});

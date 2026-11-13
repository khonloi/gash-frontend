import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatWidget } from './ChatWidget';
import { useChatStore } from '@/store/useChatStore';

vi.mock('@/lib/socketClient', () => ({
  getChatSocket: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connected: true,
  })),
  disconnectChatSocket: vi.fn(),
}));

describe('ChatWidget Component', () => {
  beforeEach(() => {
    useChatStore.setState({
      isOpen: false,
      activeConversation: null,
      messages: [],
      unreadCount: 0,
      isAiTyping: false,
      isAgentTyping: false,
      aiStreamingText: '',
      draftContextCard: null,
    });
  });

  it('renders floating trigger button initially closed', () => {
    render(<ChatWidget />);
    const trigger = screen.getByRole('button', { name: /open support chat/i });
    expect(trigger).toBeDefined();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens chat dialog when floating trigger is clicked', () => {
    render(<ChatWidget />);
    const trigger = screen.getByRole('button', { name: /open support chat/i });
    fireEvent.click(trigger);

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText(/GASH AI Assistant/i)).toBeDefined();
  });

  it('closes chat dialog when close button is clicked', () => {
    useChatStore.setState({ isOpen: true });
    render(<ChatWidget />);

    const closeBtn = screen.getByRole('button', { name: /close chat/i });
    fireEvent.click(closeBtn);

    expect(useChatStore.getState().isOpen).toBe(false);
  });

  it('displays unread badge when unreadCount > 0 and closed', () => {
    useChatStore.setState({ unreadCount: 3, isOpen: false });
    render(<ChatWidget />);

    expect(screen.getByText('3')).toBeDefined();
  });
});

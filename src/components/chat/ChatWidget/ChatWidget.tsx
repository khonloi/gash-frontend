'use client';

import React, { useEffect } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { Badge } from '@/components/ui';
import { useChatStore } from '@/store/useChatStore';
import { useAuthStore } from '@/store/useAuthStore';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import styles from './ChatWidget.module.css';

export function ChatWidget() {
  const { isOpen, toggleChat, unreadCount, connectSocket, syncActiveConversation } = useChatStore();
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    const cleanup = connectSocket();
    return () => {
      cleanup();
    };
  }, [connectSocket, accessToken]);

  useEffect(() => {
    if (!isOpen || process.env.NODE_ENV === 'test') return;
    const interval = setInterval(() => {
      syncActiveConversation();
    }, 3000);
    return () => clearInterval(interval);
  }, [isOpen, syncActiveConversation]);

  return (
    <>
      {/* Floating Trigger Button */}
      <div className={styles.floatingTriggerWrap}>
        <button
          type="button"
          onClick={toggleChat}
          className={styles.floatingTrigger}
          aria-label={isOpen ? 'Close support chat' : 'Open support chat'}
        >
          {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        </button>
        {!isOpen && unreadCount > 0 && (
          <Badge variant="destructive" size="sm" className={styles.unreadBadge}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </div>

      {/* Chat Window Dialog */}
      {isOpen && (
        <div
          className={styles.chatContainer}
          role="dialog"
          aria-label="Customer Support and AI Assistant"
        >
          <ChatHeader />
          <MessageList />
          <ChatInput />
        </div>
      )}
    </>
  );
}

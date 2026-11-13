'use client';

import React, { useState } from 'react';
import { Send, X, Package, ShoppingBag } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useChatStore } from '@/store/useChatStore';
import styles from './ChatWidget.module.css';

export function ChatInput() {
  const [content, setContent] = useState('');
  const { sendMessage, isSending, draftContextCard, setDraftContextCard } = useChatStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSending) return;

    const messageText = content;
    setContent('');
    await sendMessage(messageText);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className={styles.inputArea}>
      {draftContextCard && (
        <div className={styles.draftCardBadge}>
          <div className={styles.draftCardIcon}>
            {draftContextCard.cardType === 'product' ? (
              <Package size={14} />
            ) : (
              <ShoppingBag size={14} />
            )}
          </div>
          <span className={styles.draftCardText}>
            Attached:{' '}
            {draftContextCard.product?.name ||
              draftContextCard.order?.orderNumber ||
              draftContextCard.cardType}
          </span>
          <button
            type="button"
            onClick={() => setDraftContextCard(null)}
            className={styles.removeDraftButton}
            aria-label="Remove attached card"
          >
            <X size={12} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.inputForm}>
        <div className={styles.inputWrap}>
          <Input
            type="text"
            size="md"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question, track an order, or find products..."
            disabled={isSending}
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          size="icon"
          disabled={!content.trim() || isSending}
          aria-label="Send message"
        >
          <Send size={16} />
        </Button>
      </form>
    </div>
  );
}

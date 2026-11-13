'use client';

import React from 'react';
import { Sparkles, Headphones, User, AlertCircle } from 'lucide-react';
import { ChatMessage } from '@/types/chat';
import { ContextCard } from './ContextCard';
import clsx from 'clsx';
import styles from './ChatWidget.module.css';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isCustomer = message.senderType === 'customer' || message.senderType === 'guest';
  const isAi = message.senderType === 'ai';
  const isSystem = message.senderType === 'system';

  if (isSystem) {
    return (
      <div className={styles.systemMessageContainer}>
        <div className={styles.systemMessage}>
          <AlertCircle size={14} />
          <span>{message.content}</span>
        </div>
      </div>
    );
  }

  const timeFormatted = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div
      className={clsx(
        styles.messageRow,
        isCustomer ? styles.messageRowRight : styles.messageRowLeft
      )}
    >
      {!isCustomer && (
        <div className={clsx(styles.messageAvatar, isAi ? styles.avatarAi : styles.avatarAgent)}>
          {isAi ? <Sparkles size={16} /> : <Headphones size={16} />}
        </div>
      )}

      <div className={styles.messageBubbleContainer}>
        {!isCustomer && (
          <span className={styles.senderName}>
            {isAi
              ? 'GASH AI Assistant'
              : message.senderUser
                ? `${message.senderUser.firstName} (Support Agent)`
                : 'Customer Support'}
          </span>
        )}

        <div
          className={clsx(
            styles.messageBubble,
            isCustomer ? styles.bubbleCustomer : styles.bubbleStaff
          )}
        >
          <div className={styles.messageText}>{message.content}</div>

          {message.contextCards && message.contextCards.length > 0 && (
            <div className={styles.cardsGrid}>
              {message.contextCards.map((card, idx) => (
                <ContextCard key={card._id || `card_${idx}`} card={card} />
              ))}
            </div>
          )}

          <div className={styles.messageFooter}>
            <span className={styles.messageTime}>{timeFormatted}</span>
          </div>
        </div>
      </div>

      {isCustomer && (
        <div className={clsx(styles.messageAvatar, styles.avatarCustomer)}>
          <User size={16} />
        </div>
      )}
    </div>
  );
}

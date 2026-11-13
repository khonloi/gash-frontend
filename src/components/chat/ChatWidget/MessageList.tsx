'use client';

import React, { useEffect, useRef } from 'react';
import { Sparkles, Headphones } from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';
import { MessageBubble } from './MessageBubble';
import styles from './ChatWidget.module.css';

export function MessageList() {
  const { messages, isLoading, isAiTyping, isAgentTyping, aiStreamingText } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof bottomRef.current?.scrollIntoView === 'function') {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAiTyping, isAgentTyping, aiStreamingText]);

  return (
    <div className={styles.messageList}>
      {isLoading && messages.length === 0 ? (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner} />
          <span>Connecting to chat...</span>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <MessageBubble key={message._id} message={message} />
          ))}

          {/* AI text streaming chunk buffer */}
          {aiStreamingText && (
            <div className={styles.messageRow}>
              <div className={styles.messageAvatar}>
                <Sparkles size={16} />
              </div>
              <div className={styles.messageBubbleContainer}>
                <span className={styles.senderName}>GASH AI Assistant</span>
                <div className={styles.messageBubble}>
                  <div className={styles.messageText}>{aiStreamingText}</div>
                </div>
              </div>
            </div>
          )}

          {/* Typing Indicator */}
          {(isAiTyping || isAgentTyping) && !aiStreamingText && (
            <div className={styles.typingIndicatorRow}>
              <div className={styles.typingAvatar}>
                {isAiTyping ? <Sparkles size={14} /> : <Headphones size={14} />}
              </div>
              <div className={styles.typingBubble}>
                <span className={styles.typingDot} />
                <span className={styles.typingDot} />
                <span className={styles.typingDot} />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </>
      )}
    </div>
  );
}

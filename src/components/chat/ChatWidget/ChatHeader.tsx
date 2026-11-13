'use client';

import React from 'react';
import { Sparkles, Headphones, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui';
import { useChatStore } from '@/store/useChatStore';
import clsx from 'clsx';
import styles from './ChatWidget.module.css';

export function ChatHeader() {
  const { activeConversation, closeChat, requestHandoff, startNewConversation } = useChatStore();

  const isSupport = activeConversation?.mode === 'support' || activeConversation?.mode === 'seller';
  const isBot = !isSupport;
  const isFinished =
    activeConversation?.status === 'resolved' || activeConversation?.status === 'closed';

  const handleEscalate = () => {
    requestHandoff('Customer requested human support via header button');
  };

  return (
    <div className={styles.chatHeader}>
      <div className={styles.chatHeaderInfo}>
        <div
          className={clsx(
            styles.headerAvatar,
            isBot ? styles.headerAvatarBot : styles.headerAvatarAgent
          )}
        >
          {isBot ? <Sparkles size={18} /> : <Headphones size={18} />}
        </div>
        <div>
          <h3 className={styles.chatHeaderTitle}>
            {isBot ? 'GASH AI Assistant' : 'GASH Live Support'}
          </h3>
          <div className={styles.chatHeaderSubtitle}>
            <span
              className={clsx(
                styles.statusDot,
                isBot ? styles.statusDotBot : styles.statusDotAgent
              )}
            />
            <span>
              {activeConversation?.status === 'resolved'
                ? 'Conversation Resolved'
                : activeConversation?.status === 'closed'
                  ? 'Conversation Closed'
                  : isBot
                    ? 'Automated Assistant'
                    : activeConversation?.status === 'queued'
                      ? 'Connecting to Support Agent...'
                      : activeConversation?.assignedAgent?.firstName
                        ? `Live Support • ${activeConversation.assignedAgent.firstName}`
                        : 'Live Support Active'}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.chatHeaderActions}>
        {(isBot || activeConversation?.status === 'resolved') && (
          <Button
            type="button"
            variant="pill-green"
            size="sm"
            onClick={handleEscalate}
            leftIcon={<Headphones size={13} />}
            title="Talk to a human representative"
          >
            Live Agent
          </Button>
        )}

        {isFinished && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={startNewConversation}
            leftIcon={<RotateCcw size={13} />}
            title="Start a new conversation"
          >
            New Chat
          </Button>
        )}

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={closeChat}
          className={styles.closeButton}
          aria-label="Close chat"
        >
          <X size={18} />
        </Button>
      </div>
    </div>
  );
}

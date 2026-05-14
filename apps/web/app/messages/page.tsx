'use client';

import { Loader2, LogIn, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '../../components/auth/auth-provider';
import { MessageComposer } from '../../components/messages/message-composer';
import { MessageFilters, type MessageFilterState } from '../../components/messages/message-filters';
import { MessageItem } from '../../components/messages/message-item';
import { ApiError } from '../../lib/api-client';
import {
  createMessage,
  deleteMessage,
  listMessages,
  updateMessage,
  type Message,
  type MessageInput,
  type ListMessagesParams,
} from '../../lib/messages-api';
import { listUsers, type UserSummary } from '../../lib/users-api';

const pageSize = 5;

export default function MessagesPage() {
  const { status, user } = useAuth();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [filters, setFilters] = useState<MessageFilterState>({
    tag: '',
    authorId: '',
    from: '',
    to: '',
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    listUsers()
      .then((items) => {
        if (isMounted) {
          setUsers(items);
        }
      })
      .catch(() => {
        if (isMounted) {
          setUsers([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const loadFirstPage = useCallback(async () => {
    setIsInitialLoading(true);
    setFeedError(null);

    try {
      const response = await listMessages({
        limit: pageSize,
        ...toApiFilters(filters),
      });

      setMessages(response.items);
      setNextCursor(response.nextCursor);
    } catch (error) {
      setFeedError(getErrorMessage(error, 'Could not load messages.'));
      setMessages([]);
      setNextCursor(null);
    } finally {
      setIsInitialLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || isInitialLoading || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);

    try {
      const response = await listMessages({
        limit: pageSize,
        cursor: nextCursor,
        ...toApiFilters(filters),
      });

      setMessages((current) => mergeMessages(current, response.items));
      setNextCursor(response.nextCursor);
    } catch (error) {
      setFeedError(getErrorMessage(error, 'Could not load more messages.'));
    } finally {
      setIsLoadingMore(false);
    }
  }, [filters, isInitialLoading, isLoadingMore, nextCursor]);

  useEffect(() => {
    const node = sentinelRef.current;

    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore();
        }
      },
      { rootMargin: '240px 0px' },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [loadMore]);

  async function handleCreate(input: MessageInput) {
    await createMessage(input);
    await loadFirstPage();
  }

  async function handleUpdate(id: string, input: Partial<MessageInput>) {
    await updateMessage(id, input);
    await loadFirstPage();
  }

  async function handleDelete(id: string) {
    await deleteMessage(id);
    setMessages((current) => current.filter((message) => message.id !== id));
  }

  return (
    <section className="page messages-page">
      <header className="messages-header">
        <div>
          <h1 className="messages-title">Messages</h1>
          <p className="messages-subtitle">Browse the feed, filter it down, and post when signed in.</p>
        </div>
        {status === 'anonymous' ? (
          <Link className="button button-primary" href="/login?next=/messages">
            <LogIn aria-hidden="true" />
            <span>Login</span>
          </Link>
        ) : null}
      </header>

      <div className="messages-layout">
        <aside className="messages-sidebar">
          <MessageComposer authStatus={status} onCreate={handleCreate} />
          <MessageFilters users={users} value={filters} onChange={setFilters} />
        </aside>

        <div className="feed-column">
          {feedError ? <div className="alert alert-error">{feedError}</div> : null}

          {isInitialLoading ? (
            <div className="feed-status">
              <Loader2 aria-hidden="true" className="spin" />
              <span>Loading messages</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="empty-feed">
              <MessageCircle aria-hidden="true" />
              <h2>No messages found</h2>
              <p>Try clearing the filters or posting a new message.</p>
            </div>
          ) : (
            <div className="message-list" aria-live="polite">
              {messages.map((message) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  canManage={user?.id === message.author.id}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          <div ref={sentinelRef} className="feed-sentinel" aria-hidden="true" />

          {!isInitialLoading && messages.length > 0 ? (
            <div className="feed-footer">
              {isLoadingMore ? (
                <>
                  <Loader2 aria-hidden="true" className="spin" />
                  <span>Loading more</span>
                </>
              ) : nextCursor ? (
                <span>Scroll for more</span>
              ) : (
                <span>End of feed</span>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function toApiFilters(filters: MessageFilterState): ListMessagesParams {
  const params: ListMessagesParams = {};
  const tag = filters.tag.trim();
  const from = toIsoDate(filters.from);
  const to = toIsoDate(filters.to);

  if (tag) {
    params.tag = tag;
  }

  if (filters.authorId) {
    params.authorId = filters.authorId;
  }

  if (from) {
    params.from = from;
  }

  if (to) {
    params.to = to;
  }

  return params;
}

function toIsoDate(value: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function mergeMessages(current: Message[], next: Message[]): Message[] {
  const seen = new Set(current.map((message) => message.id));
  const merged = [...current];

  for (const message of next) {
    if (!seen.has(message.id)) {
      merged.push(message);
    }
  }

  return merged;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.details[0]?.message ?? error.message;
  }

  return fallback;
}

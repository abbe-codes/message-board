'use client';

import { Check, Pencil, Trash2, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { ApiError } from '../../lib/api-client';
import { type Message, type MessageInput } from '../../lib/messages-api';

interface MessageItemProps {
  message: Message;
  canManage: boolean;
  onUpdate: (id: string, input: Partial<MessageInput>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function MessageItem({ message, canManage, onUpdate, onDelete }: MessageItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [body, setBody] = useState(message.body);
  const [tag, setTag] = useState(message.tag);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      await onUpdate(message.id, {
        body,
        tag,
      });
      setIsEditing(false);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, 'Could not update message.'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this message?')) {
      return;
    }

    setError(null);
    setIsDeleting(true);

    try {
      await onDelete(message.id);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, 'Could not delete message.'));
      setIsDeleting(false);
    }
  }

  function cancelEdit() {
    setBody(message.body);
    setTag(message.tag);
    setError(null);
    setIsEditing(false);
  }

  return (
    <article className="message-card">
      <header className="message-card-header">
        <div>
          <div className="message-author">{message.author.displayName}</div>
          <time className="message-time" dateTime={message.createdAt}>
            {formatDate(message.createdAt)}
          </time>
        </div>
        <span className="tag-badge">{message.tag}</span>
      </header>

      {isEditing ? (
        <form className="form compact-form edit-form" onSubmit={handleSave}>
          {error ? <div className="alert alert-error">{error}</div> : null}

          <div className="field">
            <label htmlFor={`message-body-${message.id}`}>Message</label>
            <textarea
              id={`message-body-${message.id}`}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={240}
              rows={4}
              required
            />
            <span className="field-hint">{body.length}/240</span>
          </div>

          <div className="field">
            <label htmlFor={`message-tag-${message.id}`}>Tag</label>
            <input
              id={`message-tag-${message.id}`}
              value={tag}
              onChange={(event) => setTag(event.target.value)}
              maxLength={64}
              required
            />
          </div>

          <div className="message-actions">
            <button
              className="button button-primary"
              type="submit"
              disabled={isSaving || body.trim().length === 0 || tag.trim().length === 0}
            >
              <Check aria-hidden="true" />
              <span>{isSaving ? 'Saving' : 'Save'}</span>
            </button>
            <button className="button button-secondary" type="button" onClick={cancelEdit}>
              <X aria-hidden="true" />
              <span>Cancel</span>
            </button>
          </div>
        </form>
      ) : (
        <>
          {error ? <div className="alert alert-error">{error}</div> : null}
          <p className="message-body">{message.body}</p>
          {canManage ? (
            <div className="message-actions">
              <button className="button button-secondary" type="button" onClick={() => setIsEditing(true)}>
                <Pencil aria-hidden="true" />
                <span>Edit</span>
              </button>
              <button
                className="button button-danger"
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 aria-hidden="true" />
                <span>{isDeleting ? 'Deleting' : 'Delete'}</span>
              </button>
            </div>
          ) : null}
        </>
      )}
    </article>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.details[0]?.message ?? error.message;
  }

  return fallback;
}

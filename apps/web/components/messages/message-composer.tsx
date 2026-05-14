'use client';

import { LogIn, Send } from 'lucide-react';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';

import { ApiError } from '../../lib/api-client';
import { type MessageInput } from '../../lib/messages-api';

interface MessageComposerProps {
  authStatus: 'loading' | 'authenticated' | 'anonymous';
  onCreate: (input: MessageInput) => Promise<void>;
}

export function MessageComposer({ authStatus, onCreate }: MessageComposerProps) {
  const [body, setBody] = useState('');
  const [tag, setTag] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onCreate({ body, tag });
      setBody('');
      setTag('');
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (authStatus !== 'authenticated') {
    return (
      <section className="tool-panel composer-panel">
        <h2>Post a message</h2>
        <p className="tool-copy">Sign in to add a short message to the feed.</p>
        <Link className="button button-primary button-full" href="/login?next=/messages">
          <LogIn aria-hidden="true" />
          <span>Login to post</span>
        </Link>
      </section>
    );
  }

  return (
    <section className="tool-panel composer-panel">
      <h2>Post a message</h2>
      <form className="form compact-form" onSubmit={handleSubmit}>
        {error ? <div className="alert alert-error">{error}</div> : null}

        <div className="field">
          <label htmlFor="message-body">Message</label>
          <textarea
            id="message-body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={240}
            rows={5}
            required
          />
          <span className="field-hint">{body.length}/240</span>
        </div>

        <div className="field">
          <label htmlFor="message-tag">Tag</label>
          <input
            id="message-tag"
            value={tag}
            onChange={(event) => setTag(event.target.value)}
            maxLength={64}
            placeholder="general"
            required
          />
        </div>

        <button
          className="button button-primary button-full"
          type="submit"
          disabled={isSubmitting || body.trim().length === 0 || tag.trim().length === 0}
        >
          <Send aria-hidden="true" />
          <span>{isSubmitting ? 'Posting' : 'Post'}</span>
        </button>
      </form>
    </section>
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.details[0]?.message ?? error.message;
  }

  return 'Could not post message.';
}

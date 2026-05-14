'use client';

import { RotateCcw, Search } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { type UserSummary } from '../../lib/users-api';

export interface MessageFilterState {
  tag: string;
  authorId: string;
  from: string;
  to: string;
}

interface MessageFiltersProps {
  users: UserSummary[];
  value: MessageFilterState;
  onChange: (value: MessageFilterState) => void;
}

const emptyFilters: MessageFilterState = {
  tag: '',
  authorId: '',
  from: '',
  to: '',
};

export function MessageFilters({ users, value, onChange }: MessageFiltersProps) {
  const [draft, setDraft] = useState<MessageFilterState>(value);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onChange(draft);
  }

  function handleReset() {
    setDraft(emptyFilters);
    onChange(emptyFilters);
  }

  return (
    <section className="tool-panel filters-panel">
      <h2>Filters</h2>
      <form className="form compact-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="filter-tag">Tag</label>
          <input
            id="filter-tag"
            value={draft.tag}
            onChange={(event) => setDraft((current) => ({ ...current, tag: event.target.value }))}
            placeholder="work"
            maxLength={64}
          />
        </div>

        <div className="field">
          <label htmlFor="filter-user">User</label>
          <select
            id="filter-user"
            value={draft.authorId}
            onChange={(event) =>
              setDraft((current) => ({ ...current, authorId: event.target.value }))
            }
          >
            <option value="">All users</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.displayName}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="filter-from">From</label>
          <input
            id="filter-from"
            type="datetime-local"
            value={draft.from}
            onChange={(event) => setDraft((current) => ({ ...current, from: event.target.value }))}
          />
        </div>

        <div className="field">
          <label htmlFor="filter-to">To</label>
          <input
            id="filter-to"
            type="datetime-local"
            value={draft.to}
            onChange={(event) => setDraft((current) => ({ ...current, to: event.target.value }))}
          />
        </div>

        <div className="filter-actions">
          <button className="button button-primary" type="submit">
            <Search aria-hidden="true" />
            <span>Apply</span>
          </button>
          <button className="button button-secondary" type="button" onClick={handleReset}>
            <RotateCcw aria-hidden="true" />
            <span>Reset</span>
          </button>
        </div>
      </form>
    </section>
  );
}

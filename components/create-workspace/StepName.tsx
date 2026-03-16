'use client';

import { useState, useCallback, type KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import type { CreateWorkspaceData } from './types';

interface StepNameProps {
  data: CreateWorkspaceData;
  onUpdate: (partial: Partial<CreateWorkspaceData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const WORKSPACE_EMOJIS = [
  '🚀', '💼', '🎯', '⚡', '🔥', '💡', '🌟', '🎨',
  '🛠️', '📦', '🏗️', '🧪', '📊', '🌐', '🤖', '🎮',
];

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 44);
}

export default function StepName({ data, onUpdate, onNext, onBack }: StepNameProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const isValid = data.name.trim().length >= 1;
  const slug = slugify(data.name);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && isValid) {
      e.preventDefault();
      onNext();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onBack();
    }
  }, [isValid, onNext, onBack]);

  const inputStyles: React.CSSProperties = {
    width: '100%',
    padding: '14px 18px',
    borderRadius: 'var(--radius-lg)',
    border: '1.5px solid var(--border-100)',
    background: 'var(--bg-100)',
    fontSize: '16px',
    fontFamily: 'var(--font-sans)',
    color: 'var(--fg-100)',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box' as const,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '500px', margin: '0 auto' }}
    >
      {/* Emoji display / picker trigger */}
      <button
        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        style={{
          width: '64px',
          height: '64px',
          borderRadius: 'var(--radius-xl)',
          background: data.emoji
            ? 'var(--bg-200, var(--bg-100))'
            : 'linear-gradient(135deg, #ff4801, #ff7038)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1.5px solid var(--border-100)',
          cursor: 'pointer',
          fontSize: data.emoji ? '28px' : '0',
          marginBottom: '24px',
          transition: 'all 0.2s',
          boxShadow: data.emoji ? 'none' : '0 4px 16px rgba(255, 72, 1, 0.25)',
          position: 'relative',
        }}
        title="Choose an icon"
      >
        {data.emoji || (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        )}
      </button>
      <p
        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        style={{
          fontSize: '12px',
          color: 'var(--fg-muted)',
          fontFamily: 'var(--font-mono)',
          marginTop: '-16px',
          marginBottom: '20px',
          cursor: 'pointer',
          transition: 'color 0.2s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent-100)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--fg-muted)'; }}
      >
        Click to change icon
      </p>

      {/* Emoji picker dropdown */}
      {showEmojiPicker && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gap: '4px',
            padding: '12px',
            background: 'var(--bg-100)',
            border: '1.5px solid var(--border-100)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '20px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }}
        >
          {WORKSPACE_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onUpdate({ emoji });
                setShowEmojiPicker(false);
              }}
              style={{
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                borderRadius: '8px',
                border: 'none',
                background: data.emoji === emoji ? 'var(--bg-300, rgba(0,0,0,0.06))' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-300, rgba(0,0,0,0.06))'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = data.emoji === emoji ? 'var(--bg-300, rgba(0,0,0,0.06))' : 'transparent'; }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Heading */}
      <h1
        style={{
          fontSize: '34px',
          fontWeight: 800,
          color: 'var(--fg-100)',
          letterSpacing: '-0.03em',
          marginBottom: '10px',
          textAlign: 'center',
          fontFamily: 'var(--font-sans)',
        }}
      >
        Create a Workspace
      </h1>

      <p
        style={{
          fontSize: '16px',
          color: 'var(--fg-300)',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '-0.01em',
          textAlign: 'center',
          marginBottom: '36px',
        }}
      >
        A place to organize projects and collaborate.
      </p>

      {/* Name input */}
      <div style={{ width: '100%', marginBottom: '16px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--fg-100)',
            fontFamily: 'var(--font-sans)',
            marginBottom: '8px',
          }}
        >
          Workspace name
        </label>
        <input
          type="text"
          placeholder="e.g. My Startup, Design Team, Side Project..."
          value={data.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          onKeyDown={handleKeyDown}
          maxLength={100}
          autoFocus
          style={inputStyles}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 72, 1, 0.4)';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255, 72, 1, 0.08)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-100)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />

        {/* Slug preview */}
        {slug && (
          <p
            style={{
              marginTop: '8px',
              fontSize: '13px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--fg-muted)',
              letterSpacing: '-0.01em',
            }}
          >
            Slug: <span style={{ color: 'var(--accent-100)' }}>{slug}</span>
            <span style={{ opacity: 0.4 }}>-xxxx</span>
          </p>
        )}
      </div>

      {/* Description */}
      <div style={{ width: '100%', marginBottom: '8px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--fg-100)',
            fontFamily: 'var(--font-sans)',
            marginBottom: '8px',
          }}
        >
          Description <span style={{ fontWeight: 400, color: 'var(--fg-muted)' }}>(optional)</span>
        </label>
        <textarea
          placeholder="What will you build in this workspace?"
          value={data.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              onBack();
            }
          }}
          maxLength={200}
          rows={2}
          style={{
            ...inputStyles,
            resize: 'none',
            minHeight: '72px',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 72, 1, 0.4)';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255, 72, 1, 0.08)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-100)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
      </div>

      {/* Footer buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          marginTop: '24px',
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'var(--font-sans)',
            color: 'var(--fg-300)',
            padding: '10px 0',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--fg-100)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--fg-300)'; }}
        >
          Go back
        </button>
        <button
          onClick={() => { if (isValid) onNext(); }}
          disabled={!isValid}
          style={{
            padding: '12px 28px',
            borderRadius: 'var(--radius-lg)',
            border: 'none',
            background: isValid ? 'var(--accent-100)' : 'rgba(128,128,128,0.2)',
            color: isValid ? 'white' : 'var(--fg-muted)',
            fontSize: '15px',
            fontWeight: 700,
            fontFamily: 'var(--font-sans)',
            cursor: isValid ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { if (isValid) { e.currentTarget.style.background = 'var(--accent-200)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(255, 72, 1, 0.25)'; } }}
          onMouseLeave={(e) => { if (isValid) { e.currentTarget.style.background = 'var(--accent-100)'; e.currentTarget.style.boxShadow = 'none'; } }}
        >
          Continue
        </button>
      </div>
    </motion.div>
  );
}

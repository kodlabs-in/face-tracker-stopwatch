'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

type InfoHintProps = {
  label: string;
  text: string;
};

export function InfoHint({ label, text }: InfoHintProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const tooltipRef = useRef<HTMLSpanElement | null>(null);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current || !tooltipRef.current) {
      return;
    }

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const margin = 10;

    let left = buttonRect.right - tooltipRect.width;
    let top = buttonRect.bottom + 8;

    if (left < margin) {
      left = margin;
    }
    if (left + tooltipRect.width > window.innerWidth - margin) {
      left = window.innerWidth - tooltipRect.width - margin;
    }

    if (top + tooltipRect.height > window.innerHeight - margin) {
      top = buttonRect.top - tooltipRect.height - 8;
    }
    if (top < margin) {
      top = margin;
    }

    setPosition({ top, left });
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    const onResize = () => {
      setOpen(false);
    };

    document.addEventListener('keydown', onEscape);
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, { passive: true });

    return () => {
      document.removeEventListener('keydown', onEscape);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize);
    };
  }, [open]);

  return (
    <span className="info-hint-wrap">
      <button
        ref={buttonRef}
        type="button"
        className="info-hint-btn"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <svg viewBox="0 0 24 24" role="img" aria-hidden="true" className="info-hint-svg">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="10" x2="12" y2="16" />
          <circle cx="12" cy="7.3" r="0.8" />
        </svg>
      </button>
      <span
        ref={tooltipRef}
        className={`info-tooltip ${open ? 'open' : ''}`}
        role="tooltip"
        style={{ top: `${position.top}px`, left: `${position.left}px` }}
      >
        {text}
      </span>
    </span>
  );
}

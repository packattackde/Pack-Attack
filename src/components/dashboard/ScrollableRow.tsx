'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ScrollableRowProps {
  children: React.ReactNode;
  className?: string;
}

// Inject the WebKit scrollbar rule once per page load.
// This is the only reliable way to target ::-webkit-scrollbar from JS
// without a global CSS file.
const STYLE_ID = 'scrollable-row-hide-scrollbar';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = '.scrollable-row-inner::-webkit-scrollbar { display: none; }';
  document.head.appendChild(style);
}

export default function ScrollableRow({ children, className }: ScrollableRowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    updateScrollState();

    el.addEventListener('scroll', updateScrollState, { passive: true });

    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);

    return () => {
      el.removeEventListener('scroll', updateScrollState);
      observer.disconnect();
    };
  }, [updateScrollState]);

  const handleScrollLeft = () => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollBy({ left: -(el.clientWidth * 0.7), behavior: 'smooth' });
  };

  const handleScrollRight = () => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollBy({ left: el.clientWidth * 0.7, behavior: 'smooth' });
  };

  return (
    <div className={`relative group ${className ?? ''}`}>
      {/* Left arrow — visible only on group-hover, only when content is scrolled right */}
      {canScrollLeft && (
        <button
          onClick={handleScrollLeft}
          aria-label="Scroll left"
          className="
            absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10
            w-9 h-9 rounded-full flex items-center justify-center
            bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg
            opacity-0 group-hover:opacity-100
            transition-opacity duration-200
            hover:border-[rgba(200,79,255,0.3)]
          "
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
      )}

      {/* Scroll container — no visible scrollbar */}
      <div
        ref={containerRef}
        className="scrollable-row-inner flex overflow-x-auto"
        style={{
          scrollbarWidth: 'none',       // Firefox
          msOverflowStyle: 'none',      // IE / Edge legacy
        } as React.CSSProperties}
      >
        {children}
      </div>

      {/* Right arrow — visible only on group-hover, only when more content exists */}
      {canScrollRight && (
        <button
          onClick={handleScrollRight}
          aria-label="Scroll right"
          className="
            absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10
            w-9 h-9 rounded-full flex items-center justify-center
            bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg
            opacity-0 group-hover:opacity-100
            transition-opacity duration-200
            hover:border-[rgba(200,79,255,0.3)]
          "
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      )}
    </div>
  );
}

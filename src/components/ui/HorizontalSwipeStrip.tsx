import React, { useRef } from 'react';

interface HorizontalSwipeStripProps {
  ariaLabel: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Provides smooth native touch swiping on mobile/tablet and pointer-drag scrolling
 * on desktop while preventing accidental item clicks when the user is scrolling.
 * On `lg:` viewports and above, consumer layout classes expand into a clean grid.
 */
export const HorizontalSwipeStrip: React.FC<HorizontalSwipeStripProps> = ({
  ariaLabel,
  className = '',
  children,
}) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const pointerStateRef = useRef<{
    active: boolean;
    pointerId: number | null;
    pointerType: string;
    startX: number;
    startY: number;
    startScrollLeft: number;
    didDrag: boolean;
  }>({
    active: false,
    pointerId: null,
    pointerType: '',
    startX: 0,
    startY: 0,
    startScrollLeft: 0,
    didDrag: false,
  });

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el) return;
    // Only engage JS scroll-drag if the track actually overflows horizontally
    if (el.scrollWidth <= el.clientWidth + 2) {
      pointerStateRef.current.active = false;
      pointerStateRef.current.didDrag = false;
      return;
    }

    pointerStateRef.current = {
      active: true,
      pointerId: e.pointerId,
      pointerType: e.pointerType,
      startX: e.clientX,
      startY: e.clientY,
      startScrollLeft: el.scrollLeft,
      didDrag: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = pointerStateRef.current;
    const el = trackRef.current;
    if (!st.active || !el || st.pointerId !== e.pointerId) return;

    const dx = e.clientX - st.startX;
    const dy = e.clientY - st.startY;
    if (Math.hypot(dx, dy) > 8) {
      st.didDrag = true;
    }

    // For mouse pointers, translate horizontal drag directly to scrollLeft.
    // Touch/pen use native browser momentum scrolling via `.swipe-strip-x`.
    if (st.pointerType === 'mouse' && st.didDrag) {
      el.scrollLeft = st.startScrollLeft - dx;
    }
  };

  const clearPointerDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = pointerStateRef.current;
    if (st.pointerId !== e.pointerId) return;
    st.active = false;
    window.setTimeout(() => {
      if (pointerStateRef.current.pointerId === e.pointerId) {
        pointerStateRef.current.didDrag = false;
      }
    }, 60);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el || el.scrollWidth <= el.clientWidth + 2) return;
    // Allow horizontal mouse wheel or shift+wheel without trapping normal vertical scrolling
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    if (e.shiftKey && Math.abs(e.deltaY) > 0) {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    }
  };

  const handleClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (pointerStateRef.current.didDrag) {
      e.preventDefault();
      e.stopPropagation();
      pointerStateRef.current.didDrag = false;
    }
  };

  return (
    <div
      ref={trackRef}
      role="region"
      aria-label={ariaLabel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={clearPointerDrag}
      onPointerCancel={clearPointerDrag}
      onWheel={handleWheel}
      onClickCapture={handleClickCapture}
      className={`swipe-strip-x flex gap-2.5 overflow-x-auto pb-2 lg:grid lg:grid-cols-2 lg:overflow-visible lg:pb-0 ${className}`}
    >
      {children}
    </div>
  );
};

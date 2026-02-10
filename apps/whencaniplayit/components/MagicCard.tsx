'use client';

import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface MagicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  gradientSize?: number;
  gradientColor?: string;
  gradientOpacity?: number;
}

export function MagicCard({
  children,
  className,
  gradientSize = 200,
  gradientColor = '#ffffff',
  gradientOpacity = 0.1,
  ...props
}: MagicCardProps) {
  const mousePosition = useRef({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const divRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;

    const rect = divRef.current.getBoundingClientRect();
    mousePosition.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  return (
    <div
      ref={divRef}
      className={cn('group relative w-full overflow-hidden', className)}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {isHovering && (
        <div
          className="pointer-events-none absolute transition-opacity duration-300"
          style={{
            left: `${mousePosition.current.x}px`,
            top: `${mousePosition.current.y}px`,
            width: `${gradientSize}px`,
            height: `${gradientSize}px`,
            background: `radial-gradient(circle, ${gradientColor} 0%, transparent 70%)`,
            opacity: gradientOpacity,
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

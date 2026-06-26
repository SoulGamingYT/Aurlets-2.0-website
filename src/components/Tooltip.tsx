import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 0.15
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay * 1000);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  };

  const getAnimationVariants = () => {
    switch (position) {
      case 'top':
        return {
          initial: { opacity: 0, y: 4, scale: 0.95 },
          animate: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, y: 4, scale: 0.95 }
        };
      case 'bottom':
        return {
          initial: { opacity: 0, y: -4, scale: 0.95 },
          animate: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, y: -4, scale: 0.95 }
        };
      case 'left':
        return {
          initial: { opacity: 0, x: 4, scale: 0.95 },
          animate: { opacity: 1, x: 0, scale: 1 },
          exit: { opacity: 0, x: 4, scale: 0.95 }
        };
      case 'right':
        return {
          initial: { opacity: 0, x: -4, scale: 0.95 },
          animate: { opacity: 1, x: 0, scale: 1 },
          exit: { opacity: 0, x: -4, scale: 0.95 }
        };
    }
  };

  return (
    <div
      className="relative inline-flex items-center justify-center"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            variants={getAnimationVariants()}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className={`absolute z-50 px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-semibold font-mono tracking-wide text-zinc-100 shadow-xl pointer-events-none whitespace-nowrap flex items-center justify-center ${getPositionClasses()}`}
          >
            {content}
            {/* Arrow */}
            <div
              className={`absolute w-1.5 h-1.5 bg-zinc-900 border-zinc-800 rotate-45 pointer-events-none ${
                position === 'top'
                  ? 'top-full left-1/2 -translate-x-1/2 -translate-y-1/2 border-r border-b'
                  : position === 'bottom'
                  ? 'bottom-full left-1/2 -translate-x-1/2 translate-y-1/2 border-l border-t'
                  : position === 'left'
                  ? 'left-full top-1/2 -translate-x-1/2 -translate-y-1/2 border-t border-r'
                  : 'right-full top-1/2 translate-x-1/2 -translate-y-1/2 border-b border-l'
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

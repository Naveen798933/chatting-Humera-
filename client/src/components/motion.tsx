import React from 'react';

// Lightweight Framer Motion fallback wrapper for guaranteed zero dependency errors
export const motion = {
  div: React.forwardRef<HTMLDivElement, any>(({ children, className = '', initial, animate, exit, transition, ...props }, ref) => (
    <div ref={ref} className={`transition-all duration-300 ${className}`} {...props}>
      {children}
    </div>
  )),
};

export const AnimatePresence: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimateOnViewProps {
  children: React.ReactNode;
  className?: string;
  animationClass: string;
  threshold?: number;
  triggerOnce?: boolean;
}

export const AnimateOnView: React.FC<AnimateOnViewProps> = ({
  children,
  className,
  animationClass,
  threshold = 0.1,
  triggerOnce = true,
}) => {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (triggerOnce && ref.current) {
            observer.unobserve(ref.current);
          }
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [ref, threshold, triggerOnce]);

  return (
    <div ref={ref} className={cn(className, isInView ? animationClass : 'opacity-0')}>
      {children}
    </div>
  );
};

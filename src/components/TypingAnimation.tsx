import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useInView } from '@/hooks/useInView';

interface TypingAnimationProps {
  text: string;
  className?: string;
}

export const TypingAnimation: React.FC<TypingAnimationProps> = ({ text, className }) => {
  const [viewRef, isInView] = useInView({ threshold: 0.5, triggerOnce: true });
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const measurementRef = useRef<HTMLSpanElement>(null);

  const [randomDelay, setRandomDelay] = useState(0);

  useEffect(() => {
    setRandomDelay(Math.random() * 1.2);
  }, []);

  // 1. Measure the true width of the text
  useLayoutEffect(() => {
    if (measurementRef.current) {
      setMeasuredWidth(measurementRef.current.offsetWidth);
    }
  }, [text]);

  // 2. Render a placeholder until the element is in view and measured
  if (!isInView || measuredWidth === 0) {
    return (
      <div ref={viewRef} style={{ height: '1.2em' }} className={className}>
        {/* Hidden element for measurement */}
        <span ref={measurementRef} style={{ position: 'absolute', visibility: 'hidden' }}>
          {text}
        </span>
      </div>
    );
  }

  // 3. Once in view and measured, calculate animation properties
  const steps = text.length;
  const typingDuration = Math.max(steps * 0.05, 0.5);
  const blinkDuration = 0.75;
  const postAnimationBlinks = 2 / blinkDuration;
  const totalBlinks = Math.ceil((typingDuration / blinkDuration) + postAnimationBlinks);

  const animationStyle = {
    animation: `typewriter ${typingDuration}s steps(${steps}, end) ${randomDelay}s forwards, blink-caret ${blinkDuration}s step-end ${totalBlinks} ${randomDelay}s`,
    width: `${measuredWidth}px`, // Use the exact measured pixel width
  };

  return (
    <div ref={viewRef} className={className}>
      <span style={animationStyle} className="typewriter">
        {text}
      </span>
    </div>
  );
};

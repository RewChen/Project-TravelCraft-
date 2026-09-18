import { useEffect, useRef, useState } from 'react';

// ห่อ section/การ์ดให้ค่อย ๆ เฟด + เลื่อนขึ้นตอน scroll มาถึง (เห็นครั้งเดียวแล้วค้างไว้)
// ใช้: <Reveal delay={120}><MyCard /></Reveal>
export default function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  // เบราว์เซอร์ไม่มี IntersectionObserver (เก่ามาก) ให้โชว์เลยตั้งแต่แรก
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -32px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  return (
    <div
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={`tc-reveal${visible ? ' tc-reveal-visible' : ''}${className ? ` ${className}` : ''}`}
    >
      {children}
    </div>
  );
}

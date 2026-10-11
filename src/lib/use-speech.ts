import { useCallback, useEffect, useRef, useState } from 'react';

export type SpeechState = 'idle' | 'playing' | 'paused';

function sentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
}

/** Reads text aloud with the browser's built-in voices. Sentence queue avoids the cut-off on long text in some browsers. */
export function useSpeech(text: string) {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [state, setState] = useState<SpeechState>('idle');
  const [index, setIndex] = useState(0);
  const [rate, setRate] = useState(1);
  const parts = useRef<string[]>([]);
  const gen = useRef(0);

  useEffect(() => {
    parts.current = sentences(text);
  }, [text]);

  const speakFrom = useCallback((from: number, r: number) => {
    if (!supported) return;
    const my = ++gen.current;
    window.speechSynthesis.cancel();
    const list = parts.current;
    if (from >= list.length) { setState('idle'); setIndex(0); return; }
    setState('playing');
    list.slice(from).forEach((s, i) => {
      const u = new SpeechSynthesisUtterance(s);
      u.rate = r;
      u.lang = 'en';
      u.onstart = () => { if (gen.current === my) setIndex(from + i); };
      u.onend = () => { if (gen.current === my && from + i === list.length - 1) { setState('idle'); setIndex(0); } };
      u.onerror = () => { if (gen.current === my) setState('idle'); };
      window.speechSynthesis.speak(u);
    });
  }, [supported]);

  const play = useCallback(() => {
    if (state === 'paused') { window.speechSynthesis.resume(); setState('playing'); } else speakFrom(0, rate);
  }, [state, rate, speakFrom]);
  const pause = useCallback(() => { window.speechSynthesis.pause(); setState('paused'); }, []);
  const stop = useCallback(() => { gen.current++; if (supported) window.speechSynthesis.cancel(); setState('idle'); setIndex(0); }, [supported]);
  const changeRate = useCallback((r: number) => { setRate(r); if (state === 'playing') speakFrom(index, r); }, [state, index, speakFrom]);

  useEffect(() => () => { gen.current++; if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel(); }, []);

  return { supported, state, progress: parts.current.length ? index / parts.current.length : 0, rate, play, pause, stop, setRate: changeRate };
}

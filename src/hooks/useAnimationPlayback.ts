import { useState, useRef, useCallback, useEffect } from 'react';
import { clamp } from '../utils/math';

interface UseAnimationPlaybackOptions {
  totalDuration: number;
}

export function useAnimationPlayback({ totalDuration }: UseAnimationPlaybackOptions) {
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const isPlayingRef = useRef<boolean>(false);
  isPlayingRef.current = isPlaying;

  const totalDurationRef = useRef<number>(totalDuration);
  totalDurationRef.current = totalDuration;

  const startedAtRef = useRef<number>(0);
  const currentTimeRef = useRef<number>(currentTime);
  currentTimeRef.current = currentTime;

  const rafIdRef = useRef<number | null>(null);

  const pause = useCallback(() => {
    setIsPlaying(false);
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    startedAtRef.current = 0;
  }, []);

  const tick = useCallback((now: number) => {
    if (!isPlayingRef.current) return;

    if (!startedAtRef.current) {
      startedAtRef.current = now - currentTimeRef.current * 1000;
    }

    const t = (now - startedAtRef.current) / 1000;
    const maxDur = totalDurationRef.current;

    if (t >= maxDur) {
      setCurrentTime(maxDur);
      pause();
      return;
    }

    setCurrentTime(clamp(t, 0, maxDur));
    rafIdRef.current = requestAnimationFrame(tick);
  }, [pause]);

  const play = useCallback(() => {
    if (isPlayingRef.current) return;

    if (currentTimeRef.current >= totalDurationRef.current) {
      setCurrentTime(0);
      currentTimeRef.current = 0;
    }

    startedAtRef.current = 0;
    setIsPlaying(true);
    rafIdRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const togglePlay = useCallback(() => {
    if (isPlayingRef.current) {
      pause();
    } else {
      play();
    }
  }, [play, pause]);

  const reset = useCallback(() => {
    pause();
    setCurrentTime(0);
    currentTimeRef.current = 0;
  }, [pause]);

  const seek = useCallback((time: number, keepPlaying = false) => {
    const maxDur = totalDurationRef.current;
    const clamped = clamp(time, 0, maxDur);
    setCurrentTime(clamped);
    currentTimeRef.current = clamped;

    if (isPlayingRef.current && keepPlaying) {
      startedAtRef.current = performance.now() - clamped * 1000;
    } else {
      pause();
    }
  }, [pause]);

  const step = useCallback((delta: number) => {
    const maxDur = totalDurationRef.current;
    const current = currentTimeRef.current;
    const next = clamp(current + delta, 0, maxDur);

    currentTimeRef.current = next;
    setCurrentTime(next);

    if (isPlayingRef.current) {
      startedAtRef.current = performance.now() - next * 1000;
    }
  }, []);

  // Keyboard controls:
  // - Space: Play / Pause
  // - KeyR: Reset
  // - ArrowLeft / KeyJ: Step backward (1s, Shift for 5s)
  // - ArrowRight / KeyL: Step forward (1s, Shift for 5s)
  // - Comma (,): Step 1 frame backward
  // - Period (.): Step 1 frame forward
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditingText =
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable ||
        (target?.tagName === 'INPUT' && (target as HTMLInputElement).type !== 'range');

      if (isEditingText) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        reset();
      } else if (e.code === 'ArrowLeft' || e.code === 'KeyJ') {
        e.preventDefault();
        const delta = e.shiftKey ? -5 : -1;
        step(delta);
      } else if (e.code === 'ArrowRight' || e.code === 'KeyL') {
        e.preventDefault();
        const delta = e.shiftKey ? 5 : 1;
        step(delta);
      } else if (e.code === 'Comma') {
        e.preventDefault();
        step(-1 / 30);
      } else if (e.code === 'Period') {
        e.preventDefault();
        step(1 / 30);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, reset, step]);

  // Clean up RAF on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return {
    currentTime,
    setCurrentTime,
    isPlaying,
    play,
    pause,
    togglePlay,
    reset,
    seek,
    step,
  };
}


'use client';

import { useEffect, useRef, useState } from 'react';
import { HAPTIC, vibrate } from '@/lib/haptic';
import { buildShareUrl, type AppState } from '@/lib/url-share';

type Props = {
  state: AppState;
  defaults: AppState;
  className?: string;
};

export function ShareButton({ state, defaults, className }: Props) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const resetCopiedLabel = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      setCopied(false);
      timeoutRef.current = null;
    }, 1500);
  };

  const copyToClipboard = async (url: string): Promise<boolean> => {
    if (!navigator.clipboard?.writeText) {
      return false;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      resetCopiedLabel();
      return true;
    } catch {
      return false;
    }
  };

  const promptCopy = (url: string) => {
    window.prompt('이 URL을 복사하세요:', url);
  };

  const handleShare = async () => {
    const url = buildShareUrl(state, defaults);
    vibrate(HAPTIC.SELECT);

    if (navigator.share) {
      try {
        await navigator.share({
          title: '중구 휴지통 지도',
          url,
        });
        return;
      } catch {
        if (await copyToClipboard(url)) return;
        promptCopy(url);
        return;
      }
    }

    if (await copyToClipboard(url)) return;
    promptCopy(url);
  };

  return (
    <button
      type="button"
      onClick={() => {
        void handleShare();
      }}
      aria-label="현재 필터와 경로 상태 공유"
      className={className}
    >
      <span aria-hidden>🔗</span>
      <span>{copied ? '복사됨!' : '공유'}</span>
    </button>
  );
}

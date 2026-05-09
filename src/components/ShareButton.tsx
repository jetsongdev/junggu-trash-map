'use client';

import { Check, Share2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { FOCUS_VISIBLE_CLASS } from '@/lib/a11y';
import { HAPTIC, vibrate } from '@/lib/haptic';
import { buildShareUrl, type AppState } from '@/lib/url-share';

type Props = {
  state: AppState;
  defaults: AppState;
  className?: string;
};

const DEFAULT_CLASSNAME =
  `relative flex h-11 w-11 items-center justify-center rounded-md px-3 text-base transition ring-1 bg-white/95 text-neutral-700 ring-neutral-300 hover:bg-white dark:bg-neutral-900/95 dark:text-neutral-200 dark:ring-neutral-700 dark:hover:bg-neutral-800 ${FOCUS_VISIBLE_CLASS}`;

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
      aria-label={copied ? '링크 복사됨' : '현재 필터와 경로 상태 공유'}
      title={copied ? '복사됨!' : '공유'}
      className={className ?? DEFAULT_CLASSNAME}
    >
      {copied ? (
        <Check size={20} aria-hidden="true" />
      ) : (
        <Share2 size={20} aria-hidden="true" />
      )}
    </button>
  );
}

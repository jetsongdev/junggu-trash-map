import { useState } from 'react';
import { FOCUS_VISIBLE_CLASS } from '@/lib/a11y';
import { HAPTIC, vibrate } from '@/lib/haptic';
import type { TrashBin } from '@/lib/types';
import { TYPE_STYLE, styleFor } from '@/lib/types';

type Props = {
  bin: TrashBin;
  isFavorite?: boolean;
  onToggleFavorite?: (binId: string) => void;
  onUse?: (binId: string) => void;
};

export function BinPopup({ bin, isFavorite = false, onToggleFavorite, onUse }: Props) {
  const headStyle = styleFor(bin.types);
  const [usedFlash, setUsedFlash] = useState(false);

  const handleUse = () => {
    if (!onUse) return;
    vibrate(HAPTIC.CONFIRM);
    setUsedFlash(true);
    onUse(bin.id);
    window.setTimeout(() => {
      setUsedFlash(false);
    }, 800);
  };

  return (
    <div className="min-w-[220px] text-sm leading-relaxed">
      <div className="mb-1 flex items-center gap-2">
        <span
          aria-hidden
          className="inline-flex h-7 min-w-[28px] items-center justify-center rounded-full px-1 text-white"
          style={{ backgroundColor: headStyle.color }}
        >
          {headStyle.emoji}
        </span>
        <strong className="flex-1 text-base text-neutral-900">{bin.name}</strong>
        {onToggleFavorite && (
          <button
            type="button"
            onClick={() => onToggleFavorite(bin.id)}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
            className={`rounded-full px-2 py-1 text-lg leading-none transition ${FOCUS_VISIBLE_CLASS} ${
              isFavorite ? 'text-amber-500' : 'text-neutral-300 hover:text-amber-400'
            }`}
          >
            {isFavorite ? '★' : '☆'}
          </button>
        )}
        {onUse && (
          <button
            type="button"
            onClick={handleUse}
            aria-label="이 휴지통 사용 기록"
            className={`rounded-full px-2 py-1 text-xs font-semibold transition ${FOCUS_VISIBLE_CLASS} ${
              usedFlash
                ? 'bg-emerald-500 text-white'
                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
            }`}
          >
            ✓ 사용
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        {bin.types.map((t) => (
          <span
            key={t}
            className="inline-block rounded-full px-2 py-0.5 text-xs text-white"
            style={{ backgroundColor: TYPE_STYLE[t].color }}
          >
            {TYPE_STYLE[t].emoji} {t}
          </span>
        ))}
      </div>
      {bin.locationHint ? (
        <>
          {bin.locationHintSource === 'kakao' ? (
            <div className="mt-2 flex items-start gap-1 text-sm text-neutral-600">
              <span aria-hidden>📍</span>
              <span>
                <span className="text-neutral-500">근처: </span>
                {bin.locationHint}
                <span className="ml-1 text-[10px] uppercase tracking-wide text-neutral-400">
                  · kakao
                </span>
              </span>
            </div>
          ) : (
            <div className="mt-2 text-neutral-700">{bin.locationHint}</div>
          )}
          {(bin.roadAddress || bin.jibunAddress) && (
            <div className="mt-1 text-xs text-neutral-500">
              {bin.roadAddress || bin.jibunAddress}
            </div>
          )}
        </>
      ) : (
        (bin.roadAddress || bin.jibunAddress) && (
          <div className="mt-2 text-neutral-700">
            {bin.roadAddress || bin.jibunAddress}
          </div>
        )
      )}
      {bin.detail && <div className="mt-1 text-neutral-500">{bin.detail}</div>}
      {bin.manager && (
        <div className="mt-2 border-t border-neutral-200 pt-2 text-xs text-neutral-500">
          관리: {bin.manager}
          {bin.managerTel && ` · ${bin.managerTel}`}
        </div>
      )}
    </div>
  );
}

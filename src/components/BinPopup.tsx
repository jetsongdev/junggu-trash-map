import type { TrashBin } from '@/lib/types';
import { TYPE_STYLE, styleFor } from '@/lib/types';

type Props = {
  bin: TrashBin;
};

export function BinPopup({ bin }: Props) {
  const headStyle = styleFor(bin.types);
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
        <strong className="text-base text-neutral-900">{bin.name}</strong>
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
      {(bin.roadAddress || bin.jibunAddress) && (
        <div className="mt-2 text-neutral-700">{bin.roadAddress || bin.jibunAddress}</div>
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

'use client';

import Link from 'next/link';
import Image from 'next/image';
import ScrollableRow from './ScrollableRow';

interface FeaturedBox {
  id: string;
  name: string;
  imageUrl: string | null;
  price: number;
}

interface FeaturedBoxesWidgetProps {
  boxes: FeaturedBox[];
  className?: string;
}

export default function FeaturedBoxesWidget({ boxes, className = '' }: FeaturedBoxesWidgetProps) {
  return (
    <div className={`bg-[#1a1a4a] border border-[rgba(255,255,255,0.1)] rounded-2xl p-5 sm:p-6 ${className}`}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[#7777a0] mb-3 flex items-center gap-1.5">
        📦 Featured Boxes
      </div>

      <ScrollableRow>
        <div className="flex gap-2.5">
          {boxes.map((box) => (
            <Link
              key={box.id}
              href={`/open/${box.id}`}
              className="flex-shrink-0 w-[90px] rounded-xl bg-[#1e1e55] border border-[rgba(255,255,255,0.08)] overflow-hidden hover:border-[rgba(191,255,0,0.2)] transition-colors"
            >
              <div className="h-[60px] bg-[#252560] flex items-center justify-center overflow-hidden">
                {box.imageUrl ? (
                  <Image
                    src={box.imageUrl}
                    alt={box.name}
                    width={90}
                    height={60}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl">📦</span>
                )}
              </div>
              <div className="p-1.5">
                <p className="text-[9px] font-semibold text-[#f0f0f5] truncate">
                  {box.name}
                </p>
                <p className="text-[10px] text-[#BFFF00] font-bold">
                  🪙 {box.price}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </ScrollableRow>

      <Link
        href="/boxes"
        className="text-[#BFFF00] text-[11px] font-semibold mt-4 inline-block hover:underline"
      >
        Browse all →
      </Link>
    </div>
  );
}

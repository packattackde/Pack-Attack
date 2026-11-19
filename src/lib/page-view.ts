import { prisma } from '@/lib/prisma';

/** Best-effort homepage hit counter (no dedupe in v1). */
export function recordHomePageView(): void {
  void prisma.pageView
    .create({ data: { path: '/' } })
    .catch((err) => {
      console.error('[PageView] record failed:', err);
    });
}
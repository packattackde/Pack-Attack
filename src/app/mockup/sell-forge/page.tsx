import { SellForgeCinematic } from '@/components/mockups/SellForgeCinematic';

/**
 * Mockup-only — neon forge smashes card into gold coins.
 * Not linked from nav. Review before collection sell UI.
 */
const DEMO_CARD = {
  name: 'Monkey D. Luffy (Alternate Art)',
  rarity: 'Secret Rare',
  image:
    'data:image/svg+xml,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280"><defs><linearGradient id="f" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ff2ea6"/><stop offset="50%" stop-color="#8b5cf6"/><stop offset="100%" stop-color="#23e6ff"/></linearGradient></defs><rect width="200" height="280" rx="14" fill="#12082a"/><rect x="12" y="14" width="176" height="220" rx="10" fill="url(#f)" opacity="0.6"/><path d="M12 14 L188 14 L140 100 L12 230 Z" fill="#fff" opacity="0.12"/></svg>`,
    ),
  coinValue: 847,
};

export default function SellForgeMockupPage() {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `@keyframes landingSheen { to { background-position: -260% 0; } }`,
        }}
      />
      <div
        className="min-h-[100svh] flex flex-col items-center justify-center px-4 py-20"
        style={{
          background:
            'radial-gradient(ellipse 55% 38% at 50% -5%, rgba(255,46,166,0.20), transparent), radial-gradient(ellipse 45% 32% at 12% 90%, rgba(35,230,255,0.12), transparent), linear-gradient(180deg, #05040c, #0c0a1c)',
        }}
      >
        <SellForgeCinematic card={DEMO_CARD} />
      </div>
    </>
  );
}
import { NeonCoinForgeShowcase } from '@/components/NeonCoinForgeShowcase';

/**
 * Mockup-only preview — not linked from nav or homepage.
 * Review at /mockup/sell-forge before shipping sell-back UI.
 */
const DEMO_CARD = {
  name: 'Monkey D. Luffy (Alternate Art)',
  rarity: 'Secret Rare',
  image:
    'data:image/svg+xml,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280"><defs><linearGradient id="f" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ff2ea6"/><stop offset="100%" stop-color="#23e6ff"/></linearGradient></defs><rect width="200" height="280" rx="14" fill="#12082a"/><rect x="12" y="14" width="176" height="220" rx="10" fill="url(#f)" opacity="0.55"/><text x="100" y="265" text-anchor="middle" fill="#fff" font-family="system-ui" font-size="9" font-weight="800">SECRET RARE</text></svg>`,
    ),
  coinValue: 847,
};

export default function SellForgeMockupPage() {
  return (
    <div
      className="min-h-screen px-4 py-16"
      style={{
        background:
          'radial-gradient(ellipse 55% 38% at 50% -5%, rgba(255,46,166,0.20), transparent), radial-gradient(ellipse 45% 32% at 12% 90%, rgba(35,230,255,0.12), transparent), linear-gradient(180deg, #05040c, #0c0a1c)',
      }}
    >
      <div className="max-w-[1100px] mx-auto text-center mb-10">
        <p className="font-jp text-[#8b5cf6] tracking-[6px] text-xs mb-2">MOCKUP ONLY · NOT LIVE</p>
        <h1 className="font-orbitron text-2xl sm:text-3xl tracking-wider text-[#eeecf7]">
          Sell-back · Neon Coin Forge
        </h1>
        <p className="mt-3 text-[#9a94b8] text-sm max-w-lg mx-auto">
          Preview animation — approve here before we wire it into collection sell or the homepage.
        </p>
      </div>
      <NeonCoinForgeShowcase card={DEMO_CARD} />
    </div>
  );
}
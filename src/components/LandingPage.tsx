import Link from 'next/link';

/* ─── Neon District Landing Page ─────────────────────────────────────────── */

function NeonRain() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {Array.from({ length: 12 }).map((_, i) => (
        <i
          key={i}
          className="absolute top-[-140px] w-px h-[90px]"
          style={{
            left: `${[4, 12, 19, 27, 36, 44, 53, 61, 70, 78, 87, 95][i]}%`,
            background: i % 3 === 0
              ? 'linear-gradient(180deg, transparent, rgba(255,46,166,0.38))'
              : 'linear-gradient(180deg, transparent, rgba(35,230,255,0.5))',
            animation: `landingRainFall ${[1.9, 2.6, 2.1, 2.8, 2.0, 2.5, 1.8, 2.7, 2.2, 2.9, 2.0, 2.4][i]}s linear ${[0.2, 1.1, 0.6, 1.7, 0.1, 2.1, 0.9, 1.4, 0.4, 1.9, 0.7, 1.2][i]}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function HoloCard({ kanji, name, rarity, price, accent, glow, rotate }: {
  kanji: string; name: string; rarity: string; price: string;
  accent: string; glow: string; rotate: string;
}) {
  return (
    <div
      className="w-[140px] h-[200px] sm:w-[158px] sm:h-[224px] rounded-xl p-2 flex flex-col relative"
      style={{
        background: 'linear-gradient(160deg, #17132c, #0b0919)',
        animation: 'landingFloatCard 5.5s ease-in-out infinite',
        transform: rotate,
      }}
    >
      {/* border glow */}
      <div className="absolute inset-[-2px] rounded-[14px] -z-10" style={{ background: `linear-gradient(160deg, ${accent}, ${glow})`, boxShadow: `0 0 26px ${glow}` }} />
      {/* sheen */}
      <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ background: 'linear-gradient(115deg, transparent 32%, rgba(255,255,255,0.16) 48%, transparent 60%)', backgroundSize: '260% 100%', animation: 'landingSheen 4.5s linear infinite' }} />
      <div className="flex justify-between items-center px-2 py-1 rounded-md bg-white/5 text-[0.55rem] font-orbitron font-bold tracking-wider text-[#eeecf7]">
        {name} <span style={{ color: accent }}>{rarity[0]}</span>
      </div>
      <div
        className="flex-1 my-2 rounded-lg flex items-center justify-center font-jp font-black text-[2.8rem] sm:text-[3.1rem] border border-white/[0.08]"
        style={{ color: accent, textShadow: `0 0 24px ${accent}`, background: `radial-gradient(circle at 50% 40%, ${glow}33, transparent 75%), linear-gradient(160deg, #0e0b20, #090716)` }}
      >
        {kanji}
      </div>
      <div className="flex justify-between items-center text-[0.55rem] font-orbitron font-bold tracking-wider">
        <span style={{ color: accent, textShadow: `0 0 8px ${accent}` }}>{rarity}</span>
        <span className="px-2 py-0.5 rounded" style={{ color: '#0b0716', background: accent, boxShadow: `0 0 12px ${glow}` }}>{price}</span>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, jpLabel, description, watermark }: {
  icon: React.ReactNode; title: string; jpLabel: string; description: string; watermark: string;
}) {
  return (
    <div className="group relative overflow-hidden border border-[rgba(139,92,246,0.35)] p-8 sm:p-9 transition-all duration-200 hover:-translate-y-2 hover:border-[rgba(255,46,166,0.6)] hover:shadow-[0_0_34px_rgba(255,46,166,0.3)]" style={{ background: 'linear-gradient(165deg, #16122c, #100d22 60%, #0b0919)' }}>
      {/* corner brackets */}
      {['top-2 left-2 border-r-0 border-b-0', 'top-2 right-2 border-l-0 border-b-0', 'bottom-2 left-2 border-r-0 border-t-0', 'bottom-2 right-2 border-l-0 border-t-0'].map((pos, i) => (
        <i key={i} className={`absolute w-4 h-4 border-2 border-[#23e6ff] opacity-55 group-hover:border-[#ff2ea6] group-hover:opacity-100 transition-all pointer-events-none ${pos}`} />
      ))}
      <div className="absolute right-[-8px] bottom-[-22px] font-jp font-black text-[6rem] text-[rgba(139,92,246,0.09)] select-none pointer-events-none leading-none">{watermark}</div>
      <div className="w-[54px] h-[54px] mb-5 flex items-center justify-center border border-[rgba(35,230,255,0.5)] bg-[rgba(35,230,255,0.06)] [clip-path:polygon(10px_0,100%_0,calc(100%-10px)_100%,0_100%)]">
        {icon}
      </div>
      <h3 className="font-orbitron text-[1.12rem] tracking-wider text-[#23e6ff] mb-1">{title}</h3>
      <div className="font-jp text-xs text-[#ff2ea6] tracking-[4px] mb-4 drop-shadow-[0_0_8px_rgba(255,46,166,0.5)]">{jpLabel}</div>
      <p className="text-[#9a94b8] leading-relaxed">{description}</p>
    </div>
  );
}

function BattleMode({ kanji, title, desc, tagline, color }: {
  kanji: string; title: string; desc: string; tagline: string; color: string;
}) {
  return (
    <div
      className="relative text-center px-5 py-10 overflow-hidden border border-[rgba(35,230,255,0.25)] transition-all duration-200 hover:-translate-y-1.5"
      style={{ background: 'linear-gradient(180deg, #131028, #0a0816)', clipPath: 'polygon(0 14px, 14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%)' }}
    >
      <div className="absolute top-0 left-[20%] right-[20%] h-0.5" style={{ background: color, boxShadow: `0 0 14px ${color}` }} />
      <span className="block font-jp font-black text-[2.7rem] mb-3" style={{ color, textShadow: `0 0 24px ${color}` }}>{kanji}</span>
      <h3 className="font-orbitron text-base tracking-widest mb-2">{title}</h3>
      <p className="text-[#9a94b8] text-sm leading-relaxed">{desc}</p>
      <span className="inline-block mt-4 font-orbitron text-[0.6rem] tracking-widest px-3 py-1 rounded-full border opacity-85" style={{ color, borderColor: color }}>{tagline}</span>
    </div>
  );
}

function Stat({ num, label, jp }: { num: string; label: string; jp: string }) {
  return (
    <div className="bg-[#0c0a1c] py-9 px-5 text-center">
      <div className="font-orbitron font-black text-[2.3rem] bg-gradient-to-b from-white to-[#23e6ff] bg-clip-text text-transparent drop-shadow-[0_0_14px_rgba(35,230,255,0.5)]">{num}</div>
      <div className="mt-1.5 text-[#9a94b8] tracking-[3px] uppercase text-xs font-semibold">{label}</div>
      <div className="font-jp text-[#ff2ea6] text-[0.7rem] tracking-[3px] mt-1">{jp}</div>
    </div>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-4 max-w-[1100px] mx-auto px-6">
      <div className="flex-1 h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #ff2ea6, #8b5cf6, #23e6ff, transparent)', boxShadow: '0 0 10px rgba(139,92,246,0.6)' }} />
      <div className="w-2.5 h-2.5 rotate-45 bg-[#23e6ff] shadow-[0_0_12px_#23e6ff]" />
      <div className="flex-1 h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #23e6ff, #8b5cf6, #ff2ea6, transparent)', boxShadow: '0 0 10px rgba(139,92,246,0.6)' }} />
    </div>
  );
}

/* ─── SVG icons for feature cards ─── */
const PackIcon = () => <svg viewBox="0 0 24 24" className="w-[26px] h-[26px] stroke-[#23e6ff] fill-none" strokeWidth={1.7} style={{ filter: 'drop-shadow(0 0 8px rgba(35,230,255,0.8))' }}><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M5 8h14M12 3v5"/><path d="M9 14l3 3 3-3"/></svg>;
const BattleIcon = () => <svg viewBox="0 0 24 24" className="w-[26px] h-[26px] stroke-[#23e6ff] fill-none" strokeWidth={1.7} style={{ filter: 'drop-shadow(0 0 8px rgba(35,230,255,0.8))' }}><path d="M4 20L20 4M14 4h6v6M4 14v6h6"/><path d="M4 4l16 16"/></svg>;
const VaultIcon = () => <svg viewBox="0 0 24 24" className="w-[26px] h-[26px] stroke-[#23e6ff] fill-none" strokeWidth={1.7} style={{ filter: 'drop-shadow(0 0 8px rgba(35,230,255,0.8))' }}><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M3 12h18"/></svg>;
const CoinIcon = () => <svg viewBox="0 0 24 24" className="w-[26px] h-[26px] stroke-[#23e6ff] fill-none" strokeWidth={1.7} style={{ filter: 'drop-shadow(0 0 8px rgba(35,230,255,0.8))' }}><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5h3.5a2 2 0 010 4H9.5"/></svg>;

/* ─── Ticker ─── */
function LiveTicker() {
  const pulls = [
    { user: 'Kaito_99', pull: 'The One Ring — Mythic', cls: 'text-[#ff9e2c] drop-shadow-[0_0_8px_rgba(255,158,44,0.6)]' },
    { user: 'NeonWolf', pull: 'Sheoldred — Rare Foil', cls: 'text-[#e8b34b]' },
    { user: 'Sakura_Rips', pull: 'Jackpot Battle (+12,400 coins)', cls: 'text-[#23e6ff]' },
    { user: 'Db_Breaker', pull: 'Ragavan — Rare', cls: 'text-[#e8b34b]' },
    { user: 'Ghost_in_the_Pack', pull: 'Atraxa — Mythic Showcase', cls: 'text-[#ff9e2c] drop-shadow-[0_0_8px_rgba(255,158,44,0.6)]' },
    { user: 'TCG_Ronin', pull: 'Upside-Down Battle', cls: 'text-[#23e6ff]' },
  ];
  const doubled = [...pulls, ...pulls];
  return (
    <div className="border-t border-[rgba(255,46,166,0.4)] border-b border-b-[rgba(35,230,255,0.4)] overflow-hidden py-3.5 flex items-center relative z-[2]" style={{ background: 'linear-gradient(90deg, #0a0818, #120c26, #0a0818)' }}>
      <div className="shrink-0 px-5 font-orbitron text-[0.72rem] font-bold tracking-[3px] text-[#ff2ea6] border-r border-[rgba(255,46,166,0.4)] drop-shadow-[0_0_10px_rgba(255,46,166,0.7)] whitespace-nowrap">
        <span className="animate-pulse">●</span>&nbsp;LIVE PULLS
      </div>
      <div className="flex whitespace-nowrap" style={{ animation: 'landingTickerScroll 32s linear infinite' }}>
        {doubled.map((p, i) => (
          <span key={i} className="px-8 text-base tracking-wide text-[#9a94b8] font-semibold">
            <b className="text-[#eeecf7]">{p.user}</b>{' pulled '}<b className={p.cls}>{p.pull}</b>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Skyline SVG ─── */
function Skyline() {
  return (
    <svg className="absolute bottom-0 left-0 right-0 h-[260px] pointer-events-none opacity-90" viewBox="0 0 1440 260" preserveAspectRatio="xMidYMax slice" fill="none">
      <g opacity=".5" fill="#120e26"><rect x="0" y="120" width="90" height="140"/><rect x="110" y="80" width="70" height="180"/><rect x="200" y="140" width="110" height="120"/><rect x="330" y="60" width="60" height="200"/><rect x="1050" y="70" width="70" height="190"/><rect x="1140" y="130" width="100" height="130"/><rect x="1260" y="90" width="80" height="170"/><rect x="1360" y="140" width="80" height="120"/></g>
      <g><rect x="600" y="60" width="240" height="14" fill="#ff2ea6" opacity=".95"/><rect x="588" y="54" width="264" height="8" rx="4" fill="#ff2ea6" opacity=".6"/><rect x="618" y="94" width="204" height="8" fill="#23e6ff" opacity=".85"/><rect x="636" y="74" width="12" height="186" fill="#8b5cf6"/><rect x="792" y="74" width="12" height="186" fill="#8b5cf6"/><rect x="712" y="74" width="16" height="20" fill="#8b5cf6"/></g>
      <g fill="#1a1433"><rect x="60" y="150" width="120" height="110"/><rect x="220" y="100" width="90" height="160"/><rect x="380" y="130" width="130" height="130"/><rect x="920" y="120" width="110" height="140"/><rect x="1080" y="150" width="130" height="110"/><rect x="1240" y="110" width="110" height="150"/></g>
      <g fill="#ff2ea6" opacity=".8"><rect x="240" y="115" width="6" height="6"/><rect x="260" y="115" width="6" height="6"/><rect x="240" y="135" width="6" height="6"/><rect x="280" y="155" width="6" height="6"/><rect x="410" y="145" width="6" height="6"/><rect x="440" y="165" width="6" height="6"/><rect x="950" y="135" width="6" height="6"/><rect x="985" y="155" width="6" height="6"/><rect x="1270" y="125" width="6" height="6"/><rect x="1300" y="145" width="6" height="6"/></g>
      <g fill="#23e6ff" opacity=".8"><rect x="90" y="165" width="6" height="6"/><rect x="120" y="185" width="6" height="6"/><rect x="420" y="185" width="6" height="6"/><rect x="460" y="145" width="6" height="6"/><rect x="965" y="175" width="6" height="6"/><rect x="1110" y="165" width="6" height="6"/><rect x="1150" y="185" width="6" height="6"/><rect x="1290" y="175" width="6" height="6"/></g>
      <rect x="0" y="256" width="1440" height="4" fill="url(#lg)"/>
      <defs><linearGradient id="lg" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor="#23e6ff" stopOpacity="0"/><stop offset=".5" stopColor="#ff2ea6"/><stop offset="1" stopColor="#23e6ff" stopOpacity="0"/></linearGradient></defs>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export function LandingPage() {
  return (
    <div className="-mt-[72px]"> {/* offset the global nav height */}
      {/* ═══ Inline keyframes ═══ */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes landingRainFall { to { transform: translateY(120vh); } }
        @keyframes landingFloatCard { 0%,100%{translate:0 0} 50%{translate:0 -14px} }
        @keyframes landingSheen { to { background-position: -260% 0; } }
        @keyframes landingTickerScroll { to { transform: translateX(-50%); } }
        @keyframes landingGridSlide { to { background-position: 0 46px, 0 46px; } }
        @keyframes landingMoonPulse { 50% { opacity: .75; } }
        @keyframes landingSignFlicker { 0%,100%{opacity:.45} 3%{opacity:.12} 5%{opacity:.45} 52%{opacity:.45} 54%{opacity:.2} 55%{opacity:.45} }
        @keyframes landingGlitchL { 0%,92%,100%{transform:none;opacity:0} 93%{transform:translate(-4px,2px);opacity:.6;filter:drop-shadow(0 0 6px #23e6ff)} 95%{transform:translate(3px,-1px);opacity:.5} 97%{transform:none;opacity:0} }
        @keyframes landingGlitchR { 0%,90%,100%{transform:none;opacity:0} 91%{transform:translate(4px,-2px);opacity:.5;filter:drop-shadow(0 0 6px #ff2ea6)} 94%{transform:translate(-3px,2px);opacity:.55} 96%{transform:none;opacity:0} }
      `}} />

      {/* ═══ HERO ═══ */}
      <header className="min-h-screen flex flex-col items-center justify-center text-center relative px-6 pt-32 pb-40 overflow-hidden" style={{ background: 'radial-gradient(ellipse 55% 38% at 50% -5%, rgba(255,46,166,0.20), transparent), radial-gradient(ellipse 45% 32% at 12% 90%, rgba(35,230,255,0.12), transparent), radial-gradient(ellipse 40% 30% at 88% 85%, rgba(139,92,246,0.15), transparent), linear-gradient(180deg, #05040c, #0c0a1c)' }}>
        <NeonRain />
        {/* Synthwave grid floor */}
        <div className="absolute left-[-20%] right-[-20%] bottom-[-40px] h-[300px] pointer-events-none" style={{ background: 'linear-gradient(90deg, rgba(35,230,255,.14) 1px, transparent 1px), linear-gradient(0deg, rgba(255,46,166,.16) 1px, transparent 1px)', backgroundSize: '70px 46px', transform: 'perspective(420px) rotateX(62deg)', transformOrigin: '50% 100%', maskImage: 'linear-gradient(180deg, transparent, #000 45%)', WebkitMaskImage: 'linear-gradient(180deg, transparent, #000 45%)', animation: 'landingGridSlide 3.2s linear infinite' }} />
        {/* Moon glow */}
        <div className="absolute bottom-[130px] left-1/2 -translate-x-1/2 w-[340px] h-[340px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 42%, rgba(255,46,166,0.34), rgba(139,92,246,0.18) 48%, transparent 70%)', filter: 'blur(6px)', animation: 'landingMoonPulse 6s ease-in-out infinite' }} />
        {/* Kana side text */}
        <div className="absolute top-36 left-[5%] hidden lg:block writing-mode-vertical-rl font-jp font-black text-[2.3rem] tracking-[14px] text-[#ff2ea6] drop-shadow-[0_0_20px_rgba(255,46,166,0.7)] select-none" style={{ writingMode: 'vertical-rl', animation: 'landingSignFlicker 7s infinite' }}>引きの鍛冶場</div>
        <div className="absolute top-36 right-[5%] hidden lg:block font-jp font-black text-[2.3rem] tracking-[14px] text-[#23e6ff] drop-shadow-[0_0_20px_rgba(35,230,255,0.7)] select-none" style={{ writingMode: 'vertical-rl', animation: 'landingSignFlicker 7s infinite 3.4s' }}>ネオン地区</div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2.5 px-5 py-2 mb-7 border border-[rgba(35,230,255,0.5)] rounded-full bg-[rgba(35,230,255,0.06)] text-sm tracking-[3px] font-semibold uppercase text-[#23e6ff] shadow-[0_0_16px_rgba(35,230,255,0.25)]">
          <span className="w-2 h-2 rounded-full bg-[#ff2ea6] shadow-[0_0_10px_#ff2ea6] animate-pulse" />
          Beta — Now Live
        </div>

        {/* Title */}
        <h1 className="relative font-orbitron font-black text-[clamp(3rem,9vw,6.8rem)] tracking-[5px] leading-none bg-gradient-to-b from-white via-[#ff2ea6] to-[#ff9e2c] bg-clip-text text-transparent drop-shadow-[0_0_26px_rgba(255,46,166,0.55)]">
          PULLFORGE
          <span className="absolute inset-0 bg-gradient-to-b from-white via-[#ff2ea6] to-[#ff9e2c] bg-clip-text text-transparent" style={{ animation: 'landingGlitchL 3.2s infinite steps(1)' }} aria-hidden="true">PULLFORGE</span>
          <span className="absolute inset-0 bg-gradient-to-b from-white via-[#ff2ea6] to-[#ff9e2c] bg-clip-text text-transparent" style={{ animation: 'landingGlitchR 3.2s infinite steps(1)' }} aria-hidden="true">PULLFORGE</span>
        </h1>

        <div className="mt-4 font-jp text-[#23e6ff] tracking-[12px] text-base drop-shadow-[0_0_14px_rgba(35,230,255,0.7)]">ネオン・ジャパン・サイバーパンク</div>

        <p className="mt-5 max-w-[640px] text-[#9a94b8] text-xl leading-relaxed font-medium">
          Welcome to the <b className="text-[#eeecf7]">Neon District</b> — where collectors rip packs under electric skies, battle for the biggest pulls, and forge legendary collections. <b className="text-[#eeecf7]">Every pull is forged in neon.</b>
        </p>

        <div className="mt-10 flex gap-5 flex-wrap justify-center">
          <Link href="/register" className="font-orbitron text-base tracking-widest px-10 py-4 font-bold uppercase bg-gradient-to-r from-[#ff2ea6] to-[#ff6ec4] text-[#14041f] shadow-[0_0_26px_rgba(255,46,166,0.8)] hover:shadow-[0_0_40px_rgba(255,46,166,1)] transition-all hover:-translate-y-0.5 [clip-path:polygon(12px_0,100%_0,calc(100%-12px)_100%,0_100%)]">
            Enter the Forge
          </Link>
          <Link href="/boxes" className="font-orbitron text-base tracking-widest px-10 py-4 font-bold uppercase bg-[rgba(35,230,255,0.04)] text-[#23e6ff] border-[1.5px] border-[#23e6ff] shadow-[inset_0_0_14px_rgba(35,230,255,0.22),0_0_14px_rgba(35,230,255,0.35)] hover:shadow-[inset_0_0_20px_rgba(35,230,255,0.35),0_0_24px_rgba(35,230,255,0.6)] transition-all hover:-translate-y-0.5 [clip-path:polygon(12px_0,100%_0,calc(100%-12px)_100%,0_100%)]">
            Browse Boxes
          </Link>
        </div>

        {/* Holo Cards */}
        <div className="mt-16 flex gap-7 justify-center" style={{ perspective: '1100px' }}>
          <HoloCard kanji="火" name="EMBER DRAGON" rarity="MYTHIC" price="$212.40" accent="#ff9e2c" glow="rgba(255,158,44,0.55)" rotate="rotate(-9deg) translateY(10px)" />
          <HoloCard kanji="雷" name="STORM RONIN" rarity="RARE" price="$48.90" accent="#e8b34b" glow="rgba(232,179,75,0.5)" rotate="" />
          <HoloCard kanji="水" name="TIDE ORACLE" rarity="FOIL" price="$96.20" accent="#23e6ff" glow="rgba(35,230,255,0.5)" rotate="rotate(9deg) translateY(10px)" />
        </div>

        <Skyline />
      </header>

      {/* ═══ LIVE TICKER ═══ */}
      <LiveTicker />

      {/* ═══ FEATURES ═══ */}
      <section className="py-28 px-6">
        <div className="text-center mb-16">
          <div className="font-jp text-[#8b5cf6] tracking-[8px] text-sm drop-shadow-[0_0_12px_rgba(139,92,246,0.7)]">特徴 — FEATURES</div>
          <h2 className="font-orbitron text-[2.5rem] tracking-wider mt-2.5 text-[#eeecf7] drop-shadow-[0_0_22px_rgba(35,230,255,0.4)]">FORGED IN NEON</h2>
          <p className="mt-3.5 text-[#9a94b8] text-lg max-w-[560px] mx-auto">Everything a collector needs to rip, battle, and build — in one electric district.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7 max-w-[1160px] mx-auto">
          <FeatureCard icon={<PackIcon />} title="PACK RIPPING" jpLabel="パック開封" description="Crack boxes and packs with cinematic reveal animations. Every rare flash lights up the district." watermark="開" />
          <FeatureCard icon={<BattleIcon />} title="PULL BATTLES" jpLabel="開封バトル" description="Face other collectors head-to-head. Four battle modes decide who walks away with the loot." watermark="戦" />
          <FeatureCard icon={<VaultIcon />} title="COLLECTION VAULT" jpLabel="コレクション" description="Every pull is tracked, valued, and stored in your vault. Watch your collection's worth grow in real time." watermark="集" />
          <FeatureCard icon={<CoinIcon />} title="COIN ECONOMY" jpLabel="コイン経済" description="Earn coins from battles and daily streaks. Spend them on new boxes — the forge never sleeps." watermark="貨" />
        </div>
      </section>

      <Divider />

      {/* ═══ BATTLE MODES ═══ */}
      <section className="py-28 px-6" style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(139,92,246,0.1), transparent), linear-gradient(180deg, #05040c 0%, #0a0718 50%, #05040c 100%)' }}>
        <div className="text-center mb-16">
          <div className="font-jp text-[#8b5cf6] tracking-[8px] text-sm drop-shadow-[0_0_12px_rgba(139,92,246,0.7)]">バトルモード — BATTLE MODES</div>
          <h2 className="font-orbitron text-[2.5rem] tracking-wider mt-2.5 text-[#eeecf7] drop-shadow-[0_0_22px_rgba(35,230,255,0.4)]">CHOOSE YOUR DUEL</h2>
          <p className="mt-3.5 text-[#9a94b8] text-lg max-w-[560px] mx-auto">Four ways to settle it. One winner under the neon lights.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-[1160px] mx-auto">
          <BattleMode kanji="常" title="NORMAL" desc="Highest total pull value wins the pot. Pure firepower." tagline="CLASSIC DUEL" color="#23e6ff" />
          <BattleMode kanji="逆" title="UPSIDE-DOWN" desc="Lowest total value takes it all. Bad luck becomes your weapon." tagline="CHAOS RULES" color="#ff2ea6" />
          <BattleMode kanji="撃" title="JACKPOT" desc="One card decides everything — the single highest pull wins." tagline="ONE SHOT" color="#ff9e2c" />
          <BattleMode kanji="共" title="SHARE" desc="The pack splits the spoils. Everyone leaves with something." tagline="PACK MENTALITY" color="#8b5cf6" />
        </div>
      </section>

      <Divider />

      {/* ═══ STATS ═══ */}
      <section className="py-28 px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-0.5 max-w-[1000px] mx-auto border border-[rgba(139,92,246,0.35)] bg-[rgba(139,92,246,0.35)] shadow-[0_0_30px_rgba(139,92,246,0.2)]">
          <Stat num="1.2M+" label="Packs Ripped" jp="開封数" />
          <Stat num="84K" label="Battles Fought" jp="バトル数" />
          <Stat num="312K" label="Mythics Pulled" jp="神話レア" />
          <Stat num="24/7" label="Live Breaks" jp="生放送" />
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-28 px-6">
        <div className="max-w-[940px] mx-auto text-center border border-[rgba(255,46,166,0.5)] px-8 py-[72px] shadow-[0_0_46px_rgba(255,46,166,0.25)] [clip-path:polygon(0_24px,24px_0,100%_0,100%_calc(100%-24px),calc(100%-24px)_100%,0_100%)]" style={{ background: 'radial-gradient(ellipse 70% 120% at 50% -10%, rgba(255,46,166,0.17), transparent), radial-gradient(ellipse 50% 80% at 50% 110%, rgba(35,230,255,0.12), transparent), linear-gradient(165deg, #191233, #0a0817)' }}>
          <div className="font-jp text-[#23e6ff] tracking-[8px] text-sm drop-shadow-[0_0_12px_rgba(35,230,255,0.7)]">参加する — JOIN THE FORGE</div>
          <h2 className="font-orbitron text-[clamp(1.5rem,4vw,2.3rem)] tracking-wider mt-4 mb-3 text-[#eeecf7]">THE DISTRICT NEEDS NEW COLLECTORS</h2>
          <p className="text-[#9a94b8] text-lg mb-8">Sign up and start ripping tonight.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/register" className="font-orbitron text-base tracking-widest px-10 py-4 font-bold uppercase bg-gradient-to-r from-[#ff2ea6] to-[#ff6ec4] text-[#14041f] shadow-[0_0_26px_rgba(255,46,166,0.8)] hover:shadow-[0_0_40px_rgba(255,46,166,1)] transition-all hover:-translate-y-0.5 [clip-path:polygon(12px_0,100%_0,calc(100%-12px)_100%,0_100%)]">
              Claim Beta Access
            </Link>
          </div>
          <div className="mt-5 text-sm text-[#9a94b8] tracking-wide">First 1,000 collectors get <b className="text-[#e8b34b]">500 starter coins</b> — no strings, all neon.</div>
        </div>
      </section>
    </div>
  );
}

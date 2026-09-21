import type { Metadata } from 'next';
import { LandingPage } from '@/components/LandingPage';

export const metadata: Metadata = {
  title: 'PullForge — Neon District',
  description:
    'Welcome to the Neon District. Rip packs, battle for the biggest pulls, and forge legendary collections. Every pull is forged in neon.',
};

export default function Home() {
  return <LandingPage />;
}

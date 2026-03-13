import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#050810] font-display p-4 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-grid opacity-[0.03]" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-blue-600/[0.07] rounded-full blur-[150px]" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[400px] bg-violet-600/[0.05] rounded-full blur-[120px]" />
      <div className="fixed top-1/3 left-1/4 w-[300px] h-[300px] bg-cyan-600/[0.03] rounded-full blur-[100px]" />

      {/* Logo */}
      <div className="relative text-center mb-8">
        <Link href="/" className="inline-block group">
          <h1 className="text-3xl font-black tracking-tight">
            <span className="text-white group-hover:text-gray-200 transition-colors">PACK</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">ATTACK</span>
          </h1>
          <p className="text-[10px] text-gray-600 font-medium tracking-[0.3em] uppercase mt-1">Trading Card Battles</p>
        </Link>
      </div>

      {/* Content */}
      <div className="relative w-full max-w-[420px]">
        {children}
      </div>

      {/* Back to home */}
      <div className="relative mt-8">
        <Link href="/" className="inline-flex items-center gap-2 text-xs text-gray-600 hover:text-gray-400 transition-colors font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}

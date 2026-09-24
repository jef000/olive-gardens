import type { ReactNode } from 'react';
import { Leaf } from 'lucide-react';

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-brand-gradient">
      <div className="pointer-events-none absolute inset-0 bg-hero-glow" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 animate-float-slow rounded-full bg-brand-400/20 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-80 w-80 animate-float-slow rounded-full bg-gold-400/20 blur-3xl" aria-hidden="true" />

      <div className="relative mb-8 flex flex-col items-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-300 via-brand-400 to-gold-500 shadow-glow">
          <Leaf className="h-8 w-8 text-white" aria-hidden="true" />
        </div>
        <h1 className="text-4xl font-serif text-white tracking-tight">Olive Garden</h1>
        <p className="mt-2 text-sm font-light uppercase tracking-[0.3em] text-gold-200">Management Portal</p>
      </div>

      {children}

      <p className="relative mt-8 text-sm font-light text-white/60">
        &copy; {new Date().getFullYear()} Olive Garden Resort. All rights reserved.
      </p>
    </div>
  );
}

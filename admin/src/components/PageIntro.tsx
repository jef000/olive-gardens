import type { ReactNode } from 'react';

interface PageIntroProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export default function PageIntro({ eyebrow, title, description, actions }: PageIntroProps) {
  return (
    <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
      <div className="min-w-0">
        <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-300">
          <span className="h-px w-6 bg-gradient-to-r from-brand-400 to-gold-400" aria-hidden="true" />
          {eyebrow}
        </p>
        <h1 className="text-3xl font-serif font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm font-medium text-gray-500 sm:text-base dark:text-gray-400">{description}</p>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

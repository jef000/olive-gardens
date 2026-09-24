import { getInitials, getAvatarColor } from '@/lib/avatar';
import { cn } from '@/lib/utils';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
};

export default function Avatar({ name, size = 'md', className }: AvatarProps) {
  const initials = getInitials(name);
  const color = getAvatarColor(name);

  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white ring-2 ring-white/70 dark:ring-white/10',
        SIZES[size],
        className
      )}
      style={{ backgroundColor: color }}
    >
      {initials}
    </span>
  );
}


import { cn } from '@/lib/utils';
import Image from 'next/image';

export function Logo({ className, logoUrl, name }: { className?: string; logoUrl?: string | null; name?: string }) {
  const displayName = name || "Gestion PME";

  if (logoUrl) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="relative h-8 w-8 flex items-center justify-center overflow-hidden rounded-md border border-border/50 bg-background">
          <Image
            src={logoUrl}
            alt={`Logo de ${displayName}`}
            fill
            className="object-contain p-0.5"
          />
        </div>
        <span className="text-xl font-bold text-foreground whitespace-nowrap">{displayName}</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative h-8 w-8 flex items-center justify-center rounded-md bg-primary/10 border border-primary/20">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary"
        >
          <path d="M19.5 5.5V18.5"></path>
          <path d="M12.5 10.5V18.5"></path>
          <path d="M5.5 14.5V18.5"></path>
          <rect width="23" height="23" x="0.5" y="0.5" rx="4"></rect>
        </svg>
      </div>
      <span className="text-xl font-bold text-foreground whitespace-nowrap">{displayName}</span>
    </div>
  );
}


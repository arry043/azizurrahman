import { cn } from "@/lib/utils";

/** Decorative gold divider (lines + eight-point star), echoing the reference design. */
export function Ornament({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("flex items-center justify-center gap-3", className)}>
      <span className="h-px w-16 bg-linear-to-r from-transparent to-accent sm:w-24" />
      <svg viewBox="0 0 24 24" className="size-4 text-accent" fill="currentColor">
        <path d="M12 2l2.2 5.3L19.5 5l-2.3 5.3L22 12l-4.8 1.7 2.3 5.3-5.3-2.3L12 22l-2.2-5.3L4.5 19l2.3-5.3L2 12l4.8-1.7L4.5 5l5.3 2.3z" />
      </svg>
      <span className="h-px w-16 bg-linear-to-l from-transparent to-accent sm:w-24" />
    </div>
  );
}

import { cn } from '../../lib/utils.js';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted',
        className
      )}
      {...props}
    />
  );
}

interface SkeletonGroupProps {
  count?: number;
  className?: string;
  itemClassName?: string;
}

export function SkeletonGroup({
  count = 1,
  className,
  itemClassName,
}: SkeletonGroupProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={cn('h-4 w-full', itemClassName)} />
      ))}
    </div>
  );
}

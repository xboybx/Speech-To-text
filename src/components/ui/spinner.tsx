import { cn } from '@/lib/utils';

interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Spinner = ({ className, size = 'md' }: SpinnerProps) => {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-t-2 border-indigo-500 border-r-transparent',
        {
          'h-4 w-4 border-2': size === 'sm',
          'h-8 w-8 border-3': size === 'md',
          'h-12 w-12 border-4': size === 'lg',
        },
        className
      )}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};
export default Spinner;

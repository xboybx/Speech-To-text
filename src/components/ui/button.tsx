import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 cursor-pointer select-none',
          {
            // Variants styled in warm Claude clay / beige theme
            'bg-brand-indigo text-white shadow-sm hover:bg-[#c66847] border border-[#c66847]': variant === 'primary',
            'bg-[#F5F2EB] text-[#191919] hover:bg-[#EAE5DA] border border-[#E8E2D9]': variant === 'secondary',
            'bg-brand-pink text-white hover:bg-red-800 shadow-sm': variant === 'danger',
            'hover:bg-[#F5F2EB]/60 text-slate-500 hover:text-[#191919]': variant === 'ghost',
            'border border-[#E8E2D9] hover:bg-[#F5F2EB]/50 hover:border-[#D5CFC4] text-[#191919]': variant === 'outline',
            // Sizes
            'px-3 py-1.5 text-xs rounded-md': size === 'sm',
            'px-4 py-2 text-sm rounded-lg': size === 'md',
            'px-5 py-2.5 text-base rounded-xl': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {isLoading ? (
          <svg
            className="mr-2 h-3.5 w-3.5 animate-spin text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;

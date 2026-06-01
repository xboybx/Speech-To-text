import React from 'react';
import { cn } from '@/lib/utils';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('premium-card overflow-hidden', className)}
      {...props}
    />
  )
);
Card.displayName = 'Card';

export const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-5 border-b border-[#E8E2D9] bg-[#F5F2EB]/30', className)} {...props} />
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={cn('text-sm font-bold text-[#191919] tracking-wide', className)}
    {...props}
  />
);
CardTitle.displayName = 'CardTitle';

export const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-5', className)} {...props} />
);
CardContent.displayName = 'CardContent';

export const CardFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-5 border-t border-[#E8E2D9] bg-[#F5F2EB]/30 flex items-center', className)} {...props} />
);
CardFooter.displayName = 'CardFooter';
export default Card;

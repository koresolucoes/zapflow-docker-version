import React from 'react';
import { cn } from '../../lib/utils.js';
import { INFO_ICON } from '../icons/index.js';

interface InfoCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'info' | 'warning' | 'success' | 'error' | 'destructive';
}

const InfoCard: React.FC<InfoCardProps> = ({ 
  children, 
  className = '', 
  variant = 'info' 
}) => {
  const variantStyles = {
    default: 'border-border bg-card text-foreground',
    info: 'border-info/50 bg-info/5 text-foreground',
    warning: 'border-warning/50 bg-warning/5 text-foreground',
    success: 'border-success/50 bg-success/5 text-foreground',
    error: 'border-destructive/50 bg-destructive/5 text-foreground',
    destructive: 'border-destructive/50 bg-destructive/5 text-foreground',
  };

  const iconStyles = {
    default: 'text-foreground/70',
    info: 'text-info',
    warning: 'text-warning',
    success: 'text-success',
    error: 'text-destructive',
    destructive: 'text-destructive',
  };

  return (
    <div 
      className={cn(
        'border-l-4 p-4 rounded-r-md',
        variantStyles[variant] || variantStyles.default,
        className
      )}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <INFO_ICON 
            className={cn(
              'h-5 w-5',
              iconStyles[variant] || iconStyles.default
            )} 
            aria-hidden="true" 
          />
        </div>
        <div className="ml-3">
          <div className="text-sm [&>p]:m-0 [&>p:not(:last-child)]:mb-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoCard;
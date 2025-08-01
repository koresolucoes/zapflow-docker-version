import React from 'react';
import { cn } from '../../lib/utils.js';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

const Switch: React.FC<SwitchProps> = ({ 
  checked, 
  onChange, 
  label, 
  disabled = false,
  className = ''
}) => {
  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <label className={cn("inline-flex items-center cursor-pointer", className)}>
      <div className="relative">
        <input 
          type="checkbox" 
          className="sr-only" 
          checked={checked} 
          onChange={handleToggle}
          disabled={disabled}
          aria-checked={checked}
        />
        <div 
          className={cn(
            "block w-10 h-6 rounded-full transition-colors",
            checked 
              ? "bg-primary" 
              : "bg-input",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        ></div>
        <div 
          className={cn(
            "dot absolute left-1 top-1 bg-background w-4 h-4 rounded-full transition-transform shadow-sm",
            checked ? 'translate-x-full' : ''
          )}
        ></div>
      </div>
      {label && (
        <span className={cn(
          "ml-3 text-sm font-medium",
          disabled ? "text-muted-foreground/50" : "text-foreground"
        )}>
          {label}
        </span>
      )}
    </label>
  );
};

export default Switch;
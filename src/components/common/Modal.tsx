import React, { ReactNode } from 'react';
import { X_ICON } from '../../components/icons/index.js';
import { cn } from '../../lib/utils.js';
import type { GlowVariant } from './Card.js';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  glow?: GlowVariant;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
};

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  children, 
  className = '',
  glow = 'primary',
  size = '2xl',
}) => {
  if (!isOpen) return null;

  const modalClasses = cn(
    'relative w-full rounded-lg bg-background shadow-xl overflow-hidden',
    sizeClasses[size],
    className,
    {
      'glow-effect': glow !== 'none',
      [`glow-${glow}`]: glow !== 'none',
      'glow-active': true, // Sempre ativo para modais
    }
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className={modalClasses}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card/70">
          <div>
            <h3 
              className="text-lg font-semibold leading-6 text-foreground" 
              id="modal-title"
            >
              {title}
            </h3>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            className="rounded-md p-1.5 text-gray-400 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            onClick={onClose}
            aria-label="Fechar"
          >
            <span className="sr-only">Fechar</span>
            <X_ICON className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 bg-background">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
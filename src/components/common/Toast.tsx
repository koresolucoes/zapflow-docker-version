import React from 'react';
import { useUiStore, Toast as ToastTypeData } from '../../stores/uiStore.js';
import { X_ICON, INFO_ICON, ALERT_TRIANGLE_ICON } from '../icons/index.js';

const toastIcons = {
    success: <INFO_ICON className="w-5 h-5 text-success" />,
    error: <ALERT_TRIANGLE_ICON className="w-5 h-5 text-destructive" />,
    warning: <ALERT_TRIANGLE_ICON className="w-5 h-5 text-warning" />,
    info: <INFO_ICON className="w-5 h-5 text-info" />,
};

const toastStyles = {
    success: 'bg-success/10 border-success/30 text-success-foreground',
    error: 'bg-destructive/10 border-destructive/30 text-destructive-foreground',
    warning: 'bg-warning/10 border-warning/30 text-warning-foreground',
    info: 'bg-info/10 border-info/30 text-info-foreground',
};

const Toast: React.FC<{ toast: ToastTypeData }> = ({ toast }) => {
    const removeToast = useUiStore(state => state.removeToast);

    return (
        <div 
            className={`w-full max-w-sm p-4 rounded-lg shadow-lg border flex items-start gap-3 animate-fade-in-right bg-popover ${toastStyles[toast.type]}`}
            role="alert"
        >
            <div className="flex-shrink-0 mt-0.5">
                {toastIcons[toast.type]}
            </div>
            <div className="flex-1 text-sm text-foreground">
                {toast.message}
            </div>
            <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 -mr-1 -mt-1 p-1 rounded-full hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Fechar"
            >
                <X_ICON className="w-4 h-4" />
            </button>
        </div>
    );
};

export const ToastContainer: React.FC = () => {
    const toasts = useUiStore(state => state.toasts);

    if (toasts.length === 0) {
        return null;
    }

    return (
        <div className="fixed top-6 right-6 z-[9999] space-y-3 w-full max-w-sm">
            {toasts.map(toast => (
                <Toast key={toast.id} toast={toast} />
            ))}
        </div>
    );
};
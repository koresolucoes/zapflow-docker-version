import React from 'react';

interface TimelineItemWrapperProps {
    icon: React.ReactNode;
    timestamp: string;
    children: React.ReactNode;
    isLast: boolean;
}

const TimelineItemWrapper: React.FC<TimelineItemWrapperProps> = ({ icon, timestamp, children, isLast }) => {
    
    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    
    return (
        <div className="relative flex items-start gap-4">
            {/* Linha Vertical */}
            {!isLast && <div className="absolute left-[18px] top-10 h-full w-px bg-border"></div>}
            
            {/* Ícone */}
            <div className="relative z-10 flex-shrink-0 w-10 h-10 flex items-center justify-center bg-accent/10 rounded-full border-4 border-background">
                {icon}
            </div>

            {/* Conteúdo */}
            <div className="flex-grow pt-1.5">
                {children}
                <p className="text-xs text-muted-foreground mt-1">{formatDate(timestamp)}</p>
            </div>
        </div>
    );
};

export default TimelineItemWrapper;
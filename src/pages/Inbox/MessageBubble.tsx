import React from 'react';
import { UnifiedMessage, MessageStatus } from '../../types/index.js';
import { FILE_TEXT_ICON } from '../../components/icons/index.js';
import { cn } from '../../lib/utils.js';

interface MessageBubbleProps {
    message: UnifiedMessage;
}

const ReadReceipt: React.FC<{ status?: MessageStatus }> = ({ status }) => {
    if (status === 'pending') {
        return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block ml-1 text-muted-foreground"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
    }
     if (status === 'failed') {
        return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block ml-1 text-destructive"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
    }
    if (!status || status === 'sent') {
         return (
            <svg viewBox="0 0 18 18" width="18" height="18" className="inline-block ml-1 text-muted-foreground">
                <path fill="currentColor" d="M17.394 5.035l-.57-.444a.434.434 0 00-.609.076l-6.39 8.198-2.628-2.52a.434.434 0 00-.583.027l-.52.484a.434.434 0 00.026.606l3.446 3.306a.434.434 0 00.582-.027l.52-.484a.434.434 0 00-.026-.606l-.52.484 6.96-8.932a.434.434 0 00.08-.605z"></path>
            </svg>
        );
    }
    
    const color = status === 'read' ? 'text-primary' : 'text-muted-foreground';

    return (
        <svg viewBox="0 0 18 18" width="18" height="18" className={`inline-block ml-1 ${color}`}>
            <path fill="currentColor" d="M17.394 5.035l-.57-.444a.434.434 0 00-.609.076l-6.39 8.198-2.628-2.52a.434.434 0 00-.583.027l-.52.484a.434.434 0 00.026.606l3.446 3.306a.434.434 0 00.582-.027l.52-.484a.434.434 0 00-.026-.606l-.52.484 6.96-8.932a.434.434 0 00.08-.605zm-4.552 0l-.57-.444a.434.434 0 00-.609.076l-6.39 8.198-2.628-2.52a.434.434 0 00-.583.027l-.52.484a.434.434 0 00.026.606l3.446 3.306a.434.434 0 00.582-.027l.52-.484a.434.434 0 00-.026-.606l-.52.484 6.96-8.932a.434.434 0 00.08-.605z"></path>
        </svg>
    );
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
    const isOutbound = message.type === 'outbound';
    
    const bubbleClasses = cn(
        'max-w-md md:max-w-lg lg:max-w-xl rounded-xl p-3 shadow-sm',
        isOutbound 
            ? 'bg-primary text-primary-foreground rounded-tr-none ml-auto' 
            : 'bg-secondary text-secondary-foreground rounded-tl-none mr-auto border border-border/50'
    );

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    
    return (
        <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
            <div className={bubbleClasses}>
                <p className="text-sm break-words whitespace-pre-wrap">
                    {message.content}
                </p>

                {message.source === 'campaign' && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2 border-t border-border/30 pt-2">
                        <FILE_TEXT_ICON className="w-3 h-3"/>
                        <span>Enviado via Campanha</span>
                    </div>
                )}

                <div className={cn(
                    "text-xs mt-2 flex items-center",
                    isOutbound 
                        ? "justify-end text-primary-foreground/80" 
                        : "justify-start text-secondary-foreground/80"
                )}>
                    <span>{formatTime(message.created_at)}</span>
                    {isOutbound && <ReadReceipt status={message.status} />}
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;
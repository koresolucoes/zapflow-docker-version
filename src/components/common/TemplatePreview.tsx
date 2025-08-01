import React from 'react';
import { MetaTemplateComponent } from '../../services/meta/types.js';
import { cn } from '../../lib/utils.js';

interface TemplatePreviewProps {
  components: MetaTemplateComponent[];
  recipientName?: string;
  variables?: Record<string, string>;
  className?: string;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({ 
    components, 
    recipientName,
    variables = {},
    className = ''
}) => {
    
    const applyVars = (text: string = '') => {
        if (!text) return '';
        let processedText = text;

        if (recipientName) {
            processedText = processedText.replace(/\{\{1\}\}/g, `[${recipientName}]`);
        }
        
        Object.entries(variables).forEach(([key, value]) => {
            const regex = new RegExp(key.replace(/\{/g, '\\{').replace(/\}/g, '\\}'), 'g');
            processedText = processedText.replace(regex, value ? `[${value}]` : key);
        });

        // Substitui quaisquer variáveis não preenchidas pelo seu placeholder para visualização
        processedText = processedText.replace(/\{\{(\d+)\}\}/g, '[Variável $1]');

        return processedText;
    };

    const header = components.find(c => c.type === 'HEADER');
    const body = components.find(c => c.type === 'BODY');
    const footer = components.find(c => c.type === 'FOOTER');
    const buttons = components.find(c => c.type === 'BUTTONS')?.buttons;

    const currentTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const phoneClasses = cn(
        "relative w-80 rounded-[40px] shadow-2xl overflow-hidden",
        "bg-background border-8 border-border"
    );
    
    const phoneHeaderClasses = cn(
        "p-2 flex items-center justify-between relative",
        "bg-card"
    );
    
    const avatarClasses = cn(
        "w-8 h-8 rounded-full flex items-center justify-center",
        "text-white font-bold text-sm bg-primary"
    );
    
    const chatBackgroundClasses = cn(
        "p-3 min-h-[480px] flex flex-col justify-end",
        "bg-background bg-[url('https://www.heroscreen.cc/static/media/whats-app-dark-bg.a5027f2f.png')] bg-cover"
    );
    
    const messageBubbleClasses = cn(
        "max-w-[85%] ml-auto rounded-lg rounded-tr-none p-2 shadow-md mb-2",
        "bg-primary text-primary-foreground"
    );
    
    const buttonClasses = cn(
        "rounded-lg p-2.5 text-center font-semibold text-sm cursor-pointer shadow-md",
        "bg-muted/80 text-primary hover:bg-muted/60 backdrop-blur-sm"
    );
    
    const helperTextClasses = "text-center text-xs text-muted-foreground mt-2 w-80";
    const timestampClasses = "text-right text-xs text-muted-foreground/80 mt-1 flex items-center justify-end";
    const footerTextClasses = "text-xs text-muted-foreground/90 mt-2";
    const onlineTextClasses = "text-muted-foreground text-xs";
    const contactNameClasses = "font-semibold text-sm";
    const phoneNotchClasses = "absolute top-2.5 left-1/2 -translate-x-1/2 w-20 h-5 rounded-b-lg z-20 bg-border";

    return (
        <div className={cn("flex flex-col items-center justify-start", className)}>
            <div className={phoneClasses}>
                {/* Phone Header */}
                <div className={phoneHeaderClasses}>
                    <div className="flex items-center space-x-3">
                        <div className={avatarClasses}>
                            {(recipientName || 'C').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className={contactNameClasses}>{recipientName || 'Contato'}</p>
                            <p className={onlineTextClasses}>online</p>
                        </div>
                    </div>
                    <div className={phoneNotchClasses}></div>
                </div>

                {/* Chat background */}
                <div className={chatBackgroundClasses}>
                    <div className='w-full'>
                        {/* Message bubble */}
                        <div className={messageBubbleClasses}>
                            {/* Header */}
                            {header?.text && (
                                <p className="font-bold mb-1 break-words" style={{ whiteSpace: 'pre-wrap' }}>
                                    {applyVars(header.text)}
                                </p>
                            )}
                            
                            {/* Body */}
                            {body?.text && (
                                <p className="text-sm break-words" style={{ whiteSpace: 'pre-wrap' }}>
                                    {applyVars(body.text)}
                                </p>
                            )}

                            {/* Footer */}
                            {footer?.text && (
                                <p className={footerTextClasses} style={{ whiteSpace: 'pre-wrap' }}>
                                    {applyVars(footer.text)}
                                </p>
                            )}

                            {/* Timestamp & Read Receipt */}
                            <div className={timestampClasses}>
                                <span>{currentTime}</span>
                                <svg viewBox="0 0 18 18" width="18" height="18" className="inline-block ml-1 text-primary-foreground/80">
                                    <path 
                                        fill="currentColor" 
                                        d="M17.394 5.035l-.57-.444a.434.434 0 00-.609.076l-6.39 8.198-2.628-2.52a.434.434 0 00-.583.027l-.52.484a.434.434 0 00.026.606l3.446 3.306a.434.434 0 00.582-.027l.52-.484a.434.434 0 00-.026-.606l-.52.484 6.96-8.932a.434.434 0 00.08-.605zm-4.552 0l-.57-.444a.434.434 0 00-.609.076l-6.39 8.198-2.628-2.52a.434.434 0 00-.583.027l-.52.484a.434.434 0 00.026.606l3.446 3.306a.434.434 0 00.582-.027l.52-.484a.434.434 0 00-.026-.606l-.52.484 6.96-8.932a.434.434 0 00.08-.605z"
                                    />
                                </svg>
                            </div>
                        </div>

                        {/* Buttons */}
                        {buttons && buttons.length > 0 && (
                            <div className="mt-1 space-y-1">
                                {buttons.map((button, index) => (
                                    <div key={index} className={buttonClasses}>
                                        {button.text || "Texto do Botão"}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <p className={helperTextClasses}>
                Esta é uma prévia. A aparência final pode variar.
            </p>
        </div>
    );
};

export default TemplatePreview;
import React, { useRef, useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore.js';
import MessageBubble from './MessageBubble.js';
import MessageInput from './MessageInput.js';
import { Button } from '../../components/common/Button.js';
import { INFO_ICON, NOTE_ICON, CALENDAR_ICON } from '../../components/icons/index.js';
import { UnifiedMessage } from '../../types/index.js';
import ActivityModal from './ActivityModal.js';

interface ChatWindowProps {
    isPanelOpen: boolean;
    setIsPanelOpen: (isOpen: boolean) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ isPanelOpen, setIsPanelOpen }) => {
    const { messages, activeContactId, inboxLoading, contacts } = useAuthStore();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [activityModal, setActivityModal] = useState<{isOpen: boolean; type: 'NOTA' | 'TAREFA' | null}>({isOpen: false, type: null});

    const activeContact = contacts.find(c => c.id === activeContactId);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }, [messages]);

    if (!activeContact) {
        return <div className="flex-1 bg-background" />;
    }
    
    const handleOpenActivityModal = (type: 'NOTA' | 'TAREFA') => {
        setActivityModal({ isOpen: true, type });
    };

    const handleCloseActivityModal = () => {
        setActivityModal({ isOpen: false, type: null });
    };


    return (
        <>
            <section className="flex-1 flex flex-col bg-background overflow-hidden">
                <header className="flex-shrink-0 flex items-center p-3 border-b border-border bg-card">
                    <img
                        className="h-10 w-10 rounded-full object-cover"
                        src={`https://api.dicebear.com/8.x/initials/svg?seed=${activeContact.name}`}
                        alt="Avatar"
                    />
                    <div className="ml-3">
                        <h2 className="font-semibold text-foreground">{activeContact.name}</h2>
                        <p className="text-sm text-muted-foreground font-mono">{activeContact.phone}</p>
                    </div>
                     <div className="ml-auto flex items-center gap-2">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleOpenActivityModal('NOTA')} 
                            title="Adicionar Nota" 
                            className="rounded-full"
                        >
                            <NOTE_ICON className="w-5 h-5" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleOpenActivityModal('TAREFA')} 
                            title="Adicionar Tarefa" 
                            className="rounded-full"
                        >
                            <CALENDAR_ICON className="w-5 h-5" />
                        </Button>
                        <Button 
                            variant={isPanelOpen ? "secondary" : "ghost"}
                            size="icon"
                            onClick={() => setIsPanelOpen(!isPanelOpen)}
                            className="rounded-full"
                            title={isPanelOpen ? 'Ocultar Detalhes' : 'Mostrar Detalhes'}
                        >
                            <INFO_ICON className="w-5 h-5" />
                        </Button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-chat-bg bg-cover">
                    <div className="space-y-4">
                        {inboxLoading ? (
                            <div className="text-center text-muted-foreground">Carregando mensagens...</div>
                        ) : (
                            messages.map((msg: UnifiedMessage) => (
                                <MessageBubble key={msg.id} message={msg} />
                            ))
                        )}
                    </div>
                    <div ref={messagesEndRef} />
                </div>

                <MessageInput contactId={activeContact.id} />
            </section>
             {activityModal.isOpen && activeContact && (
                 <ActivityModal
                    isOpen={activityModal.isOpen}
                    onClose={handleCloseActivityModal}
                    type={activityModal.type!}
                    contactId={activeContact.id}
                />
            )}
        </>
    );
};

export default ChatWindow;
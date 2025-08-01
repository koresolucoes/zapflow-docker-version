import React, { useState } from 'react';
import ConversationList from './ConversationList.js';
import ChatWindow from './ChatWindow.js';
import ContactPanel from './ContactPanel.js';
import { useAuthStore } from '../../stores/authStore.js';
import { INBOX_ICON } from '../../components/icons/index.js';

const Inbox: React.FC = () => {
    const { activeContactId } = useAuthStore();
    const [isPanelOpen, setIsPanelOpen] = useState(true);

    return (
        <div className="h-full flex flex-col">
            <header className="flex-shrink-0 px-6 py-4">
                <h1 className="text-3xl font-bold text-foreground">Caixa de Entrada</h1>
            </header>
            <main className="flex-grow flex-1 flex overflow-hidden bg-card/50 rounded-xl border border-border">
                <ConversationList />
                <div className="flex-1 flex overflow-hidden">
                    {activeContactId ? (
                        <>
                            <ChatWindow 
                                isPanelOpen={isPanelOpen} 
                                setIsPanelOpen={setIsPanelOpen} 
                            />
                            {isPanelOpen && <ContactPanel contactId={activeContactId} />}
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center bg-background p-8">
                            <INBOX_ICON className="w-20 h-20 text-muted-foreground/50 mb-4" />
                            <h2 className="text-xl font-semibold text-foreground">Selecione uma conversa</h2>
                            <p className="text-muted-foreground mt-1">Escolha uma conversa da lista à esquerda para ver as mensagens.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Inbox;
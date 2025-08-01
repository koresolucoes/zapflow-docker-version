import React, { useState, useMemo } from 'react';
import { useAuthStore } from '../../stores/authStore.js';
import { Conversation } from '../../types/index.js';
import { useUiStore } from '../../stores/uiStore.js';
import { TRASH_ICON } from '../../components/icons/index.js';
import { Button } from '../../components/common/Button.js';
import { cn } from '../../lib/utils.js';

const ConversationListItem: React.FC<{ conversation: Conversation; isActive: boolean; onClick: () => void; onDelete: () => void; }> = ({ conversation, isActive, onClick, onDelete }) => {
    
    const truncate = (text: string | null | undefined, length: number) => {
        if (!text) return '';
        return text.length > length ? text.substring(0, length) + '...' : text;
    };

    const formatTime = (dateString: string | null | undefined) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return ''; // Retorna string vazia para datas inválidas
        }

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        if (date >= startOfToday) {
            return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        } else {
             return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        }
    }

    return (
        <li
            onClick={onClick}
            className={cn(
                'group flex items-center p-3 cursor-pointer transition-colors duration-150 rounded-lg',
                isActive ? 'bg-accent/20' : 'hover:bg-accent/10'
            )}
        >
            <div className="relative flex-shrink-0">
                <img
                    className="h-11 w-11 rounded-full object-cover"
                    src={`https://api.dicebear.com/8.x/initials/svg?seed=${conversation.contact.name}`}
                    alt="Avatar"
                />
                {conversation.assignee_email && (
                     <img
                        className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full object-cover border-2 border-card"
                        src={`https://api.dicebear.com/8.x/initials/svg?seed=${conversation.assignee_email}`}
                        alt="Assignee Avatar"
                        title={`Atendido por: ${conversation.assignee_email}`}
                    />
                )}
            </div>
            <div className="flex-grow ml-3 overflow-hidden">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-foreground truncate flex items-center">
                       {conversation.contact.sentiment && <span className="mr-1.5 text-lg">{conversation.contact.sentiment}</span>}
                       <span className="truncate">{conversation.contact.name}</span>
                    </h3>
                    {conversation.last_message && (
                        <p className="text-xs text-muted-foreground flex-shrink-0">
                            {formatTime(conversation.last_message.created_at)}
                        </p>
                    )}
                </div>
                <div className="flex justify-between items-start mt-0.5">
                    <p className="text-sm text-muted-foreground truncate pr-2">
                        {conversation.last_message?.type === 'outbound' && 'Você: '}
                        {truncate(conversation.last_message?.content, 30)}
                    </p>
                     {conversation.unread_count > 0 && (
                        <span className="ml-2 flex-shrink-0 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                            {conversation.unread_count}
                        </span>
                    )}
                </div>
            </div>
             <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="ml-2 flex-shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                title="Excluir conversa"
            >
                <TRASH_ICON className="w-4 h-4" />
            </Button>
        </li>
    );
};

const FilterButton: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={cn(
            'px-3 py-1 text-xs font-semibold rounded-full transition-colors',
            isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent/50'
        )}
    >
        {label}
    </button>
);

const ConversationList: React.FC = () => {
    const { conversations, activeContactId, setActiveContactId, inboxLoading, user, deleteConversation } = useAuthStore();
    const { showConfirmation, addToast } = useUiStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'mine' | 'unassigned'>('all');

    const filteredConversations = useMemo(() => {
        return conversations
            .filter(conv => {
                if (filter === 'mine') return conv.assignee_id === user?.id;
                if (filter === 'unassigned') return conv.assignee_id === null;
                return true; // 'all'
            })
            .filter(conv => {
                if (searchTerm.trim() === '') return true;
                return conv.contact.name.toLowerCase().includes(searchTerm.toLowerCase());
            });
    }, [conversations, searchTerm, filter, user]);
    
    const handleDeleteConversation = (conv: Conversation) => {
        showConfirmation(
            'Excluir Conversa',
            `Tem certeza de que deseja excluir a conversa com "${conv.contact.name}"? Todas as mensagens serão perdidas permanentemente.`,
            async () => {
                try {
                    await deleteConversation(conv.contact.id);
                    addToast('Conversa excluída com sucesso.', 'success');
                } catch (err: any) {
                    addToast(`Erro ao excluir conversa: ${err.message}`, 'error');
                }
            }
        );
    };

    return (
        <aside className="w-96 flex-shrink-0 bg-card border-r border-border flex flex-col">
            <div className="p-4 space-y-3">
                <input
                    type="search"
                    placeholder="Pesquisar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-background border border-input rounded-lg p-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                />
                <div className="flex items-center gap-2">
                    <FilterButton label="Todas" isActive={filter === 'all'} onClick={() => setFilter('all')} />
                    <FilterButton label="Minhas" isActive={filter === 'mine'} onClick={() => setFilter('mine')} />
                    <FilterButton label="Não Atribuídas" isActive={filter === 'unassigned'} onClick={() => setFilter('unassigned')} />
                </div>
            </div>
            <ul className="flex-grow overflow-y-auto px-2">
                 {inboxLoading && conversations.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">Carregando conversas...</div>
                ) : filteredConversations.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">Nenhuma conversa encontrada.</div>
                ) : (
                    filteredConversations.map(conv => (
                        <ConversationListItem
                            key={conv.contact.id}
                            conversation={conv}
                            isActive={activeContactId === conv.contact.id}
                            onClick={() => setActiveContactId(conv.contact.id)}
                            onDelete={() => handleDeleteConversation(conv)}
                        />
                    ))
                )}
            </ul>
        </aside>
    );
};

export default ConversationList;

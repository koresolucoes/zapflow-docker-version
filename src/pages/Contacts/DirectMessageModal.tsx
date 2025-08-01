import React, { useState, useMemo } from 'react';
import Modal from '../../components/common/Modal.js';
import  { Button } from '../../components/common/Button.js';
import InfoCard from '../../components/common/InfoCard.js';
import { Contact } from '../../types/index.js';
import { useAuthStore } from '../../stores/authStore.js';

interface DirectMessageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (message: string, recipients: Contact[]) => Promise<void>;
    contacts: Contact[];
    isSending: boolean;
}

const DirectMessageModal: React.FC<DirectMessageModalProps> = ({ isOpen, onClose, onSend, contacts, isSending }) => {
    const { allTags } = useAuthStore();
    const [message, setMessage] = useState('');
    const [sendToAll, setSendToAll] = useState(true);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    
    const recipients = useMemo(() => {
        if (sendToAll) return contacts;
        if (selectedTags.length === 0) return [];
        return contacts.filter(contact =>
            contact.tags && selectedTags.every(tag => contact.tags!.includes(tag))
        );
    }, [contacts, selectedTags, sendToAll]);
    
    const handleTagToggle = (tag: string) => {
        setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    };
    
    const handleSendClick = () => {
        if (message.trim() && recipients.length > 0) {
            onSend(message.trim(), recipients);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Enviar Mensagem Direta">
            <div className="space-y-4">
                <InfoCard variant="warning">
                    <h3 className="font-semibold text-amber-200">Atenção: Use com Cuidado</h3>
                    <p className="text-sm">O envio de mensagens diretas só é permitido para contatos que interagiram com você nas <strong>últimas 24 horas</strong>. O envio em massa fora desta janela pode violar as políticas do WhatsApp e resultar no bloqueio da sua conta.</p>
                </InfoCard>

                <div>
                    <label htmlFor="directMessage" className="block text-sm font-medium text-foreground mb-1">
                        Mensagem
                    </label>
                    <textarea
                        id="directMessage"
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full rounded-md border border-input bg-background p-2 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        placeholder="Digite sua mensagem aqui..."
                    />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Selecionar Destinatários
                  </label>
                  <div className="space-y-3 p-4 bg-muted/50 rounded-md border border-border">
                      <div className="flex items-center">
                          <input 
                              type="radio" 
                              id="dmSendToAll" 
                              name="dmRecipientType" 
                              checked={sendToAll} 
                              onChange={() => setSendToAll(true)} 
                              className="h-4 w-4 text-primary border-input focus:ring-primary"
                          />
                          <label htmlFor="dmSendToAll" className="ml-3 block text-sm font-medium text-foreground">
                              Todos os Contatos ({contacts.length})
                          </label>
                      </div>
                      <div className="flex items-center">
                          <input 
                              type="radio" 
                              id="dmSendToSegment" 
                              name="dmRecipientType" 
                              checked={!sendToAll} 
                              onChange={() => setSendToAll(false)} 
                              className="h-4 w-4 text-primary border-input focus:ring-primary"
                          />
                          <label htmlFor="dmSendToSegment" className="ml-3 block text-sm font-medium text-foreground">
                              Segmentar por Tags
                          </label>
                      </div>
                      {!sendToAll && (
                          <div className="pl-7 pt-2 space-y-2 max-h-48 overflow-y-auto">
                               {allTags.length > 0 ? (
                                    allTags.map(tag => (
                                        <div key={tag} className="flex items-center">
                                            <input
                                                id={`dm-tag-${tag}`}
                                                type="checkbox"
                                                checked={selectedTags.includes(tag)}
                                                onChange={() => handleTagToggle(tag)}
                                                className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                                            />
                                            <label htmlFor={`dm-tag-${tag}`} className="ml-3 text-sm text-muted-foreground">
                                                {tag}
                                            </label>
                                        </div>
                                    ))
                               ) : (
                                   <p className="text-sm text-muted-foreground">Nenhuma tag encontrada para segmentar.</p>
                               )}
                          </div>
                      )}
                      <div className="pt-2 text-center text-sm font-semibold text-primary">
                          <p>Total de destinatários: {recipients.length}</p>
                      </div>
                  </div>
                </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-border">
                <Button variant="outline" onClick={onClose} disabled={isSending}>Cancelar</Button>
                <Button 
                    variant="default" 
                    onClick={handleSendClick} 
                    isLoading={isSending} 
                    disabled={!message.trim() || recipients.length === 0}
                >
                    Enviar para {recipients.length} Contato(s)
                </Button>
            </div>
        </Modal>
    );
};

export default DirectMessageModal;
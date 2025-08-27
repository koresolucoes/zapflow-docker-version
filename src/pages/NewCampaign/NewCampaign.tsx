import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '../../components/common/Card.js';
import { Button } from '../../components/common/Button.js';
import { Input } from '../../components/common/Input.js';
import { Select } from '../../components/common/Select.js';
import Modal from '../../components/common/Modal.js';
import TemplatePreview from '../../components/common/TemplatePreview.js';
import { useAuthStore } from '../../stores/authStore.js';
// Import your API client for the new authentication system
import { apiClient } from '../../lib/apiClient';
import { Contact } from '../../types/index.js';

// Helper to resolve nested object paths for variables. e.g., "contact.name"
const getValueFromPath = (obj: any, path: string): any => {
  if (!path || !obj) return undefined;
  return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
};

const NewCampaign: React.FC = () => {
  const { templates, contacts, pageParams, setCurrentPage, activeTeam } = useAuthStore();
  
  const [campaignName, setCampaignName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [sendToAll, setSendToAll] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);

  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [sendingSpeed, setSendingSpeed] = useState<'instant' | 'slow' | 'very_slow'>('instant');

  // Redirect if no template is selected
  useEffect(() => {
    if (!pageParams?.templateId) {
      setError('Nenhum template selecionado. Por favor, retorne e selecione um.');
      setCurrentPage('templates');
    }
  }, [pageParams, setCurrentPage]);

  const template = useMemo(() => {
    return templates.find(t => t.id === pageParams?.templateId);
  }, [pageParams?.templateId, templates]);

  const placeholders = useMemo(() => {
    if (!template?.components) return [];
    const allText = template.components.map(c => c.text || '').join(' ');
    const matches = allText.match(/\{\{\d+\}\}/g) || [];
    // Deduplicate and sort placeholders numerically
    return [...new Set(matches)].sort((a, b) => parseInt(a.match(/\d+/)?.[0] || '0') - parseInt(b.match(/\d+/)?.[0] || '0'));
  }, [template]);

  // Initialize variables state
  useEffect(() => {
    const initialVars: Record<string, string> = {};
    placeholders.forEach(p => {
      if (p !== '{{1}}') { // {{1}} is always the contact's name, not user-editable
        initialVars[p] = '';
      }
    });
    setTemplateVariables(initialVars);
  }, [placeholders]);
  
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    contacts.forEach(c => c.tags?.forEach(t => tagsSet.add(t.trim())));
    return Array.from(tagsSet).sort();
  }, [contacts]);

  const recipients = useMemo(() => {
    if (sendToAll) return contacts;
    if (selectedTags.length === 0) return [];
    return contacts.filter(c => c.tags && selectedTags.every(tag => c.tags!.includes(tag)));
  }, [contacts, selectedTags, sendToAll]);

  // --- Handlers ---
  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleVariableChange = (placeholder: string, value: string) => {
    setTemplateVariables(prev => ({ ...prev, [placeholder]: value }));
  };
  
  const handleConfirmOpen = () => {
    setError(null);
    if (!campaignName.trim()) return setError('Por favor, dê um nome para a sua campanha.');
    if (isScheduled && !scheduleDate) return setError("Por favor, selecione uma data e hora para o agendamento.");
    if (isScheduled && new Date(scheduleDate) <= new Date()) return setError("A data de agendamento deve ser no futuro.");
    if (template?.status !== 'APPROVED') return setError(`Este template não pode ser usado (status: ${template?.status}). Apenas templates 'APPROVED' podem ser enviados.`);
    for (const key in templateVariables) {
      if (!templateVariables[key]) return setError(`Por favor, preencha o valor para a variável ${key}.`);
    }
    if (recipients.length === 0) return setError("Não há contatos selecionados para esta campanha.");

    setIsConfirmModalOpen(true);
  };
  
  // Refactored to always use the backend queue
  const handleLaunchCampaign = async () => {
    setIsConfirmModalOpen(false);
    setIsLoading(true);
    setError(null);

    if (!template || !activeTeam) {
      setError("Template ou equipe ativa não encontrados.");
      setIsLoading(false);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError("Sessão inválida. Por favor, faça login novamente.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/enqueue-campaign-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          campaignName,
          templateId: template.id,
          variables: templateVariables,
          recipients,
          speed: sendingSpeed,
          teamId: activeTeam.id,
          scheduleDate: isScheduled ? scheduleDate : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Falha ao enfileirar a campanha.');
      }
      
      setIsResultsModalOpen(true);

    } catch(err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- UI Derived State ---
  const previewName = useMemo(() => {
     return recipients[0]?.name || contacts[0]?.name || 'Cliente';
  }, [recipients, contacts]);

  const variablePlaceholders = placeholders.filter(p => p !== '{{1}}');

  const getModalActionText = () => {
    if (isScheduled) return 'agendar';
    if (sendingSpeed !== 'instant') return 'enfileirar';
    return 'enviar';
  };

  const getResultTitle = () => {
    if (isScheduled) return "Campanha Agendada!";
    if (sendingSpeed !== 'instant') return "Campanha Enfileirada!";
    return "Campanha Enviada!";
  };
  
  const getResultMessage = () => {
    let message = `Sua campanha "${campaignName}" foi `;
    if (isScheduled) return message + `agendada com sucesso para ${new Date(scheduleDate).toLocaleString('pt-BR')}.`;
    if (sendingSpeed !== 'instant') return message + "enfileirada para envio gradual. Você pode acompanhar o progresso na tela de campanhas.";
    return message + "enviada para a fila de processamento. O envio começará em breve.";
  };

  if (!template) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <Card className="p-6 text-center border-destructive">
          <h2 className="text-xl font-semibold text-destructive mb-2">Template não encontrado</h2>
          <p className="text-muted-foreground mb-4">O template selecionado não foi encontrado. Por favor, volte e tente novamente.</p>
          <Button onClick={() => setCurrentPage('templates')}>Voltar para Templates</Button>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8 max-w-4xl mx-auto p-4">
        <h1 className="text-3xl font-bold">Lançar Nova Campanha</h1>
        
        {error && <Card className="border-l-4 border-red-500 p-4"><p className="text-red-500">{error}</p></Card>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <Card className="p-6 space-y-6">
            {/* Campaign Name */}
            <div>
              <label htmlFor="campaignName" className="block text-sm font-medium text-muted-foreground mb-1">1. Nome da Campanha</label>
              <Input
                type="text"
                id="campaignName"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="Ex: Promoção de Verão - VIPs"
              />
            </div>

            {/* Sending Speed */}
            <div>
              <label htmlFor="sendingSpeed" className="block text-sm font-medium text-muted-foreground mb-1">2. Velocidade de Envio</label>
              <Select
                id="sendingSpeed"
                value={sendingSpeed}
                onChange={(e) => setSendingSpeed(e.target.value as any)}
              >
                <option value="instant">Imediato (Máxima velocidade)</option>
                <option value="slow">Lento (aprox. 1 por minuto)</option>
                <option value="very_slow">Muito Lento (aprox. 1 por 5 minutos)</option>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">Velocidades lentas ajudam a evitar bloqueios e requerem um serviço de fila no backend.</p>
            </div>

            {/* Scheduling */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">3. Agendamento (Opcional)</label>
              <div className="p-4 bg-secondary/30 rounded-md">
                <label htmlFor="isScheduled" className="flex items-center cursor-pointer">
                  <input type="checkbox" id="isScheduled" checked={isScheduled} onChange={(e) => setIsScheduled(e.target.checked)} className="h-4 w-4 rounded text-primary focus:ring-primary"/>
                  <span className="ml-3 text-sm font-medium">Agendar envio para uma data específica</span>
                </label>
                {isScheduled && (
                  <div className="mt-3">
                    <label htmlFor="scheduleDate" className="block text-xs font-medium text-muted-foreground mb-1">Data e Hora do Envio</label>
                    <Input
                      type="datetime-local"
                      id="scheduleDate"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                )}
              </div>
            </div>
            
            {/* Variables */}
            {variablePlaceholders.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">4. Preencher Variáveis</label>
                <p className="text-xs text-muted-foreground mb-2">Use variáveis como {"{{contact.name}}"} ou {"{{contact.custom_fields.sua_chave}}"} nos campos.</p>
                <div className="space-y-3 p-4 bg-secondary/30 rounded-md">
                  {variablePlaceholders.map(p => (
                    <div key={p}>
                      <label htmlFor={`var-${p}`} className="block text-xs font-medium text-muted-foreground mb-1">Variável {p}</label>
                      <Input
                        type="text"
                        id={`var-${p}`}
                        value={templateVariables[p] || ''}
                        onChange={(e) => handleVariableChange(p, e.target.value)}
                        placeholder={`Valor para ${p}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recipients */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">5. Selecionar Destinatários</label>
              <div className="space-y-3 p-4 bg-secondary/30 rounded-md">
                <div className="flex items-center">
                  <input type="radio" id="sendToAll" name="recipientType" checked={sendToAll} onChange={() => setSendToAll(true)} className="h-4 w-4 text-primary focus:ring-primary"/>
                  <label htmlFor="sendToAll" className="ml-3 block text-sm font-medium">Todos os Contatos ({contacts.length})</label>
                </div>
                <div className="flex items-center">
                  <input type="radio" id="sendToSegment" name="recipientType" checked={!sendToAll} onChange={() => setSendToAll(false)} className="h-4 w-4 text-primary focus:ring-primary"/>
                  <label htmlFor="sendToSegment" className="ml-3 block text-sm font-medium">Segmentar por Tags</label>
                </div>
                {!sendToAll && (
                  <div className="pl-7 pt-2 space-y-2 max-h-48 overflow-y-auto">
                    {allTags.length > 0 ? (
                      allTags.map(tag => (
                        <div key={tag} className="flex items-center">
                          <input id={`tag-${tag}`} type="checkbox" checked={selectedTags.includes(tag)} onChange={() => handleTagToggle(tag)} className="h-4 w-4 rounded text-primary focus:ring-primary"/>
                          <label htmlFor={`tag-${tag}`} className="ml-3 text-sm">{tag}</label>
                        </div>
                      ))
                    ) : <p className="text-sm text-muted-foreground">Nenhuma tag encontrada.</p>}
                  </div>
                )}
                <div className="pt-2 text-center text-sm font-semibold text-primary"><p>Total de destinatários: {recipients.length}</p></div>
              </div>
            </div>

            <Button onClick={handleConfirmOpen} size="lg" className="w-full" isLoading={isLoading} disabled={!campaignName || recipients.length === 0}>
              <span>{isScheduled ? '🗓️ Revisar e Agendar' : '🚀 Revisar e Lançar'}</span>
            </Button>
          </Card>

          {/* Preview */}
          <div className="sticky top-4">
            <h2 className="text-lg font-semibold mb-2">Prévia da Mensagem</h2>
            <TemplatePreview 
              components={template.components}
              recipientName={previewName}
              variables={templateVariables}
            />
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title="Confirmar Campanha">
        <div className="text-muted-foreground space-y-4">
          <p>Você está prestes a {getModalActionText()} a campanha <strong>{campaignName}</strong>.</p>
          <div className="p-4 bg-secondary/50 rounded-lg space-y-2">
            <p><strong>Template:</strong> <span className="font-mono text-primary">{template?.template_name}</span></p>
            <p><strong>Destinatários:</strong> <span className="font-bold">{recipients.length}</span></p>
            {isScheduled && <p><strong>Agendada para:</strong> <span className="font-bold">{new Date(scheduleDate).toLocaleString('pt-BR')}</span></p>}
            {sendingSpeed !== 'instant' && <p><strong>Velocidade:</strong> <span className="font-bold">{sendingSpeed === 'slow' ? 'Lenta' : 'Muito Lenta'}</span></p>}
          </div>
          <p className="text-amber-500 text-sm">Esta ação não pode ser desfeita. Deseja continuar?</p>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setIsConfirmModalOpen(false)}>Cancelar</Button>
          <Button variant="default" onClick={handleLaunchCampaign} isLoading={isLoading}>Sim, {getModalActionText()}</Button>
        </div>
      </Modal>

      {/* Results Modal */}
      <Modal isOpen={isResultsModalOpen} onClose={() => setCurrentPage('campaigns')} title={getResultTitle()}>
        <div className="text-muted-foreground space-y-4">
          <p>{getResultMessage()}</p>
        </div>
        <div className="mt-6 flex justify-end">
          <Button variant="default" onClick={() => setCurrentPage('campaigns')}>Ver Campanhas</Button>
        </div>
      </Modal>
    </>
  );
};

export default NewCampaign;
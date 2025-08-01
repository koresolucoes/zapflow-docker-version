import React, { useState, useEffect } from 'react';
import { EditableProfile } from '../../types/index.js';
import { Card } from '../../components/common/Card.js';
import { Button } from '../../components/common/Button.js';
import InfoCard from '../../components/common/InfoCard.js';
import { COPY_ICON } from '../../components/icons/index.js';
import { useAuthStore } from '../../stores/authStore.js';
import { cn } from '../../lib/utils.js';

const MetaApiSettings: React.FC = () => {
    const profile = useAuthStore(state => state.profile);
    const user = useAuthStore(state => state.user);
    const updateProfile = useAuthStore(state => state.updateProfile);

    const [localConfig, setLocalConfig] = useState<EditableProfile>({
        meta_access_token: '',
        meta_waba_id: '',
        meta_phone_number_id: '',
        webhook_path_prefix: '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [verifyToken, setVerifyToken] = useState('');
    const [copyStatus, setCopyStatus] = useState({ url: false, token: false });

    useEffect(() => {
        if (profile) {
            setLocalConfig({
                meta_access_token: profile.meta_access_token || '',
                meta_waba_id: profile.meta_waba_id || '',
                meta_phone_number_id: profile.meta_phone_number_id || '',
                webhook_path_prefix: profile.webhook_path_prefix || '',
            });
        }
    }, [profile]);

    useEffect(() => {
        const ensureVerifyToken = async () => {
            if (profile && !profile.meta_verify_token) {
                const generateToken = () => {
                    const array = new Uint8Array(24);
                    window.crypto.getRandomValues(array);
                    return btoa(String.fromCharCode.apply(null, Array.from(array)))
                        .replace(/\+/g, '-')
                        .replace(/\//g, '_')
                        .replace(/=/g, '');
                };
                const newToken = generateToken();
                try {
                    await updateProfile({ meta_verify_token: newToken });
                    setVerifyToken(newToken);
                } catch(err) {
                    console.error("Falha ao salvar novo token de verificação:", err);
                    setError("Falha ao gerar e salvar o token de verificação. Recarregue a página.");
                }
            } else if (profile?.meta_verify_token) {
                setVerifyToken(profile.meta_verify_token);
            }
        };

        ensureVerifyToken();
    }, [profile, updateProfile]);

    const webhookUrl = user ? `/api/webhook/${user.id}` : '';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalConfig(prev => ({ ...prev, [name]: value } as EditableProfile));
        setIsSaved(false);
        setError(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        const trimmedConfig: EditableProfile = {
            meta_access_token: localConfig.meta_access_token?.trim() || '',
            meta_waba_id: localConfig.meta_waba_id?.trim() || '',
            meta_phone_number_id: localConfig.meta_phone_number_id?.trim() || '',
            webhook_path_prefix: localConfig.webhook_path_prefix?.trim() || '',
        };

        if (!trimmedConfig.meta_access_token || !trimmedConfig.meta_waba_id || !trimmedConfig.meta_phone_number_id) {
            setError("Os campos da API da Meta são obrigatórios.");
            setIsSaving(false);
            return;
        }
        
        if (trimmedConfig.webhook_path_prefix && trimmedConfig.webhook_path_prefix.includes('_')) {
            setError("O prefixo do webhook de automação não pode conter underscores (_). Use hífens (-).");
            setIsSaving(false);
            return;
        }

        try {
            await updateProfile(trimmedConfig);
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 3000);
        } catch(err: any) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };
    
    const copyToClipboard = (text: string, type: 'url' | 'token') => {
        if (text) {
           navigator.clipboard.writeText(text);
           setCopyStatus(prev => ({ ...prev, [type]: true }));
           setTimeout(() => setCopyStatus(prev => ({ ...prev, [type]: false })), 2000);
        }
    };

    if (!profile) return <div>Carregando...</div>;
    
    const baseInputClass = cn(
        "w-full bg-background border border-input rounded-md p-2 text-foreground",
        "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    );
    const sectionTitleClass = "text-lg font-semibold text-foreground";
    const labelClass = "block text-sm font-medium text-muted-foreground mb-1";
    const dividerClass = "border-t border-border/50";
    const successTextClass = "text-success";
    const errorTextClass = "text-destructive";
    const infoTextClass = "text-sm text-muted-foreground";
    const linkClass = "text-primary hover:underline";

    return (
        <>
            <Card>
                <form onSubmit={handleSave} className="space-y-6">
                    <h2 className={sectionTitleClass}>API da Meta (WhatsApp)</h2>
                    <p className={infoTextClass}>
                        Insira suas credenciais da API do WhatsApp Business para conectar sua conta.
                        Você pode encontrá-las no seu <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className={linkClass}>painel de aplicativos da Meta</a>.
                    </p>

                    <div>
                        <label htmlFor="meta_access_token" className={labelClass}>Token de Acesso</label>
                        <input
                            type="password"
                            id="meta_access_token"
                            name="meta_access_token"
                            value={localConfig.meta_access_token || ''}
                            onChange={handleChange}
                            className={baseInputClass}
                            placeholder="Cole seu token aqui"
                        />
                    </div>

                    <div>
                        <label htmlFor="meta_waba_id" className={labelClass}>ID da conta do WhatsApp Business (WABA ID)</label>
                        <input
                            type="text"
                            id="meta_waba_id"
                            name="meta_waba_id"
                            value={localConfig.meta_waba_id || ''}
                            onChange={handleChange}
                            className={baseInputClass}
                            placeholder="ID da sua conta business"
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="meta_phone_number_id" className={labelClass}>ID do número de telefone</label>
                        <input
                            type="text"
                            id="meta_phone_number_id"
                            name="meta_phone_number_id"
                            value={localConfig.meta_phone_number_id || ''}
                            onChange={handleChange}
                            className={baseInputClass}
                            placeholder="ID do seu número de telefone"
                        />
                    </div>

                    <h2 className={`${sectionTitleClass} pt-4 ${dividerClass}`}>Webhook de Automação</h2>
                    <div>
                        <label htmlFor="webhook_path_prefix" className={labelClass}>Prefixo do Caminho do Webhook (para Automações)</label>
                        <input
                            type="text"
                            id="webhook_path_prefix"
                            name="webhook_path_prefix"
                            value={localConfig.webhook_path_prefix || ''}
                            onChange={handleChange}
                            className={baseInputClass}
                            placeholder="Ex: minha-empresa-123"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Um prefixo único para suas URLs de gatilho de automação. **Não afeta o Webhook principal da Meta.** 
                            Use letras, números e hífens. **Evite underscores (_)**.
                        </p>
                    </div>
                    
                    <div className={`flex justify-end items-center gap-4 pt-4 ${dividerClass}`}>
                        {error && <p className={`${errorTextClass} text-sm text-right flex-1`}>{error}</p>}
                        {isSaved && <p className={`${successTextClass} text-sm`}>Configurações salvas com sucesso!</p>}
                        <Button type="submit" variant="default" isLoading={isSaving}>
                            Salvar Configurações
                        </Button>
                    </div>
                </form>
            </Card>

            <InfoCard>
                <h3 className="text-base font-semibold text-foreground mb-2">Configure o Webhook na Meta</h3>
                <p className={`${infoTextClass} mb-3`}>
                    Para receber o status das mensagens e as respostas dos clientes, configure um Webhook no seu aplicativo da Meta com os seguintes valores:
                </p>
                <div className="space-y-3 font-mono text-sm bg-muted/50 p-3 rounded-md">
                    <div className="flex justify-between items-center">
                        <div>
                            <span className="font-bold text-muted-foreground">Sua URL de Callback Única:</span>
                            <br/> {webhookUrl || "Gerando URL..."}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                                e.preventDefault();
                                copyToClipboard(webhookUrl, 'url');
                            }}
                            className="ml-2"
                        >
                            <COPY_ICON className="w-4 h-4 mr-1" />
                            {copyStatus.url ? 'Copiado!' : 'Copiar'}
                        </Button>
                    </div>
                    <div className="flex justify-between items-center">
                        <div>
                            <span className="font-bold text-muted-foreground">Token de Verificação:</span>
                            <br/> {verifyToken || "Gerando token..."}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                                e.preventDefault();
                                copyToClipboard(verifyToken, 'token');
                            }}
                            className="ml-2"
                        >
                            <COPY_ICON className="w-4 h-4 mr-1" />
                            {copyStatus.token ? 'Copiado!' : 'Copiar'}
                        </Button>
                    </div>
                </div>
                <p className={`${infoTextClass} mt-3`}>
                    No campo "Campos a assinar" selecione: <code className="bg-muted/50 px-1.5 py-0.5 rounded">messages</code>, 
                    <code className="bg-muted/50 px-1.5 py-0.5 rounded mx-1">message_template_status_update</code> e 
                    <code className="bg-muted/50 px-1.5 py-0.5 rounded mx-1">message_template_status_update</code>.
                </p>
            </InfoCard>
        </>
    );
};

export default MetaApiSettings;
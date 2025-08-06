import React, { useState, useEffect } from 'react';
import { EditableProfile } from '../../types/index.js';
import { Button } from '../../components/common/Button.js';
import { COPY_ICON } from '../../components/icons/index.js';
import { useAuthStore } from '../../stores/authStore.js';
import { cn } from '../../lib/utils.js';
import { 
    SettingsPage, 
    SettingsSection 
} from '../../components/settings/SettingsPage.js';

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

    // Construir a URL completa do webhook
    const webhookUrl = user ? `${window.location.origin}/api/webhook/${user.id}` : '';

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await handleSave(e);
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
        <SettingsPage
            title="API da Meta (WhatsApp)"
            description="Configure suas credenciais da API do WhatsApp Business para conectar sua conta."
        >
            <form onSubmit={handleSubmit}>
                <SettingsSection 
                    title="Credenciais da API"
                    description="Insira suas credenciais da API do WhatsApp Business. Você pode encontrá-las no seu painel de aplicativos da Meta."
                >
                    <div className="space-y-6">
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
                    </div>
                </SettingsSection>

                <SettingsSection 
                    title="Webhook de Automação"
                    description="Configure o webhook para automações do WhatsApp"
                    className="mt-8"
                >
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="webhook_path_prefix" className={labelClass}>Prefixo do Caminho do Webhook</label>
                            <input
                                type="text"
                                id="webhook_path_prefix"
                                name="webhook_path_prefix"
                                value={localConfig.webhook_path_prefix || ''}
                                onChange={handleChange}
                                className={baseInputClass}
                                placeholder="Ex: minha-empresa-123"
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                                Um prefixo único para suas URLs de gatilho de automação. <strong>Não afeta o Webhook principal da Meta.</strong> 
                                Use letras, números e hífens. <strong>Evite underscores (_)</strong>.
                            </p>
                        </div>

                        <div className="pt-2">
                            <h3 className="text-sm font-medium text-foreground mb-2">URL do Webhook</h3>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={webhookUrl}
                                    className="flex-1 bg-muted/50 border border-input rounded-md px-3 py-2 text-sm text-foreground/80"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyToClipboard(webhookUrl, 'url')}
                                    className="shrink-0"
                                >
                                    <COPY_ICON className="w-4 h-4 mr-1" />
                                    {copyStatus.url ? 'Copiado!' : 'Copiar'}
                                </Button>
                            </div>
                        </div>

                        <div className="pt-2">
                            <h3 className="text-sm font-medium text-foreground mb-2">Token de Verificação</h3>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={verifyToken}
                                    className="flex-1 bg-muted/50 border border-input rounded-md px-3 py-2 text-sm font-mono text-foreground/80"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyToClipboard(verifyToken, 'token')}
                                    className="shrink-0"
                                >
                                    <COPY_ICON className="w-4 h-4 mr-1" />
                                    {copyStatus.token ? 'Copiado!' : 'Copiar'}
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Use este token para validar o webhook no painel do Meta for Developers.
                            </p>
                        </div>
                    </div>
                </SettingsSection>

                <div className="flex justify-end pt-4 border-t border-border/50 mt-8">
                    <div className="flex items-center gap-4">
                        {error && <p className="text-destructive text-sm">{error}</p>}
                        {isSaved && <p className="text-success text-sm">Configurações salvas com sucesso!</p>}
                        <Button 
                            type="submit" 
                            disabled={isSaving}
                            className="w-full sm:w-auto"
                        >
                            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                    </div>
                </div>
            </form>
        </SettingsPage>
    );
};

export default MetaApiSettings;
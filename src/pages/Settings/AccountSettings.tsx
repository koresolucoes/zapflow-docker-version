import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { useAuthStore } from '../../stores/authStore.js';
import { useUiStore } from '../../stores/uiStore.js';
import { Button } from '../../components/common/Button.js';
import InfoCard from '../../components/common/InfoCard.js';
import { 
    SettingsPage, 
    SettingsSection,
    SettingsForm,
    SettingsFormField,
    SettingsFormActions
} from '../../components/settings/SettingsPage.js';

const AccountSettings: React.FC = () => {
    const { user } = useAuthStore();
    const { addToast } = useUiStore();

    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const handleUpdateEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEmail.trim()) return;
        
        setIsUpdatingEmail(true);
        setEmailError('');

        const { error } = await supabase.auth.updateUser({ email: newEmail });

        if (error) {
            setEmailError(error.message);
        } else {
            addToast('E-mail de confirmação enviado para o endereço antigo e o novo.', 'success');
            setNewEmail('');
        }
        setIsUpdatingEmail(false);
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        
        if (newPassword !== confirmPassword) {
            setPasswordError('As senhas não correspondem.');
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setIsUpdatingPassword(true);

        const { error } = await supabase.auth.updateUser({ password: newPassword });

        if (error) {
            setPasswordError(error.message);
        } else {
            addToast('Senha atualizada com sucesso!', 'success');
            setNewPassword('');
            setConfirmPassword('');
        }
        setIsUpdatingPassword(false);
    };
    
    return (
        <SettingsPage
            title="Configurações da Conta"
            description="Gerencie as configurações da sua conta"
        >
            <SettingsSection 
                title="Alterar E-mail"
                description={`Seu e-mail de login atual é: ${user?.email}`}
            >
                <InfoCard variant="info" className="mb-4">
                    Para alterar seu e-mail, você precisará confirmar a alteração em ambos os endereços, o antigo e o novo.
                </InfoCard>
                
                <SettingsForm onSubmit={handleUpdateEmail}>
                    <SettingsFormField 
                        label="Novo E-mail"
                        type="email"
                        id="newEmail"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        required
                        error={emailError}
                        placeholder="Digite seu novo e-mail"
                    />
                    
                    <SettingsFormActions>
                        <Button 
                            type="submit" 
                            variant="default"
                            isLoading={isUpdatingEmail}
                            disabled={!newEmail.trim()}
                        >
                            Atualizar E-mail
                        </Button>
                    </SettingsFormActions>
                </SettingsForm>
            </SettingsSection>

            <SettingsSection 
                title="Alterar Senha"
                description="Para sua segurança, recomendamos o uso de uma senha forte e única."
            >
                <SettingsForm onSubmit={handleUpdatePassword}>
                    <div className="space-y-4">
                        <SettingsFormField 
                            label="Nova Senha"
                            type="password"
                            id="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={6}
                            placeholder="Digite sua nova senha"
                        />
                        
                        <SettingsFormField 
                            label="Confirmar Nova Senha"
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                            error={passwordError}
                            placeholder="Confirme sua nova senha"
                        />
                    </div>
                    
                    <SettingsFormActions>
                        <Button 
                            type="submit" 
                            variant="default"
                            isLoading={isUpdatingPassword}
                            disabled={!newPassword || !confirmPassword}
                        >
                            Atualizar Senha
                        </Button>
                    </SettingsFormActions>
                </SettingsForm>
            </SettingsSection>
        </SettingsPage>
    );
};

export default AccountSettings;
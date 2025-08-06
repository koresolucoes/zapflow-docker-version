import React, { useState } from 'react';
import MetaApiSettings from './MetaApiSettings.js';
import CustomFieldsSettings from './CustomFieldsSettings.js';
import CannedResponsesSettings from './CannedResponsesSettings.js';
import TeamSettings from './TeamSettings.js';
import AccountSettings from './AccountSettings.js';

const TabButton = ({ label, isActive, onClick }: { label: string, isActive: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
            isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
        }`}
    >
        {label}
    </button>
);

const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState('meta');

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
            <div>
                <div className="border-b border flex flex-wrap">
                    <TabButton label="API da Meta & Webhooks" isActive={activeTab === 'meta'} onClick={() => setActiveTab('meta')} />
                    <TabButton label="Campos Personalizados" isActive={activeTab === 'custom'} onClick={() => setActiveTab('custom')} />
                    <TabButton label="Respostas Rápidas" isActive={activeTab === 'canned'} onClick={() => setActiveTab('canned')} />
                    <TabButton label="Equipe" isActive={activeTab === 'team'} onClick={() => setActiveTab('team')} />
                    <TabButton label="Conta" isActive={activeTab === 'account'} onClick={() => setActiveTab('account')} />
                </div>
                <div className="pt-6">
                    {activeTab === 'meta' && <MetaApiSettings />}
                    {activeTab === 'custom' && <CustomFieldsSettings />}
                    {activeTab === 'canned' && <CannedResponsesSettings />}
                    {activeTab === 'team' && <TeamSettings />}
                    {activeTab === 'account' && <AccountSettings />}
                </div>
            </div>
        </div>
    );
};

export default Settings;
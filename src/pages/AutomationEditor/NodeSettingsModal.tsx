import React, { useMemo, useContext } from 'react';
import { Node } from '@xyflow/react';
import { AutomationNode, MessageTemplate, Profile, AutomationNodeData, Pipeline, PipelineStage } from '../../types/index.js';
import { Button } from '../../components/common/Button.js';
import { getContextVariables } from './node-settings/common.js';
import { nodeConfigs } from '../../lib/automation/nodeConfigs.js';


interface NodeSettingsModalProps {
    node: AutomationNode | null;
    isOpen: boolean;
    onClose: () => void;
    nodes: AutomationNode[];
    onUpdateNodes: (nodes: AutomationNode[], options?: { immediate?: boolean }) => Promise<void>;
    automationId?: string;
    templates: MessageTemplate[];
    allTags: string[];
    profile: Profile | null;
    pipelines: Pipeline[];
    stages: PipelineStage[];
}

const NodeSettingsModal: React.FC<NodeSettingsModalProps> = ({ 
    node, 
    isOpen, 
    onClose, 
    nodes, 
    onUpdateNodes,
    automationId,
    templates,
    allTags,
    profile,
    pipelines,
    stages
}) => {
    
    const availableVariables = useMemo(() => getContextVariables(nodes), [nodes]);

    if (!isOpen || !node) return null;

    const data = node.data as AutomationNodeData;
    const nodeConfig = nodeConfigs[data.type];

    if (!nodeConfig) {
        console.warn(`Configuração não encontrada para o tipo de nó: ${data.type}`);
        return null;
    }

    const SettingsComponent = nodeConfig.SettingsComponent;

    const handleConfigChange = (updatedConfig: any, options?: { immediate?: boolean }) => {
        if (!node) return;
        const updatedNodes = nodes.map(n => n.id === node.id ? { ...n, data: { ...n.data, config: updatedConfig } } : n);
        onUpdateNodes(updatedNodes, options);
    };
    
    const isWebhookNode = node.data.type === 'webhook_received';
    const modalWidthClass = isWebhookNode ? 'max-w-7xl' : 'max-w-lg';
    const mainPaddingClass = isWebhookNode ? 'p-0' : 'p-6';


    return (
        <div 
            className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={onClose}
        >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm dark:bg-black/70"></div>
            
            <div 
                className={`bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 w-full ${modalWidthClass} max-h-[90vh] flex flex-col transition-all duration-300 ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{data.label}</h3>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <svg className="w-6 h-6 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </Button>
                </header>
                
                <main className={`flex-grow overflow-y-auto ${mainPaddingClass} bg-white dark:bg-slate-800`}>
                    <SettingsComponent 
                       node={node}
                       onConfigChange={handleConfigChange}
                       availableVariables={availableVariables}
                       templates={templates}
                       allTags={allTags}
                       profile={profile}
                       automationId={automationId}
                       pipelines={pipelines}
                       stages={stages}
                    />
                </main>

                <footer className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-slate-700 flex justify-end bg-gray-50 dark:bg-slate-800/50">
                    <Button variant="ghost" onClick={onClose} className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700">
                        Fechar
                    </Button>
                </footer>
            </div>
        </div>
    );
};

export default NodeSettingsModal;
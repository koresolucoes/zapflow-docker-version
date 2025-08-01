import React from 'react';
import { TimelineEvent } from '../../types/index.js';
import TimelineItemWrapper from './TimelineItemWrapper.js';
import { AUTOMATION_ICON } from '../../components/icons/index.js';

interface TimelineAutomationItemProps {
    event: TimelineEvent;
    isLast: boolean;
}

const TimelineAutomationItem: React.FC<TimelineAutomationItemProps> = ({ event, isLast }: TimelineAutomationItemProps) => {
    const statusText = event.data.status === 'success' ? 'executada com sucesso' : 'falhou';
    const textColor = event.data.status === 'success' ? 'text-green-500' : 'text-destructive';
    
    const automationName = event.data.automations?.name || 'Automação desconhecida';

    return (
        <TimelineItemWrapper
            icon={<AUTOMATION_ICON className="w-5 h-5 text-primary" />}
            timestamp={event.timestamp}
            isLast={isLast}
        >
            <p className="text-sm text-foreground">
                Automação <span className="font-semibold text-foreground">'{automationName}'</span> foi <span className={`font-semibold ${textColor}`}>{statusText}</span>.
            </p>
            {event.data.details && (
                <p className="text-xs text-muted-foreground font-mono bg-accent/10 p-2 rounded-md mt-1">
                    {event.data.details}
                </p>
            )}
        </TimelineItemWrapper>
    );
};

export default TimelineAutomationItem;
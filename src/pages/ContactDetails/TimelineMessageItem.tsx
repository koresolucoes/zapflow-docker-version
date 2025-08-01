import React from 'react';
import { TimelineEvent } from '../../types/index.js';
import TimelineItemWrapper from './TimelineItemWrapper.js';
import { ARROW_DOWN_LEFT_ICON, ARROW_UP_RIGHT_ICON } from '../../components/icons/index.js';

interface TimelineMessageItemProps {
    event: TimelineEvent;
    isLast: boolean;
}

const TimelineMessageItem: React.FC<TimelineMessageItemProps> = ({ event, isLast }: TimelineMessageItemProps) => {
    const isOutbound = event.data.type === 'outbound';
    const Icon = isOutbound ? ARROW_UP_RIGHT_ICON : ARROW_DOWN_LEFT_ICON;
    const iconColor = isOutbound ? 'text-primary' : 'text-green-500';

    const sourceText = {
        campaign: 'Campanha',
        automation: 'Automação',
        direct: 'Direta',
        inbound_reply: 'Resposta'
    };
    
    return (
        <TimelineItemWrapper
            icon={<Icon className={`w-5 h-5 ${iconColor}`} />}
            timestamp={event.timestamp}
            isLast={isLast}
        >
            <p className="text-sm text-foreground">
                {isOutbound && <span className="font-semibold text-foreground">Você: </span>}
                {event.data.content}
            </p>
            {event.data.source && (
                 <span className="text-xs font-medium text-muted-foreground bg-accent px-2 py-0.5 rounded-full">
                    {sourceText[event.data.source as keyof typeof sourceText] || event.data.source}
                </span>
            )}
        </TimelineItemWrapper>
    );
};

export default TimelineMessageItem;

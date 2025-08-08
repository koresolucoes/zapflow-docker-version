import React, { useMemo, useState, useEffect } from 'react';
import { Card } from '../../components/common/Card.js';
import { useAuthStore } from '../../stores/authStore.js';
import { fetchDashboardData, DashboardData } from '../../services/dataService.js';

import SalesMetrics from './SalesMetrics.js';
import AutomationAnalytics from './AutomationAnalytics.js';
import CampaignAnalytics from './CampaignAnalytics.js';
import ContactGrowth from './ContactGrowth.js';
import RecentActivityFeed from './RecentActivityFeed.js';
import TodaysTasksCard from './TodaysTasksCard.js';
import { CONTACTS_ICON, FUNNEL_ICON, AUTOMATION_ICON } from '../../components/icons/index.js';

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    footer?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, footer }) => {
    return (
        <Card className="flex flex-col justify-between p-4 h-full w-full overflow-hidden">
            <div className="w-full">
                <div className="flex items-start justify-between w-full">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-muted-foreground truncate">{title}</h3>
                        <p className="text-2xl font-bold text-foreground mt-1 truncate">{value}</p>
                    </div>
                    <div className="ml-4 flex-shrink-0 p-3 bg-accent/30 rounded-lg">
                        <div className="w-6 h-6 text-accent-foreground">
                            {icon}
                        </div>
                    </div>
                </div>
                {footer && <p className="text-xs text-muted-foreground/80 mt-2 truncate">{footer}</p>}
            </div>
        </Card>
    );
};

export const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover/90 backdrop-blur-sm p-3 rounded-lg border border-border shadow-xl">
        <p className="label font-bold text-foreground">{`${label}`}</p>
        {payload.map((pld: any) => (
          <p key={pld.dataKey} className="text-foreground/80">
            {`${pld.name}: ${pld.value.toLocaleString('pt-BR')}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};


const SortableCardWrapper: React.FC<{ id: string; children: React.ReactNode; className?: string }> = ({ id, children, className }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
        opacity: isDragging ? 0.8 : 1,
    };
    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={className}>
            {children}
        </div>
    );
};

const Dashboard: React.FC = () => {
  const { user, profile, updateProfile, activeTeam, contacts, deals, activePipelineId, automations } = useAuthStore();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Define a ordem e os componentes dos cards
  const defaultCardOrder = ['stats', 'sales', 'growth', 'tasks', 'campaigns', 'automations', 'activity'];
  const [cardOrder, setCardOrder] = useState<string[]>(defaultCardOrder);
  
  useEffect(() => {
      if (profile?.dashboard_layout && Array.isArray(profile.dashboard_layout) && profile.dashboard_layout.length > 0) {
          const layout = profile.dashboard_layout as string[];
          const profileCards = new Set(layout);
          const allCards = [...layout];
          // Garante que novos cards adicionados ao código apareçam para o usuário
          defaultCardOrder.forEach(key => {
              if (!profileCards.has(key)) {
                  allCards.push(key);
              }
          });
          setCardOrder(allCards);
      } else {
          setCardOrder(defaultCardOrder);
      }
  }, [profile]);

  useEffect(() => {
    const loadData = async () => {
        if (activeTeam) {
            setIsLoading(true);
            try {
                const data = await fetchDashboardData(activeTeam.id);
                setDashboardData(data);
            } catch (error) {
                console.error("Failed to load dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        }
    };
    loadData();
  }, [activeTeam]);

  const mainMetrics = useMemo(() => {
    const relevantDeals = deals.filter(d => d.pipeline_id === activePipelineId);
    const openDeals = relevantDeals.filter(d => d.status === 'Aberto');
    const wonDeals = relevantDeals.filter(d => d.status === 'Ganho');
    const lostDeals = relevantDeals.filter(d => d.status === 'Perdido');
    
    const openValue = openDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
    const totalClosed = wonDeals.length + lostDeals.length;
    const conversionRate = totalClosed > 0 ? (wonDeals.length / totalClosed) * 100 : 0;
    
    return {
        totalContacts: contacts.length.toLocaleString('pt-BR'),
        openDealsValue: openValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        conversionRate: `${conversionRate.toFixed(1)}%`,
        activeAutomations: automations.filter(a => a.status === 'active').length.toLocaleString('pt-BR'),
    };
  }, [contacts, deals, automations, activePipelineId]);

  const cardComponents: { [key: string]: React.ReactNode } = {
    stats: (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total de Contatos" value={mainMetrics.totalContacts} icon={<CONTACTS_ICON />} />
            <StatCard title="Negócios em Aberto" value={mainMetrics.openDealsValue} icon={<FUNNEL_ICON />} />
            <StatCard title="Taxa de Conversão" value={mainMetrics.conversionRate} icon={<span className="text-warning font-bold text-xl">%</span>} footer="Negócios Ganhos vs. Perdidos" />
            <StatCard title="Automações Ativas" value={mainMetrics.activeAutomations} icon={<AUTOMATION_ICON />} />
        </div>
    ),
    sales: <SalesMetrics />,
    growth: <ContactGrowth />,
    tasks: <TodaysTasksCard />,
    campaigns: <CampaignAnalytics />,
    automations: <AutomationAnalytics data={dashboardData} isLoading={isLoading} />,
    activity: <RecentActivityFeed data={dashboardData} isLoading={isLoading} />,
  };

  const cardClassNames: { [key: string]: string } = {
      stats: 'lg:col-span-5 cursor-grab active:cursor-grabbing',
      sales: 'lg:col-span-3 cursor-grab active:cursor-grabbing',
      growth: 'lg:col-span-3 cursor-grab active:cursor-grabbing',
      tasks: 'lg:col-span-2 cursor-grab active:cursor-grabbing',
      campaigns: 'lg:col-span-2 cursor-grab active:cursor-grabbing',
      automations: 'lg:col-span-2 cursor-grab active:cursor-grabbing',
      activity: 'lg:col-span-2 cursor-grab active:cursor-grabbing',
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
        setCardOrder((items) => {
            const oldIndex = items.indexOf(active.id as string);
            const newIndex = items.indexOf(over.id as string);
            const newOrder = arrayMove(items, oldIndex, newIndex);
            // Salva a nova ordem no perfil do usuário de forma assíncrona
            if (user) {
              updateProfile({ dashboard_layout: newOrder });
            }
            return newOrder;
        });
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-foreground">Dashboard Geral</h1>
      
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={cardOrder} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 w-full">
                 {cardOrder.map(id => (
                    <SortableCardWrapper key={id} id={id} className={cardClassNames[id]}>
                        <div className="h-full w-full">
                            {cardComponents[id]}
                        </div>
                    </SortableCardWrapper>
                ))}
            </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default Dashboard;
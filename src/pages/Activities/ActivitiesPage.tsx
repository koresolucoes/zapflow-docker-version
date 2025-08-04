import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/common/Card.js';
import { Button } from '../../components/common/Button.js';
import { CONTACTS_ICON, CAMPAIGN_ICON, FUNNEL_ICON, ARROW_LEFT_ICON } from '../../components/icons/index.js';
import { useAuthStore } from '../../stores/authStore.js';
import { fetchAllActivities, type Activity } from '../../services/activityService.js';

const ActivitiesPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeTeam } = useAuthStore();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activityType, setActivityType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadActivities = async (reset = false) => {
    if (!activeTeam) return;
    
    try {
      const currentPage = reset ? 1 : page;
      const data = await fetchAllActivities(activeTeam.id, {
        page: currentPage,
        type: activityType === 'all' ? undefined : activityType as any,
        search: searchQuery || undefined,
      });
      
      setActivities(prev => reset ? data.activities : [...prev, ...data.activities]);
      setHasMore(data.hasMore);
      if (!reset) setPage(p => p + 1);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActivities(true);
  }, [activityType, searchQuery]);

  const ActivityIcon: React.FC<{ type: Activity['type'] }> = ({ type }) => {
    const iconConfig = {
      NEW_CONTACT: {
        icon: <CONTACTS_ICON className="w-4 h-4" />,
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        textColor: 'text-blue-600 dark:text-blue-400'
      },
      CAMPAIGN_SENT: {
        icon: <CAMPAIGN_ICON className="w-4 h-4" />,
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        textColor: 'text-purple-600 dark:text-purple-400'
      },
      DEAL_WON: {
        icon: <FUNNEL_ICON className="w-4 h-4" />,
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        textColor: 'text-green-600 dark:text-green-400'
      },
      DEAL_LOST: {
        icon: <FUNNEL_ICON className="w-4 h-4" />,
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        textColor: 'text-red-600 dark:text-red-400'
      },
    };
    
    const config = iconConfig[type] || iconConfig.NEW_CONTACT;
    
    return (
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.bgColor} ${config.textColor}`}>
        {config.icon}
      </div>
    );
  };

  const formatDateTime = (dateString: string) => {
    try {
      // Check if the dateString is valid
      if (!dateString) return 'Data inválida';
      
      // Convert to Date object
      const date = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date string:', dateString);
        return 'Data inválida';
      }
      
      // Format the date in Brazilian Portuguese format
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Data inválida';
    }
  };

  const getActivityTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      all: 'Todas as Atividades',
      NEW_CONTACT: 'Novos Contatos',
      CAMPAIGN_SENT: 'Campanhas Enviadas',
      DEAL_WON: 'Negócios Ganhos',
      DEAL_LOST: 'Negócios Perdidos',
    };
    return types[type] || type;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2"
          onClick={() => navigate(-1)}
        >
          <ARROW_LEFT_ICON className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Atividades Recentes</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card className="p-4 bg-card">
            <h2 className="font-semibold mb-4 text-foreground">Filtros</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Tipo de Atividade
                </label>
                <select
                  className="w-full p-2 border rounded-md text-sm bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                >
                  <option value="all" className="bg-background text-foreground">Todas</option>
                  <option value="NEW_CONTACT" className="bg-background text-foreground">Novos Contatos</option>
                  <option value="CAMPAIGN_SENT" className="bg-background text-foreground">Campanhas</option>
                  <option value="DEAL_WON" className="bg-background text-foreground">Negócios Ganhos</option>
                  <option value="DEAL_LOST" className="bg-background text-foreground">Negócios Perdidos</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Buscar
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md text-sm bg-background text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Buscar atividades..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                {getActivityTypeLabel(activityType)}
              </h2>
              <p className="text-sm text-muted-foreground">
                {activities.length} atividades encontradas
              </p>
            </div>

            <div className="divide-y divide-border max-h-[calc(100vh-250px)] overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground">Carregando atividades...</p>
                </div>
              ) : activities.length > 0 ? (
                activities.map((activity) => (
                  <div key={activity.id} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <ActivityIcon type={activity.type} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {activity.value}
                        </p>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(activity.created_at)}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                            {getActivityTypeLabel(activity.type)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground">Nenhuma atividade encontrada.</p>
                </div>
              )}
            </div>

            {!isLoading && hasMore && (
              <div className="p-4 border-t border-border text-center">
                <Button
                  variant="outline"
                  onClick={() => loadActivities()}
                  disabled={isLoading}
                >
                  Carregar mais
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ActivitiesPage;

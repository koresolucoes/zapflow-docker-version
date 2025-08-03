import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/common/Card.js';
import { Skeleton } from '../../../components/common/Skeleton.js';
import { Button } from '../../../components/common/Button.js';
import { Progress } from '../../../components/common/Progress.js';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { goalsService, Goal, GoalProgress } from '../../../services/goalsService.js';
import { PlusCircle, Target, AlertTriangle, CheckCircle } from 'lucide-react';

interface GoalsMetricsProps {
  startDate?: string;
  endDate?: string;
}

export function GoalsMetrics({ startDate, endDate }: GoalsMetricsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [progress, setProgress] = useState<Record<string, GoalProgress>>({});
  const [isMockData, setIsMockData] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Tenta buscar metas reais primeiro
        const goalsData = await goalsService.fetchGoals({ status: 'active' });
        
        // Verifica se estamos usando dados mock (quando a API falha)
        const usingMock = goalsData.some(goal => 
          goal.id.startsWith('goal-') || 
          !goal.metric_type || 
          !goal.user_id
        );
        
        setIsMockData(usingMock);
        
        // Garante que os tipos de métrica sejam válidos
        const validatedGoals = goalsData.map(goal => ({
          ...goal,
          metric_type: isValidMetricType(goal.metric_type) 
            ? goal.metric_type 
            : 'messages_responded', // Valor padrão se o tipo for inválido
        }));
        
        setGoals(validatedGoals);

        // Busca progresso para cada meta
        const progressData: Record<string, GoalProgress> = {};
        for (const goal of validatedGoals) {
          try {
            const goalProgress = await goalsService.fetchGoalProgress(goal.id);
            progressData[goal.id] = goalProgress;
          } catch (err) {
            console.error(`Erro ao buscar progresso da meta ${goal.id}:`, err);
            // Se uma meta falhar, continua com as outras
          }
        }
        
        setProgress(progressData);
        setError(null);
      } catch (err) {
        console.error('Erro ao buscar metas:', err);
        setError('Não foi possível carregar as metas. Dados de exemplo serão exibidos.');
        setIsMockData(true);
        // Usa dados mock em caso de erro
        setGoals(MOCK_GOALS);
        setProgress(MOCK_PROGRESS);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  // Função auxiliar para validar o tipo de métrica
  const isValidMetricType = (type: string): type is Goal['metric_type'] => {
    return [
      'messages_sent', 
      'messages_responded', 
      'campaigns_created', 
      'deals_closed', 
      'revenue'
    ].includes(type);
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'on_track':
        return 'bg-green-500';
      case 'at_risk':
        return 'bg-yellow-500';
      case 'off_track':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on_track':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'at_risk':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'off_track':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Target className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 border rounded-lg">
        <AlertTriangle className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg">
        <Target className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <h3 className="text-lg font-medium mb-1">Nenhuma meta encontrada</h3>
        <p className="text-muted-foreground text-sm mb-4">
          Crie uma meta para começar a acompanhar o desempenho.
        </p>
        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          Nova Meta
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isMockData && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4 text-yellow-800 dark:text-yellow-200 text-sm">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>Você está visualizando dados de exemplo. A API de metas não está disponível no momento.</span>
          </div>
        </div>
      )}
      
      {goals.map((goal) => {
        const goalProgress = progress[goal.id];
        const progressValue = goalProgress?.progress_percentage || 0;
        const status = goalProgress?.status || 'on_track';
        
        return (
          <Card key={goal.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{goal.name}</h3>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(status)}
                  <span className="text-xs text-muted-foreground capitalize">
                    {status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{goal.description}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso</span>
                  <span className="font-medium">{Math.round(progressValue)}%</span>
                </div>
                <Progress value={progressValue} className="h-2" />
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <div>
                  <p className="text-muted-foreground">Meta</p>
                  <p className="font-medium">
                    {goalProgress?.current_value?.toLocaleString() || '0'} de{' '}
                    {goal.target_value?.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">Prazo</p>
                  <p className="font-medium">
                    {goal.end_date ? formatDate(goal.end_date) : 'Sem prazo'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Dados mock para o componente
const MOCK_GOALS: Goal[] = [
  {
    id: 'goal-001',
    name: 'Taxa de Resposta',
    description: 'Manter taxa de resposta acima de 80%',
    target_value: 80,
    current_value: 72,
    metric_type: 'messages_responded', 
    status: 'active',
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: 'user-001',
    team_id: 'team-001',
  },
  {
    id: 'goal-002',
    name: 'Tempo Médio de Resposta',
    description: 'Reduzir tempo médio de resposta para menos de 5 minutos',
    target_value: 5,
    current_value: 7.5,
    metric_type: 'messages_responded', 
    status: 'active',
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: 'user-001',
    team_id: 'team-001',
  },
];

const MOCK_PROGRESS: Record<string, GoalProgress> = {
  'goal-001': {
    goal_id: 'goal-001',
    goal_name: 'Taxa de Resposta',
    target_value: 80,
    current_value: 72,
    progress_percentage: 90,
    days_remaining: 15,
    status: 'on_track',
    metric_type: 'messages_responded',
  },
  'goal-002': {
    goal_id: 'goal-002',
    goal_name: 'Tempo Médio de Resposta',
    target_value: 5,
    current_value: 7.5,
    progress_percentage: 60,
    days_remaining: 8,
    status: 'at_risk',
    metric_type: 'messages_responded',
  },
};

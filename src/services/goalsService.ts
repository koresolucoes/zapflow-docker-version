import { supabase } from '../lib/supabaseClient.js';

export interface Goal {
  id: string;
  name: string;
  description?: string;
  target_value: number;
  current_value: number;
  start_date: string;
  end_date: string;
  metric_type: 'messages_sent' | 'messages_responded' | 'campaigns_created' | 'deals_closed' | 'revenue';
  status: 'active' | 'completed' | 'failed' | 'draft';
  created_at: string;
  updated_at: string;
  user_id: string;
  team_id?: string;
}

export interface GoalProgress {
  goal_id: string;
  goal_name: string;
  target_value: number;
  current_value: number;
  progress_percentage: number;
  days_remaining: number;
  status: 'on_track' | 'at_risk' | 'behind' | 'completed';
  metric_type: string;
}

// Dados mock para quando a API não estiver disponível
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
  },
];

const MOCK_PROGRESS: Record<string, GoalProgress> = {
  'goal-001': {
    goal_id: 'goal-001',
    goal_name: 'Taxa de Resposta',
    target_value: 80,
    current_value: 72,
    progress_percentage: 90,
    days_remaining: 30,
    status: 'on_track',
    metric_type: 'messages_responded',
  },
  'goal-002': {
    goal_id: 'goal-002',
    goal_name: 'Tempo Médio de Resposta',
    target_value: 5,
    current_value: 7.5,
    progress_percentage: 60,
    days_remaining: 30,
    status: 'at_risk',
    metric_type: 'messages_responded',
  },
};

// Função auxiliar para simular atraso de rede
const simulateNetworkDelay = () => new Promise(resolve => setTimeout(resolve, 500));

/**
 * Fetches all goals for the current user/team
 */
export async function fetchGoals(params?: {
  status?: 'active' | 'completed' | 'failed' | 'draft';
}): Promise<Goal[]> {
  try {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('status', params?.status || 'active');

    if (error) {
      console.warn('Falha na API de metas, usando dados de exemplo:', error);
      return MOCK_GOALS;
    }

    return data || [];
  } catch (error) {
    console.warn('Erro ao buscar metas, usando dados de exemplo:', error);
    return MOCK_GOALS;
  }
}

/**
 * Fetches goal progress data
 */
export async function fetchGoalProgress(goalId: string): Promise<GoalProgress> {
  try {
    const { data, error } = await supabase
      .rpc('get_goal_progress', { goal_id: goalId });

    if (error || !data) {
      console.warn('Falha ao buscar progresso da meta, usando dados de exemplo:', error);
      return MOCK_PROGRESS[goalId] || {
        goal_id: goalId,
        goal_name: '',
        target_value: 100,
        current_value: 0,
        progress_percentage: 0,
        days_remaining: 0,
        status: 'on_track',
        metric_type: 'messages_responded',
      };
    }

    return data;
  } catch (error) {
    console.warn('Erro ao buscar progresso da meta, usando dados de exemplo:', error);
    return MOCK_PROGRESS[goalId] || {
      goal_id: goalId,
      goal_name: '',
      target_value: 100,
      current_value: 0,
      progress_percentage: 0,
      days_remaining: 0,
      status: 'on_track',
      metric_type: 'messages_responded',
    };
  }
}

/**
 * Creates a new goal
 */
export async function createGoal(goal: Omit<Goal, 'id' | 'created_at' | 'updated_at' | 'status' | 'current_value'>): Promise<Goal> {
  const { data, error } = await supabase
    .from('goals')
    .insert([{
      ...goal,
      status: 'active',
      current_value: 0
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating goal:', error);
    throw error;
  }

  return data;
}

/**
 * Updates an existing goal
 */
export async function updateGoal(
  goalId: string, 
  updates: Partial<Omit<Goal, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'team_id'>>
): Promise<Goal> {
  const { data, error } = await supabase
    .from('goals')
    .update(updates)
    .eq('id', goalId)
    .select()
    .single();

  if (error) {
    console.error('Error updating goal:', error);
    throw error;
  }

  return data;
}

/**
 * Deletes a goal
 */
export async function deleteGoal(goalId: string): Promise<void> {
  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', goalId);

  if (error) {
    console.error('Error deleting goal:', error);
    throw error;
  }
}

// Export all functions as a service object
export const goalsService = {
  fetchGoals,
  fetchGoalProgress,
  createGoal,
  updateGoal,
  deleteGoal,
};

export default goalsService;

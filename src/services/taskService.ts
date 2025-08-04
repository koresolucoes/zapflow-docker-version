import { supabase } from '../lib/supabaseClient.js';

export interface TaskContact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

export interface Task {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  due_date: string;
  created_at: string;
  updated_at: string;
  contact?: TaskContact;
  contact_id?: string;
  team_id: string;
  created_by: string;
  assigned_to?: string;
  notes?: string;
  type: 'TAREFA';
  is_completed: boolean;
}

export interface TasksResponse {
  tasks: Task[];
  hasMore: boolean;
  total: number;
}

export interface TaskFilters {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  search?: string;
  date?: string;
  assignedTo?: string;
  contactId?: string;
  startDate?: string;
  endDate?: string;
}

export const fetchAllTasks = async (
  teamId: string,
  filters: TaskFilters = {}
): Promise<TasksResponse> => {
  try {
    let query = supabase
      .from('contact_activities')
      .select('*', { count: 'exact' })
      .eq('team_id', teamId)
      .eq('type', 'TAREFA')
      .order('due_date', { ascending: true });

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }
    
    if (filters.search) {
      query = query.ilike('content', `%${filters.search}%`);
    }
    
    if (filters.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo);
    }
    
    if (filters.contactId) {
      query = query.eq('contact_id', filters.contactId);
    }
    
    if (filters.startDate) {
      query = query.gte('due_date', filters.startDate);
    }
    
    if (filters.endDate) {
      query = query.lte('due_date', filters.endDate);
    }
    
    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
    
    return {
      tasks: data as Task[],
      hasMore: (to + 1) < (count || 0),
      total: count || 0
    };
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    return {
      tasks: [],
      hasMore: false,
      total: 0
    };
  }
};

export const fetchTaskById = async (taskId: string): Promise<Task> => {
  try {
    const { data, error } = await supabase
      .from('contact_activities')
      .select('*')
      .eq('id', taskId)
      .eq('type', 'TAREFA')
      .single();
      
    if (error) throw error;
    return data as Task;
  } catch (error) {
    console.error(`Failed to fetch task ${taskId}:`, error);
    throw error;
  }
};

export const createTask = async (
  teamId: string,
  taskData: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'status' | 'type'>
): Promise<Task> => {
  try {
    const taskWithType = {
      ...taskData,
      type: 'TAREFA' as const,
      team_id: teamId,
      is_completed: false,
      status: 'pending' as const
    };
    
    const { data, error } = await supabase
      .from('contact_activities')
      .insert([taskWithType])
      .select()
      .single();
      
    if (error) throw error;
    return data as Task;
  } catch (error) {
    console.error('Failed to create task:', error);
    throw error;
  }
};

export const updateTask = async (
  taskId: string,
  updates: Partial<Task>
): Promise<Task> => {
  try {
    // Don't allow changing the type to something else
    const { type, ...safeUpdates } = updates;
    
    const { data, error } = await supabase
      .from('contact_activities')
      .update(safeUpdates)
      .eq('id', taskId)
      .eq('type', 'TAREFA')
      .select()
      .single();
      
    if (error) throw error;
    return data as Task;
  } catch (error) {
    console.error(`Failed to update task ${taskId}:`, error);
    throw error;
  }
};

export const updateTaskStatus = async (
  taskId: string,
  isCompleted: boolean
): Promise<Task> => {
  try {
    const { data, error } = await supabase
      .from('contact_activities')
      .update({ 
        is_completed: isCompleted
      })
      .eq('id', taskId)
      .eq('type', 'TAREFA')
      .select()
      .single();
      
    if (error) {
      console.error('Supabase error details:', error);
      throw error;
    }
    
    return data as Task;
  } catch (error) {
    console.error(`Failed to update task ${taskId} status:`, error);
    throw error;
  }
};

export const deleteTask = async (taskId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('contact_activities')
      .delete()
      .eq('id', taskId)
      .eq('type', 'TAREFA');
      
    if (error) throw error;
  } catch (error) {
    console.error(`Failed to delete task ${taskId}:`, error);
    throw error;
  }
};

export const fetchTodaysTasks = async (teamId: string): Promise<Task[]> => {
  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const { data, error } = await supabase
      .from('contact_activities')
      .select('*')
      .eq('team_id', teamId)
      .eq('type', 'TAREFA')
      .eq('is_completed', false)
      .lte('due_date', today.toISOString())
      .order('due_date', { ascending: true });
      
    if (error) throw error;
    return data as Task[];
  } catch (error) {
    console.error('Failed to fetch today\'s tasks:', error);
    return [];
  }
};

export const fetchUpcomingTasks = async (teamId: string): Promise<Task[]> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    nextWeek.setHours(23, 59, 59, 999);
    
    const { data, error } = await supabase
      .from('contact_activities')
      .select('*')
      .eq('team_id', teamId)
      .eq('type', 'TAREFA')
      .eq('is_completed', false)
      .gte('due_date', today.toISOString())
      .lte('due_date', nextWeek.toISOString())
      .order('due_date', { ascending: true });
      
    if (error) throw error;
    return data as Task[];
  } catch (error) {
    console.error('Failed to fetch upcoming tasks:', error);
    return [];
  }
};

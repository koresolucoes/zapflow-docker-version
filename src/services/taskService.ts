import { apiGet, apiPost, apiPut, apiDelete } from '../lib/apiClient.js';

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
    // Build query parameters
    const params: Record<string, string> = {
      team_id: teamId,
      type: 'TAREFA',
      ...(filters.status && { status: filters.status }),
      ...(filters.priority && { priority: filters.priority }),
      ...(filters.search && { search: filters.search }),
      ...(filters.assignedTo && { assigned_to: filters.assignedTo }),
      ...(filters.contactId && { contact_id: filters.contactId }),
      ...(filters.startDate && { start_date: filters.startDate }),
      ...(filters.endDate && { end_date: filters.endDate }),
      page: String(filters.page || 1),
      limit: String(filters.limit || 20)
    };

    // Convert params to URLSearchParams
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value);
      }
    });

    // Make API request
    const response = await apiGet<{
      data: Task[];
      total: number;
      hasMore: boolean;
    }>(`/tasks?${queryParams.toString()}`);
    
    return {
      tasks: response.data || [],
      hasMore: response.hasMore,
      total: response.total
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
    const task = await apiGet<Task>(`/tasks/${taskId}`);
    return task;
  } catch (error) {
    console.error(`Failed to fetch task ${taskId}:`, error);
    throw new Error('Failed to fetch task');
  }
};

export const createTask = async (
  teamId: string,
  taskData: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'status' | 'type' | 'is_completed'>
): Promise<Task> => {
  try {
    const taskWithType = {
      ...taskData,
      type: 'TAREFA' as const,
      team_id: teamId,
      is_completed: false,
      status: 'pending' as const
    };
    
    const newTask = await apiPost<Task>('/tasks', taskWithType);
    return newTask;
  } catch (error) {
    console.error('Failed to create task:', error);
    throw new Error('Failed to create task');
  }
};

export const updateTask = async (
  taskId: string,
  updates: Partial<Task>
): Promise<Task> => {
  try {
    // Don't allow changing the type to something else
    const { type, ...safeUpdates } = updates;
    
    const updatedTask = await apiPut<Task>(`/tasks/${taskId}`, safeUpdates);
    return updatedTask;
  } catch (error) {
    console.error(`Failed to update task ${taskId}:`, error);
    throw new Error('Failed to update task');
  }
};

export const updateTaskStatus = async (
  taskId: string,
  isCompleted: boolean
): Promise<Task> => {
  try {
    const updatedTask = await apiPut<Task>(`/tasks/${taskId}/status`, {
      is_completed: isCompleted,
      status: isCompleted ? 'completed' : 'pending',
      completed_at: isCompleted ? new Date().toISOString() : null
    });
    
    return updatedTask;
  } catch (error) {
    console.error(`Failed to update task status for ${taskId}:`, error);
    throw new Error('Failed to update task status');
  }
};

export const deleteTask = async (taskId: string): Promise<void> => {
  try {
    await apiDelete(`/tasks/${taskId}`);
  } catch (error) {
    console.error(`Failed to delete task ${taskId}:`, error);
    throw new Error('Failed to delete task');
  }
};

export const fetchTodaysTasks = async (teamId: string): Promise<Task[]> => {
  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const response = await apiGet<Task[]>(
      `/tasks?team_id=${teamId}&due_date_lte=${today.toISOString()}&is_completed=false&type=TAREFA&sort=due_date:asc`
    );
    
    return response || [];
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
    
    const response = await apiGet<Task[]>(
      `/tasks?team_id=${teamId}&due_date_gte=${today.toISOString()}&due_date_lte=${nextWeek.toISOString()}&is_completed=false&type=TAREFA&sort=due_date:asc`
    );
    
    return response || [];
  } catch (error) {
    console.error('Failed to fetch upcoming tasks:', error);
    return [];
  }
};

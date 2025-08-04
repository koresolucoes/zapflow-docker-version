import { supabase } from '../lib/supabaseClient.js';
import { ContactActivity, ContactActivityInsert, ContactActivityUpdate, TaskWithContact } from '../types/index.js';
import { get, post, put, del } from './api.js';

export interface Activity {
  id: string;
  type: 'NEW_CONTACT' | 'CAMPAIGN_SENT' | 'DEAL_WON' | 'DEAL_LOST';
  value: string;
  created_at: string;
  contact_id?: string;
  deal_id?: string;
  campaign_id?: string;
  team_id?: string;
  user_id?: string;
}

export interface ActivitiesResponse {
  activities: Activity[];
  hasMore: boolean;
  total: number;
}

export interface ActivityFilters {
  page?: number;
  limit?: number;
  type?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export const fetchActivitiesForContact = async (teamId: string, contactId: string): Promise<ContactActivity[]> => {
    const { data, error } = await supabase
        .from('contact_activities')
        .select('*')
        .eq('team_id', teamId)
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as ContactActivity[]) || [];
};

export const addActivity = async (activityData: ContactActivityInsert): Promise<ContactActivity> => {
    const { data, error } = await supabase
        .from('contact_activities')
        .insert(activityData as any)
        .select()
        .single();
    if (error) throw error;
    if (!data) throw new Error("Failed to create activity or retrieve the created record.");
    return data as ContactActivity;
};

export const updateActivity = async (activityId: string, teamId: string, updates: ContactActivityUpdate): Promise<ContactActivity> => {
    const { data, error } = await supabase
        .from('contact_activities')
        .update(updates as any)
        .eq('id', activityId)
        .eq('team_id', teamId)
        .select()
        .single();
    if (error) throw error;
    if (!data) throw new Error("Activity not found or update failed to return a record.");
    return data as ContactActivity;
};

export const deleteActivity = async (activityId: string, teamId: string): Promise<void> => {
    const { error } = await supabase
        .from('contact_activities')
        .delete()
        .eq('id', activityId)
        .eq('team_id', teamId);
    if (error) throw error;
};

export const fetchTodaysTasks = async (teamId: string): Promise<TaskWithContact[]> => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of today for lte comparison

    const { data, error } = await supabase
        .from('contact_activities')
        .select('*, contacts(id, name)')
        .eq('team_id', teamId)
        .eq('type', 'TAREFA')
        .eq('is_completed', false)
        .lte('due_date', today.toISOString())
        .order('due_date', { ascending: true });
        
    if (error) {
        console.error("Error fetching today's tasks:", error);
        throw error;
    }
    
    return (data as any as TaskWithContact[]) || [];
};

export const fetchAllActivities = async (
  teamId: string,
  filters: ActivityFilters = {}
): Promise<ActivitiesResponse> => {
  try {
    let query = supabase
      .from('contact_activities')
      .select('*', { count: 'exact' })
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    
    if (filters.search) {
      query = query.ilike('content', `%${filters.search}%`);
    }
    
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }
    
    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching activities:', error);
      throw error;
    }
    
    return {
      activities: data as Activity[],
      hasMore: (to + 1) < (count || 0),
      total: count || 0
    };
  } catch (error) {
    console.error('Failed to fetch activities:', error);
    return {
      activities: [],
      hasMore: false,
      total: 0
    };
  }
};

export const fetchActivityById = async (activityId: string): Promise<Activity> => {
  try {
    const response = await get(`/activities/${activityId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch activity ${activityId}:`, error);
    throw error;
  }
};

export const createActivity = async (
  teamId: string,
  activityData: Omit<Activity, 'id' | 'created_at'>
): Promise<Activity> => {
  try {
    const { data, error } = await supabase
      .from('contact_activities')
      .insert({
        ...activityData,
        team_id: teamId,
      })
      .select()
      .single();
      
    if (error) throw error;
    return data as Activity;
  } catch (error) {
    console.error('Failed to create activity:', error);
    throw error;
  }
};

export const updateActivityAPI = async (
  activityId: string,
  updates: Partial<Activity>
): Promise<Activity> => {
  try {
    const response = await put(`/activities/${activityId}`, updates);
    return response.data;
  } catch (error) {
    console.error(`Failed to update activity ${activityId}:`, error);
    throw error;
  }
};

export const deleteActivityAPI = async (activityId: string): Promise<void> => {
  try {
    await del(`/activities/${activityId}`);
  } catch (error) {
    console.error(`Failed to delete activity ${activityId}:`, error);
    throw error;
  }
};
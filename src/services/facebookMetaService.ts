import { supabase } from '../lib/supabaseClient.js';

export interface WhatsAppAnalytics {
  // Message metrics
  total_messages: number;
  delivered_messages: number;
  read_messages: number;
  failed_messages: number;
  
  // User metrics
  active_users: number;
  new_users: number;
  
  // Timing metrics
  average_response_time: number; // in seconds
  
  // Template metrics
  template_messages_sent: number;
  template_messages_delivered: number;
  template_messages_read: number;
  
  // Error metrics
  error_rate: number;
  
  // Timestamp of when the data was last updated
  last_updated: string;
}

export const fetchWhatsAppAnalytics = async (teamId: string, startDate?: Date, endDate?: Date): Promise<WhatsAppAnalytics> => {
  try {
    // Get the Facebook Meta API credentials from the user's profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('meta_access_token, meta_waba_id, meta_phone_number_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (profileError || !profileData) {
      throw new Error('User profile not found');
    }

    const { meta_access_token, meta_phone_number_id } = profileData;
    
    if (!meta_access_token || !meta_phone_number_id) {
      throw new Error('Facebook Meta WhatsApp configuration not found in profile');
    }

    // Format dates for the API request
    const formattedStartDate = startDate ? startDate.toISOString() : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const formattedEndDate = endDate ? endDate.toISOString() : new Date().toISOString();

    // This is a placeholder for the actual API call to Facebook Meta
    // In a real implementation, you would make an HTTP request to the Meta Graph API
    // Example:
    // const response = await fetch(
    //   `https://graph.facebook.com/v18.0/${phoneNumberId}/insights?access_token=${accessToken}&metric=outgoing_messages,delivered_messages,read_messages&since=${formattedStartDate}&until=${formattedEndDate}`
    // );
    // const data = await response.json();

    // For now, return mock data
    return {
      total_messages: 1245,
      delivered_messages: 1200,
      read_messages: 950,
      failed_messages: 45,
      active_users: 780,
      new_users: 45,
      average_response_time: 125,
      template_messages_sent: 320,
      template_messages_delivered: 310,
      template_messages_read: 280,
      error_rate: 0.03,
      last_updated: new Date().toISOString(),
    };

  } catch (error) {
    console.error('Error fetching WhatsApp analytics:', error);
    throw error;
  }
};

export const facebookMetaService = {
  fetchWhatsAppAnalytics,
};

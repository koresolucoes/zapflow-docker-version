-- Create RPC functions for WhatsApp metrics

-- Function to get metrics grouped by status
CREATE OR REPLACE FUNCTION get_metrics_by_status(
  p_profile_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  status TEXT,
  direction TEXT,
  message_type TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mm.status::TEXT,
    mm.direction::TEXT,
    mm.message_type::TEXT,
    COUNT(*)::BIGINT
  FROM message_metrics mm
  WHERE mm.profile_id = p_profile_id
    AND mm.timestamp >= p_start_date
    AND mm.timestamp <= p_end_date
  GROUP BY mm.status, mm.direction, mm.message_type
  ORDER BY mm.status, mm.direction, mm.message_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get WhatsApp Business API analytics
CREATE OR REPLACE FUNCTION get_waba_analytics(
  p_team_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  total_messages BIGINT,
  delivered_messages BIGINT,
  read_messages BIGINT,
  failed_messages BIGINT,
  active_users BIGINT,
  new_users BIGINT,
  average_response_time NUMERIC,
  template_messages_sent BIGINT,
  template_messages_delivered BIGINT,
  template_messages_read BIGINT,
  error_rate NUMERIC,
  last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_messages,
    COUNT(CASE WHEN status = 'delivered' OR status = 'read' THEN 1 END)::BIGINT as delivered_messages,
    COUNT(CASE WHEN status = 'read' THEN 1 END)::BIGINT as read_messages,
    COUNT(CASE WHEN status = 'failed' THEN 1 END)::BIGINT as failed_messages,
    COUNT(DISTINCT contact_id)::BIGINT as active_users,
    COUNT(DISTINCT CASE WHEN timestamp >= p_start_date THEN contact_id END)::BIGINT as new_users,
    COALESCE(AVG(response_time), 0)::NUMERIC as average_response_time,
    COUNT(CASE WHEN message_type = 'template' THEN 1 END)::BIGINT as template_messages_sent,
    COUNT(CASE WHEN message_type = 'template' AND (status = 'delivered' OR status = 'read') THEN 1 END)::BIGINT as template_messages_delivered,
    COUNT(CASE WHEN message_type = 'template' AND status = 'read' THEN 1 END)::BIGINT as template_messages_read,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        (COUNT(CASE WHEN status = 'failed' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC)
      ELSE 0 
    END as error_rate,
    MAX(timestamp) as last_updated
  FROM message_metrics mm
  JOIN waba_configs wc ON wc.team_id = p_team_id
  WHERE mm.profile_id = wc.id
    AND mm.timestamp >= p_start_date
    AND mm.timestamp <= p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get conversation analytics
CREATE OR REPLACE FUNCTION get_conversation_analytics(
  p_team_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  conversation_category TEXT,
  conversation_type TEXT,
  direction TEXT,
  count BIGINT,
  total_cost NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'SERVICE'::TEXT as conversation_category,
    'REGULAR'::TEXT as conversation_type,
    mm.direction::TEXT,
    COUNT(*)::BIGINT as count,
    0::NUMERIC as total_cost -- Cost tracking would need to be implemented separately
  FROM message_metrics mm
  JOIN waba_configs wc ON wc.team_id = p_team_id
  WHERE mm.profile_id = wc.id
    AND mm.timestamp >= p_start_date
    AND mm.timestamp <= p_end_date
  GROUP BY mm.direction
  ORDER BY mm.direction;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get template analytics
CREATE OR REPLACE FUNCTION get_template_analytics(
  p_team_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  template_name TEXT,
  sent_count BIGINT,
  delivered_count BIGINT,
  read_count BIGINT,
  clicked_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(mm.template_name, 'Unknown')::TEXT as template_name,
    COUNT(*)::BIGINT as sent_count,
    COUNT(CASE WHEN status = 'delivered' OR status = 'read' THEN 1 END)::BIGINT as delivered_count,
    COUNT(CASE WHEN status = 'read' THEN 1 END)::BIGINT as read_count,
    0::BIGINT as clicked_count -- Click tracking would need to be implemented separately
  FROM message_metrics mm
  JOIN waba_configs wc ON wc.team_id = p_team_id
  WHERE mm.profile_id = wc.id
    AND mm.message_type = 'template'
    AND mm.timestamp >= p_start_date
    AND mm.timestamp <= p_end_date
  GROUP BY mm.template_name
  ORDER BY sent_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get flow metrics (for WhatsApp Flows)
CREATE OR REPLACE FUNCTION get_flow_metrics(
  p_team_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  flow_id TEXT,
  request_count BIGINT,
  error_count BIGINT,
  error_rate NUMERIC,
  average_latency NUMERIC,
  availability_percentage NUMERIC
) AS $$
BEGIN
  -- This is a placeholder function for Flow metrics
  -- In a real implementation, you would track Flow-specific metrics
  RETURN QUERY
  SELECT 
    'default_flow'::TEXT as flow_id,
    0::BIGINT as request_count,
    0::BIGINT as error_count,
    0::NUMERIC as error_rate,
    0::NUMERIC as average_latency,
    100::NUMERIC as availability_percentage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_metrics_by_status(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_waba_analytics(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversation_analytics(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_template_analytics(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_flow_metrics(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated; 


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";






CREATE TYPE "public"."automation_action_type_enum" AS ENUM (
    'send_template',
    'add_tag'
);


ALTER TYPE "public"."automation_action_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."automation_run_status_enum" AS ENUM (
    'success',
    'failed'
);


ALTER TYPE "public"."automation_run_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."automation_status" AS ENUM (
    'active',
    'paused'
);


ALTER TYPE "public"."automation_status" OWNER TO "postgres";


CREATE TYPE "public"."automation_status_enum" AS ENUM (
    'active',
    'paused'
);


ALTER TYPE "public"."automation_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."automation_trigger_type_enum" AS ENUM (
    'new_contact_with_tag',
    'message_received_with_keyword'
);


ALTER TYPE "public"."automation_trigger_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."campaign_status" AS ENUM (
    'Sent',
    'Draft',
    'Failed',
    'Scheduled',
    'Sending'
);


ALTER TYPE "public"."campaign_status" OWNER TO "postgres";


CREATE TYPE "public"."campaign_status_enum" AS ENUM (
    'Sent',
    'Draft',
    'Failed'
);


ALTER TYPE "public"."campaign_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."comment_status" AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE "public"."comment_status" OWNER TO "postgres";


CREATE TYPE "public"."custom_field_type" AS ENUM (
    'TEXTO',
    'NUMERO',
    'DATA',
    'LISTA'
);


ALTER TYPE "public"."custom_field_type" OWNER TO "postgres";


CREATE TYPE "public"."message_direction" AS ENUM (
    'inbound',
    'outbound'
);


ALTER TYPE "public"."message_direction" OWNER TO "postgres";


CREATE TYPE "public"."message_source" AS ENUM (
    'campaign',
    'automation',
    'direct',
    'inbound_reply'
);


ALTER TYPE "public"."message_source" OWNER TO "postgres";


CREATE TYPE "public"."message_status" AS ENUM (
    'sent',
    'delivered',
    'read',
    'failed',
    'pending'
);


ALTER TYPE "public"."message_status" OWNER TO "postgres";


CREATE TYPE "public"."message_status_enum" AS ENUM (
    'sent',
    'delivered',
    'read',
    'failed'
);


ALTER TYPE "public"."message_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."message_type" AS ENUM (
    'inbound',
    'outbound'
);


ALTER TYPE "public"."message_type" OWNER TO "postgres";


CREATE TYPE "public"."post_status" AS ENUM (
    'draft',
    'published',
    'archived'
);


ALTER TYPE "public"."post_status" OWNER TO "postgres";


CREATE TYPE "public"."template_category" AS ENUM (
    'MARKETING',
    'UTILITY',
    'AUTHENTICATION'
);


ALTER TYPE "public"."template_category" OWNER TO "postgres";


CREATE TYPE "public"."template_category_enum" AS ENUM (
    'MARKETING',
    'UTILITY',
    'AUTHENTICATION'
);


ALTER TYPE "public"."template_category_enum" OWNER TO "postgres";


CREATE TYPE "public"."template_status" AS ENUM (
    'APPROVED',
    'PENDING',
    'REJECTED',
    'PAUSED',
    'LOCAL'
);


ALTER TYPE "public"."template_status" OWNER TO "postgres";


CREATE TYPE "public"."template_status_enum" AS ENUM (
    'APPROVED',
    'PENDING',
    'REJECTED',
    'PAUSED',
    'LOCAL'
);


ALTER TYPE "public"."template_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'admin',
    'author',
    'subscriber'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_slug"("title" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  slug TEXT;
BEGIN
  -- Convert to lowercase and replace spaces with hyphens
  slug := LOWER(TRIM(title));
  -- Replace non-alphanumeric characters (except hyphens) with nothing
  slug := REGEXP_REPLACE(slug, '[^a-z0-9-]', '-', 'g');
  -- Replace multiple hyphens with a single hyphen
  slug := REGEXP_REPLACE(slug, '-+', '-', 'g');
  -- Remove leading/trailing hyphens
  slug := TRIM(BOTH '-' FROM slug);
  
  RETURN slug;
END;
$$;


ALTER FUNCTION "public"."create_slug"("title" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_unique_slug"("title" "text", "table_name" "text", "id_column" "text", "id_value" "uuid" DEFAULT NULL::"uuid") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  base_slug TEXT;
  unique_slug TEXT;
  counter INTEGER := 1;
  query TEXT;
  exists BOOLEAN;
BEGIN
  base_slug := create_slug(title);
  unique_slug := base_slug;
  
  LOOP
    IF id_value IS NULL THEN
      query := format('SELECT EXISTS(SELECT 1 FROM %I WHERE %I = %L)', 
                     table_name, id_column, unique_slug);
    ELSE
      query := format('SELECT EXISTS(SELECT 1 FROM %I WHERE %I = %L AND id != %L::uuid)', 
                     table_name, id_column, unique_slug, id_value);
    END IF;
    
    EXECUTE query INTO exists;
    
    EXIT WHEN NOT exists;
    
    unique_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN unique_slug;
END;
$$;


ALTER FUNCTION "public"."generate_unique_slug"("title" "text", "table_name" "text", "id_column" "text", "id_value" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_average_response_time"("start_date_param" timestamp with time zone DEFAULT NULL::timestamp with time zone, "end_date_param" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  start_date_filter TIMESTAMP WITH TIME ZONE;
  end_date_filter TIMESTAMP WITH TIME ZONE;
  result JSONB;
  avg_response_time_ms NUMERIC;
  message_count INTEGER;
BEGIN
  -- Definir datas padrão se não fornecidas
  start_date_filter := COALESCE(start_date_param, NOW() - INTERVAL '30 days');
  end_date_filter := COALESCE(end_date_param, NOW());
  
  -- Calcular tempo médio de resposta em milissegundos
  WITH response_times AS (
    SELECT 
      EXTRACT(EPOCH FROM (r.created_at - m.created_at)) * 1000 AS response_time_ms
    FROM 
      messages m
    JOIN 
      messages r ON r.thread_id = m.thread_id 
      AND r.direction = 'outbound'
      AND r.created_at > m.created_at
      AND r.created_at - m.created_at <= INTERVAL '24 hours'
    WHERE 
      m.direction = 'inbound'
      AND m.created_at BETWEEN start_date_filter AND end_date_filter
      AND m.user_id = auth.uid()
  )
  SELECT 
    COALESCE(AVG(response_time_ms), 0),
    COUNT(*)
  INTO 
    avg_response_time_ms,
    message_count
  FROM 
    response_times
  WHERE 
    response_time_ms > 0;
  
  -- Retornar o resultado
  result := jsonb_build_object(
    'average_response_time_ms', ROUND(avg_response_time_ms, 2),
    'message_count', message_count
  );
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_average_response_time"("start_date_param" timestamp with time zone, "end_date_param" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_average_response_time"("p_profile_id" "text", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) RETURNS numeric
    LANGUAGE "sql"
    AS $$
  SELECT 
    COALESCE(AVG(response_time), 0) as avg_response_time
  FROM 
    message_metrics
  WHERE 
    profile_id = p_profile_id::uuid
    AND direction = 'outbound'
    AND response_time IS NOT NULL
    AND timestamp >= p_start_date
    AND timestamp <= p_end_date
$$;


ALTER FUNCTION "public"."get_average_response_time"("p_profile_id" "text", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_campaign_metrics"("start_date_param" timestamp with time zone DEFAULT NULL::timestamp with time zone, "end_date_param" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  start_date_filter TIMESTAMP WITH TIME ZONE;
  end_date_filter TIMESTAMP WITH TIME ZONE;
  result JSONB;
BEGIN
  -- Definir datas padrão se não fornecidas
  start_date_filter := COALESCE(start_date_param, NOW() - INTERVAL '30 days');
  end_date_filter := COALESCE(end_date_param, NOW());
  
  -- Buscar métricas de campanhas
  SELECT 
    COALESCE(jsonb_agg(
      jsonb_build_object(
        'campaign_id', c.id,
        'campaign_name', c.name,
        'total_sent', COALESCE(stats.total_sent, 0),
        'delivered', COALESCE(stats.delivered, 0),
        'read', COALESCE(stats.read, 0),
        'responded', COALESCE(stats.responded, 0),
        'failed', COALESCE(stats.failed, 0),
        'delivery_rate', CASE WHEN COALESCE(stats.total_sent, 0) > 0 
          THEN ROUND((COALESCE(stats.delivered, 0)::NUMERIC / stats.total_sent) * 100, 2)
          ELSE 0 
        END,
        'read_rate', CASE WHEN COALESCE(stats.delivered, 0) > 0 
          THEN ROUND((COALESCE(stats.read, 0)::NUMERIC / stats.delivered) * 100, 2)
          ELSE 0 
        END,
        'response_rate', CASE WHEN COALESCE(stats.delivered, 0) > 0 
          THEN ROUND((COALESCE(stats.responded, 0)::NUMERIC / stats.delivered) * 100, 2)
          ELSE 0 
        END
      )
    ), '[]'::jsonb)
  INTO result
  FROM 
    campaigns c
  LEFT JOIN LATERAL (
    SELECT 
      COUNT(*) as total_sent,
      COUNT(*) FILTER (WHERE m.status = 'delivered') as delivered,
      COUNT(*) FILTER (WHERE m.status = 'read') as read_count,
      COUNT(DISTINCT m.thread_id) FILTER (
        WHERE EXISTS (
          SELECT 1 
          FROM messages r 
          WHERE r.thread_id = m.thread_id 
          AND r.direction = 'outbound'
          AND r.created_at > m.created_at
          AND r.created_at - m.created_at <= INTERVAL '24 hours'
        )
      ) as responded,
      COUNT(*) FILTER (WHERE m.status = 'failed') as failed
    FROM 
      messages m
    WHERE 
      m.campaign_id = c.id
      AND m.created_at BETWEEN start_date_filter AND end_date_filter
      AND m.user_id = auth.uid()
  ) stats ON true
  WHERE 
    c.created_at BETWEEN start_date_filter AND end_date_filter
    AND c.user_id = auth.uid();
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_campaign_metrics"("start_date_param" timestamp with time zone, "end_date_param" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_conversation_analytics"("p_team_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) RETURNS TABLE("conversation_category" "text", "conversation_type" "text", "direction" "text", "count" bigint, "total_cost" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."get_conversation_analytics"("p_team_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_conversations_with_contacts"("p_team_id" "uuid") RETURNS TABLE("contact_details" json, "last_message" json, "unread_count" bigint, "assignee" json)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Verifica se o utilizador atual é membro da equipa solicitada antes de retornar dados.
    IF NOT is_team_member(p_team_id) THEN
        RETURN;
    END IF;

    RETURN QUERY
    WITH last_messages AS (
      SELECT
        m.contact_id,
        m.id,
        m.content,
        m.created_at,
        m.type,
        m.status,
        m.source,
        m.replied_to_message_id,
        ROW_NUMBER() OVER(PARTITION BY m.contact_id ORDER BY m.created_at DESC) as rn
      FROM messages m WHERE m.team_id = p_team_id
    ), unread_counts AS (
      SELECT
        m.contact_id,
        COUNT(*) as unread
      FROM messages m WHERE m.team_id = p_team_id AND m.type = 'inbound' AND m.read_at IS NULL
      GROUP BY m.contact_id
    )
    SELECT
        json_build_object(
            'id', c.id, 'name', c.name, 'phone', c.phone, 'email', c.email,
            'company', c.company, 'tags', c.tags, 'created_at', c.created_at,
            'custom_fields', c.custom_fields, 'team_id', c.team_id
        ) as contact_details,
        json_build_object(
            'id', lm.id, 'content', lm.content, 'created_at', lm.created_at,
            'type', lm.type, 'status', lm.status, 'source', lm.source,
            'replied_to_message_id', lm.replied_to_message_id
        ) as last_message,
        COALESCE(uc.unread, 0) as unread_count,
        (SELECT json_build_object('id', u.id, 'email', u.email) FROM auth.users u WHERE u.id = conv.assignee_id) as assignee
    FROM last_messages lm
    JOIN contacts c ON lm.contact_id = c.id
    LEFT JOIN unread_counts uc ON lm.contact_id = uc.contact_id
    LEFT JOIN conversations conv ON lm.contact_id = conv.contact_id AND conv.team_id = p_team_id
    WHERE lm.rn = 1
    ORDER BY lm.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_conversations_with_contacts"("p_team_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_flow_metrics"("p_team_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) RETURNS TABLE("flow_id" "text", "request_count" bigint, "error_count" bigint, "error_rate" numeric, "average_latency" numeric, "availability_percentage" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."get_flow_metrics"("p_team_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_goal_progress"("goal_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  goal_record RECORD;
  days_remaining INTEGER;
  progress_percentage NUMERIC;
  status TEXT;
  result JSONB;
BEGIN
  -- Buscar os dados da meta
  SELECT * INTO goal_record 
  FROM public.goals 
  WHERE id = goal_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Meta não encontrada';
  END IF;
  
  -- Calcular dias restantes
  days_remaining := GREATEST(0, EXTRACT(DAY FROM (goal_record.end_date - NOW())));
  
  -- Calcular porcentagem de progresso
  IF goal_record.target_value > 0 THEN
    progress_percentage := LEAST(100, (goal_record.current_value / goal_record.target_value) * 100);
  ELSE
    progress_percentage := 0;
  END IF;
  
  -- Determinar o status com base no progresso e tempo restante
  IF progress_percentage >= 100 THEN
    status := 'completed';
  ELSE
    -- Calcular a taxa esperada de progresso baseada no tempo decorrido
    DECLARE
      total_days NUMERIC;
      days_elapsed NUMERIC;
      expected_progress NUMERIC;
    BEGIN
      total_days := EXTRACT(EPOCH FROM (goal_record.end_date - goal_record.start_date)) / 86400;
      days_elapsed := EXTRACT(EPOCH FROM (NOW() - goal_record.start_date)) / 86400;
      
      IF total_days > 0 AND days_elapsed > 0 THEN
        expected_progress := (days_elapsed / total_days) * 100;
        
        IF progress_percentage >= expected_progress * 1.1 THEN
          status := 'on_track';
        ELSIF progress_percentage >= expected_progress * 0.8 THEN
          status := 'at_risk';
        ELSE
          status := 'off_track';
        END IF;
      ELSE
        status := 'on_track';
      END IF;
    END;
  END IF;
  
  -- Retornar o resultado como JSON
  result := jsonb_build_object(
    'goal_id', goal_record.id,
    'goal_name', goal_record.name,
    'target_value', goal_record.target_value,
    'current_value', goal_record.current_value,
    'progress_percentage', ROUND(progress_percentage, 2),
    'days_remaining', days_remaining,
    'status', status,
    'metric_type', goal_record.metric_type
  );
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_goal_progress"("goal_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_metrics_by_status"("p_profile_id" "text", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) RETURNS TABLE("status" "text", "count" bigint)
    LANGUAGE "sql"
    AS $$
  SELECT 
    status::TEXT,
    COUNT(*) as count
  FROM 
    message_metrics
  WHERE 
    profile_id = p_profile_id::uuid  -- Faz o cast para UUID aqui
    AND timestamp >= p_start_date
    AND timestamp <= p_end_date
  GROUP BY 
    status
$$;


ALTER FUNCTION "public"."get_metrics_by_status"("p_profile_id" "text", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_metrics_by_status"("p_profile_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) RETURNS TABLE("status" "text", "direction" "text", "message_type" "text", "count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."get_metrics_by_status"("p_profile_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_metrics_summary"("start_date_param" timestamp with time zone DEFAULT NULL::timestamp with time zone, "end_date_param" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  start_date_filter TIMESTAMP WITH TIME ZONE;
  end_date_filter TIMESTAMP WITH TIME ZONE;
  result JSONB;
BEGIN
  -- Definir datas padrão se não fornecidas
  start_date_filter := COALESCE(start_date_param, NOW() - INTERVAL '30 days');
  end_date_filter := COALESCE(end_date_param, NOW());
  
  -- Buscar métricas resumidas
  SELECT jsonb_build_object(
    'total_messages', COALESCE((
      SELECT COUNT(*) 
      FROM messages 
      WHERE created_at BETWEEN start_date_filter AND end_date_filter
      AND user_id = auth.uid()
    ), 0),
    
    'delivered', COALESCE((
      SELECT COUNT(*) 
      FROM messages 
      WHERE status = 'delivered'
      AND created_at BETWEEN start_date_filter AND end_date_filter
      AND user_id = auth.uid()
    ), 0),
    
    'read', COALESCE((
      SELECT COUNT(*) 
      FROM messages 
      WHERE status = 'read'
      AND created_at BETWEEN start_date_filter AND end_date_filter
      AND user_id = auth.uid()
    ), 0),
    
    'failed', COALESCE((
      SELECT COUNT(*) 
      FROM messages 
      WHERE status = 'failed'
      AND created_at BETWEEN start_date_filter AND end_date_filter
      AND user_id = auth.uid()
    ), 0),
    
    'responded', COALESCE((
      SELECT COUNT(DISTINCT m.id)
      FROM messages m
      JOIN messages r ON r.thread_id = m.thread_id 
        AND r.direction = 'outbound'
        AND r.created_at > m.created_at
        AND r.created_at - m.created_at <= INTERVAL '24 hours'
      WHERE m.direction = 'inbound'
        AND m.created_at BETWEEN start_date_filter AND end_date_filter
        AND m.user_id = auth.uid()
    ), 0)
  ) INTO result;
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_metrics_summary"("start_date_param" timestamp with time zone, "end_date_param" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_status_metrics"("start_date_param" timestamp with time zone DEFAULT NULL::timestamp with time zone, "end_date_param" timestamp with time zone DEFAULT NULL::timestamp with time zone, "direction_filter" "text" DEFAULT NULL::"text", "message_type_filter" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  start_date_filter TIMESTAMP WITH TIME ZONE;
  end_date_filter TIMESTAMP WITH TIME ZONE;
  result JSONB;
BEGIN
  -- Definir datas padrão se não fornecidas
  start_date_filter := COALESCE(start_date_param, NOW() - INTERVAL '30 days');
  end_date_filter := COALESCE(end_date_param, NOW());
  
  -- Buscar métricas de status
  SELECT 
    COALESCE(jsonb_agg(
      jsonb_build_object(
        'status', status,
        'direction', direction,
        'message_type', message_type,
        'count', count
      )
    ), '[]'::jsonb)
  INTO result
  FROM (
    SELECT 
      status,
      direction,
      message_type,
      COUNT(*) as count
    FROM 
      messages
    WHERE 
      created_at BETWEEN start_date_filter AND end_date_filter
      AND user_id = auth.uid()
      AND (direction_filter IS NULL OR direction = direction_filter)
      AND (message_type_filter IS NULL OR message_type = message_type_filter)
    GROUP BY 
      status, direction, message_type
  ) subquery;
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_status_metrics"("start_date_param" timestamp with time zone, "end_date_param" timestamp with time zone, "direction_filter" "text", "message_type_filter" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_template_analytics"("p_team_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) RETURNS TABLE("template_name" "text", "sent_count" bigint, "delivered_count" bigint, "read_count" bigint, "clicked_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."get_template_analytics"("p_team_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unified_message_history"("p_user_id" "uuid", "p_contact_id" "uuid") RETURNS TABLE("id" "uuid", "contact_id" "uuid", "content" "text", "created_at" timestamp with time zone, "type" "public"."message_type", "status" "public"."message_status", "sourceTable" "text", "template" json)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Mark messages as read when fetching history
    UPDATE public.messages
    SET read_at = now()
    WHERE user_id = p_user_id
      AND contact_id = p_contact_id
      AND type = 'inbound'
      AND read_at IS NULL;

    RETURN QUERY
    SELECT
        m.id,
        m.contact_id,
        m.content,
        m.created_at,
        m.type,
        m.status,
        CASE
            WHEN m.type = 'inbound' THEN 'received_messages'
            ELSE 'sent_messages'
        END as "sourceTable", -- Kept for frontend logic simplification
        -- Include template info if it's a campaign message
        CASE
            WHEN m.campaign_id IS NOT NULL THEN (
                SELECT json_build_object(
                    'id', mt.id,
                    'template_name', mt.template_name,
                    'category', mt.category,
                    'components', mt.components
                )
                FROM public.campaigns camp
                JOIN public.message_templates mt ON camp.template_id = mt.id
                WHERE camp.id = m.campaign_id
            )
            ELSE NULL
        END as template
    FROM public.messages m
    WHERE m.user_id = p_user_id AND m.contact_id = p_contact_id
    ORDER BY m.created_at ASC;
END;
$$;


ALTER FUNCTION "public"."get_unified_message_history"("p_user_id" "uuid", "p_contact_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_teams_and_profile"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  _user_id uuid := auth.uid();
  _profile json;
  _teams json;
  _result json;
begin
  -- Busca o perfil do usuário logado
  select to_json(p)
  into _profile
  from profiles p
  where p.id = _user_id;

  -- Busca as equipes do usuário logado através da tabela de membros
  select json_agg(t)
  into _teams
  from teams t
  join team_members tm on t.id = tm.team_id
  where tm.user_id = _user_id;

  -- Combina os resultados em um único objeto JSON
  select json_build_object(
    'profile', _profile,
    'teams', coalesce(_teams, '[]'::json)
  ) into _result;

  return _result;
end;
$$;


ALTER FUNCTION "public"."get_user_teams_and_profile"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_waba_analytics"("p_team_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) RETURNS TABLE("total_messages" bigint, "delivered_messages" bigint, "read_messages" bigint, "failed_messages" bigint, "active_users" bigint, "new_users" bigint, "average_response_time" numeric, "template_messages_sent" bigint, "template_messages_delivered" bigint, "template_messages_read" bigint, "error_rate" numeric, "last_updated" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."get_waba_analytics"("p_team_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, company_name)
  VALUES (new.id, 'Minha Empresa');
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_node_stat"("p_automation_id" "uuid", "p_node_id" "text", "p_status" "text", "p_team_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    INSERT INTO public.automation_node_stats (automation_id, node_id, team_id, success_count, error_count, last_run_at)
    VALUES (
        p_automation_id,
        p_node_id,
        p_team_id, -- Insere o team_id
        CASE WHEN p_status = 'success' THEN 1 ELSE 0 END,
        CASE WHEN p_status = 'failed' THEN 1 ELSE 0 END,
        now()
    )
    -- A chave de conflito agora inclui o team_id para garantir a unicidade por equipe.
    ON CONFLICT (automation_id, node_id) DO UPDATE 
    SET
        success_count = automation_node_stats.success_count + (CASE WHEN p_status = 'success' THEN 1 ELSE 0 END),
        error_count = automation_node_stats.error_count + (CASE WHEN p_status = 'failed' THEN 1 ELSE 0 END),
        last_run_at = now();
END;
$$;


ALTER FUNCTION "public"."increment_node_stat"("p_automation_id" "uuid", "p_node_id" "text", "p_status" "text", "p_team_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_node_stat"("p_automation_id" "uuid", "p_node_id" "text", "p_team_id" "uuid", "p_status" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
begin
  insert into public.automation_node_stats(team_id, automation_id, node_id, success_count, error_count, last_run_at)
  values (
    p_team_id,
    p_automation_id,
    p_node_id,
    case when p_status = 'success' then 1 else 0 end,
    case when p_status = 'failed' then 1 else 0 end,
    now()
  )
  on conflict (team_id, automation_id, node_id)
  do update set
    success_count = public.automation_node_stats.success_count + case when p_status = 'success' then 1 else 0 end,
    error_count   = public.automation_node_stats.error_count   + case when p_status = 'failed' then 1 else 0 end,
    last_run_at   = now();
end;
$$;


ALTER FUNCTION "public"."increment_node_stat"("p_automation_id" "uuid", "p_node_id" "text", "p_team_id" "uuid", "p_status" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_team_admin"("p_team_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM teams t
    LEFT JOIN team_members tm ON t.id = tm.team_id
    WHERE t.id = p_team_id AND (t.owner_id = auth.uid() OR (tm.user_id = auth.uid() AND tm.role = 'admin'))
  );
END;
$$;


ALTER FUNCTION "public"."is_team_admin"("p_team_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_team_member"("p_team_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select exists (
    select 1
    from public.teams t
    where t.id = p_team_id
      and (
        t.owner_id = auth.uid()
        or exists (
          select 1 from public.team_members tm
          where tm.team_id = p_team_id and tm.user_id = auth.uid()
        )
      )
  );
$$;


ALTER FUNCTION "public"."is_team_member"("p_team_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_documents"("query_embedding" "public"."vector", "match_count" integer DEFAULT NULL::integer, "filter" "jsonb" DEFAULT '{}'::"jsonb") RETURNS TABLE("id" bigint, "content" "text", "metadata" "jsonb", "similarity" double precision)
    LANGUAGE "plpgsql"
    AS $$
#variable_conflict use_column
begin
  return query
  select
    id,
    content,
    metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where metadata @> filter
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;


ALTER FUNCTION "public"."match_documents"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_post_slug"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_unique_slug(NEW.title, 'posts', 'slug', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_post_slug"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."setup_new_user"("user_id" "uuid", "user_email" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  new_team_id uuid;
  result jsonb;
BEGIN
  -- Create a new team for the user
  INSERT INTO public.teams (name)
  VALUES ('My Team')
  RETURNING id INTO new_team_id;
  
  -- Create a profile for the user
  INSERT INTO public.profiles (id, email, full_name, team_id, role)
  VALUES (
    user_id,
    user_email,
    split_part(user_email, '@', 1), -- Use the part before @ as the name
    new_team_id,
    'admin' -- Set as admin by default
  );
  
  -- Add user to the team_members table
  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (new_team_id, user_id, 'admin');
  
  -- Return success
  result := jsonb_build_object(
    'success', true,
    'team_id', new_team_id
  );
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."setup_new_user"("user_id" "uuid", "user_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_automation_triggers"("automation_id_in" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    automation_team_id UUID;
    node_record JSONB;
BEGIN
    -- Busca o team_id para a automação especificada.
    SELECT team_id INTO automation_team_id FROM public.automations WHERE id = automation_id_in;

    IF automation_team_id IS NULL THEN
        RAISE WARNING 'Automação com id % não encontrada', automation_id_in;
        RETURN;
    END IF;

    -- Apaga os gatilhos existentes para esta automação.
    DELETE FROM public.automation_triggers WHERE automation_id = automation_id_in;

    -- Itera sobre os nós da automação e insere os novos gatilhos.
    FOR node_record IN (SELECT jsonb_array_elements(nodes) FROM public.automations WHERE id = automation_id_in)
    LOOP
        IF node_record->'data'->>'nodeType' = 'trigger' THEN
            INSERT INTO public.automation_triggers (team_id, automation_id, node_id, trigger_type, trigger_key)
            VALUES (
                automation_team_id, -- Usa o team_id correto.
                automation_id_in,
                node_record->>'id',
                node_record->'data'->>'type',
                CASE
                    WHEN node_record->'data'->>'type' = 'message_received_with_keyword' THEN node_record->'data'->'config'->>'keyword'
                    WHEN node_record->'data'->>'type' = 'button_clicked' THEN node_record->'data'->'config'->>'button_payload'
                    WHEN node_record->'data'->>'type' = 'new_contact_with_tag' THEN node_record->'data'->'config'->>'tag'
                    ELSE NULL
                END
            );
        END IF;
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."sync_automation_triggers"("automation_id_in" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_deal_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
   NEW.updated_at = now(); 
   RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_deal_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."automation_node_logs" (
    "id" bigint NOT NULL,
    "run_id" "uuid" NOT NULL,
    "node_id" "text" NOT NULL,
    "status" "text" NOT NULL,
    "details" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "team_id" "uuid"
);


ALTER TABLE "public"."automation_node_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."automation_node_logs" IS 'Logs the result of each individual node execution within an automation run.';



CREATE SEQUENCE IF NOT EXISTS "public"."automation_node_logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."automation_node_logs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."automation_node_logs_id_seq" OWNED BY "public"."automation_node_logs"."id";



CREATE TABLE IF NOT EXISTS "public"."automation_node_stats" (
    "automation_id" "uuid" NOT NULL,
    "node_id" "text" NOT NULL,
    "success_count" integer DEFAULT 0 NOT NULL,
    "error_count" integer DEFAULT 0 NOT NULL,
    "last_run_at" timestamp with time zone,
    "team_id" "uuid"
);


ALTER TABLE "public"."automation_node_stats" OWNER TO "postgres";


COMMENT ON TABLE "public"."automation_node_stats" IS 'Aggregates statistics for each node in an automation.';



CREATE TABLE IF NOT EXISTS "public"."automation_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "automation_id" "uuid" NOT NULL,
    "contact_id" "uuid",
    "status" "text" NOT NULL,
    "details" "text",
    "run_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "team_id" "uuid"
);


ALTER TABLE "public"."automation_runs" OWNER TO "postgres";


COMMENT ON TABLE "public"."automation_runs" IS 'Logs each time an automation workflow is executed.';



CREATE TABLE IF NOT EXISTS "public"."automation_triggers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "automation_id" "uuid" NOT NULL,
    "node_id" "text" NOT NULL,
    "trigger_type" "text" NOT NULL,
    "trigger_key" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "team_id" "uuid" NOT NULL
);


ALTER TABLE "public"."automation_triggers" OWNER TO "postgres";


COMMENT ON TABLE "public"."automation_triggers" IS 'Stores registered triggers for quick lookups to start automations.';



CREATE TABLE IF NOT EXISTS "public"."automations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "status" "public"."automation_status" DEFAULT 'paused'::"public"."automation_status" NOT NULL,
    "nodes" "jsonb",
    "edges" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "team_id" "uuid" NOT NULL
);


ALTER TABLE "public"."automations" OWNER TO "postgres";


COMMENT ON TABLE "public"."automations" IS 'Stores automation workflows created by users.';



CREATE TABLE IF NOT EXISTS "public"."campaigns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "template_id" "uuid",
    "status" "public"."campaign_status" NOT NULL,
    "recipient_count" integer DEFAULT 0 NOT NULL,
    "sent_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "team_id" "uuid" NOT NULL,
    "throttle_rate" integer,
    "throttle_unit" "text",
    CONSTRAINT "campaigns_throttle_unit_check" CHECK (("throttle_unit" = ANY (ARRAY['minute'::"text", 'hour'::"text"])))
);


ALTER TABLE "public"."campaigns" OWNER TO "postgres";


COMMENT ON TABLE "public"."campaigns" IS 'Represents a marketing campaign sent to a group of contacts.';



CREATE TABLE IF NOT EXISTS "public"."canned_responses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shortcut" "text",
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "team_id" "uuid" NOT NULL
);


ALTER TABLE "public"."canned_responses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contact_activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "content" "text" NOT NULL,
    "due_date" timestamp with time zone,
    "is_completed" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "team_id" "uuid" NOT NULL,
    CONSTRAINT "contact_activities_type_check" CHECK (("type" = ANY (ARRAY['NOTA'::"text", 'TAREFA'::"text"])))
);


ALTER TABLE "public"."contact_activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "email" "text",
    "company" "text",
    "tags" "text"[],
    "custom_fields" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "sentiment" "text",
    "team_id" "uuid" NOT NULL
);


ALTER TABLE "public"."contacts" OWNER TO "postgres";


COMMENT ON TABLE "public"."contacts" IS 'Stores contact information for each user.';



CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "team_id" "uuid" NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "assignee_id" "uuid",
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "conversations_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'closed'::"text"])))
);


ALTER TABLE "public"."conversations" OWNER TO "postgres";


COMMENT ON TABLE "public"."conversations" IS 'Gere o estado das conversas para a caixa de entrada partilhada.';



CREATE TABLE IF NOT EXISTS "public"."custom_field_definitions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "key" "text" NOT NULL,
    "type" "public"."custom_field_type" NOT NULL,
    "options" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "team_id" "uuid" NOT NULL
);


ALTER TABLE "public"."custom_field_definitions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "pipeline_id" "uuid" NOT NULL,
    "stage_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "value" numeric,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'Aberto'::"text" NOT NULL,
    "closing_reason" "text",
    "closed_at" timestamp with time zone,
    "team_id" "uuid" NOT NULL,
    CONSTRAINT "deals_status_check" CHECK (("status" = ANY (ARRAY['Aberto'::"text", 'Ganho'::"text", 'Perdido'::"text"])))
);


ALTER TABLE "public"."deals" OWNER TO "postgres";


COMMENT ON TABLE "public"."deals" IS 'Represents a deal or opportunity in a sales pipeline.';



CREATE TABLE IF NOT EXISTS "public"."goals" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "target_value" numeric NOT NULL,
    "current_value" numeric DEFAULT 0,
    "metric_type" "text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid" NOT NULL,
    "team_id" "uuid",
    CONSTRAINT "end_date_after_start_date" CHECK (("end_date" > "start_date")),
    CONSTRAINT "goals_metric_type_check" CHECK (("metric_type" = ANY (ARRAY['messages_sent'::"text", 'messages_responded'::"text", 'campaigns_created'::"text", 'deals_closed'::"text", 'revenue'::"text"]))),
    CONSTRAINT "goals_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'completed'::"text", 'failed'::"text", 'draft'::"text"])))
);


ALTER TABLE "public"."goals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."message_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "message_id" "text" NOT NULL,
    "contact_id" "text" NOT NULL,
    "direction" "public"."message_direction" NOT NULL,
    "status" "public"."message_status" NOT NULL,
    "message_type" "public"."message_type" NOT NULL,
    "timestamp" timestamp with time zone NOT NULL,
    "response_time" integer,
    "error_code" "text",
    "template_name" "text",
    "campaign_id" "text",
    "session_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "valid_response_time" CHECK (((("direction" = 'inbound'::"public"."message_direction") AND ("response_time" IS NULL)) OR (("direction" = 'outbound'::"public"."message_direction") AND (("response_time" IS NULL) OR ("response_time" >= 0)))))
);


ALTER TABLE "public"."message_metrics" OWNER TO "postgres";


COMMENT ON TABLE "public"."message_metrics" IS 'Armazena métricas detalhadas de mensagens do WhatsApp para análise e relatórios';



COMMENT ON COLUMN "public"."message_metrics"."response_time" IS 'Tempo de resposta em segundos (apenas para mensagens de saída)';



COMMENT ON COLUMN "public"."message_metrics"."error_code" IS 'Código de erro retornado pela API do WhatsApp, se houver falha';



COMMENT ON COLUMN "public"."message_metrics"."session_id" IS 'Identificador de sessão para agrupar mensagens da mesma conversa';



CREATE TABLE IF NOT EXISTS "public"."message_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "meta_id" "text",
    "template_name" "text" NOT NULL,
    "category" "public"."template_category" NOT NULL,
    "status" "public"."template_status" DEFAULT 'LOCAL'::"public"."template_status" NOT NULL,
    "components" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "team_id" "uuid" NOT NULL
);


ALTER TABLE "public"."message_templates" OWNER TO "postgres";


COMMENT ON TABLE "public"."message_templates" IS 'Stores WhatsApp message templates, synced with Meta.';



CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "campaign_id" "uuid",
    "automation_id" "uuid",
    "type" "public"."message_type" NOT NULL,
    "source" "public"."message_source" NOT NULL,
    "content" "text" NOT NULL,
    "status" "public"."message_status" NOT NULL,
    "meta_message_id" "text",
    "error_message" "text",
    "sent_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "replied_to_message_id" "uuid",
    "team_id" "uuid" NOT NULL
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


COMMENT ON TABLE "public"."messages" IS 'Consolidated table for all inbound and outbound messages.';



CREATE TABLE IF NOT EXISTS "public"."pipeline_stages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pipeline_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "sort_order" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "type" "text" DEFAULT 'Intermediária'::"text" NOT NULL,
    CONSTRAINT "pipeline_stages_type_check" CHECK (("type" = ANY (ARRAY['Intermediária'::"text", 'Ganho'::"text", 'Perdido'::"text"])))
);


ALTER TABLE "public"."pipeline_stages" OWNER TO "postgres";


COMMENT ON TABLE "public"."pipeline_stages" IS 'Defines the stages within a sales pipeline.';



CREATE TABLE IF NOT EXISTS "public"."pipelines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "team_id" "uuid" NOT NULL
);


ALTER TABLE "public"."pipelines" OWNER TO "postgres";


COMMENT ON TABLE "public"."pipelines" IS 'Defines a sales pipeline.';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "updated_at" timestamp with time zone,
    "company_name" "text",
    "company_description" "text",
    "company_products" "text",
    "company_audience" "text",
    "company_tone" "text",
    "meta_access_token" "text",
    "meta_waba_id" "text",
    "meta_phone_number_id" "text",
    "webhook_path_prefix" "text",
    "meta_verify_token" "text",
    "dashboard_layout" "jsonb"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."profiles" IS 'Stores user profile information and settings, including company details for AI and Meta API credentials.';



COMMENT ON COLUMN "public"."profiles"."dashboard_layout" IS 'Stores the user-defined order and layout of dashboard cards.';



CREATE TABLE IF NOT EXISTS "public"."team_members" (
    "team_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'agent'::"text" NOT NULL,
    CONSTRAINT "team_members_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'agent'::"text"])))
);


ALTER TABLE "public"."team_members" OWNER TO "postgres";


COMMENT ON TABLE "public"."team_members" IS 'Gere a associação e os papéis dos utilizadores nas equipas.';



CREATE TABLE IF NOT EXISTS "public"."teams" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "owner_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."teams" OWNER TO "postgres";


COMMENT ON TABLE "public"."teams" IS 'Armazena informações sobre as diferentes equipas/workspaces.';



CREATE TABLE IF NOT EXISTS "public"."waba_configs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "team_id" "uuid" NOT NULL,
    "waba_id" "text" NOT NULL,
    "phone_number_id" "text" NOT NULL,
    "access_token" "text" NOT NULL,
    "business_name" "text",
    "business_id" "text",
    "verified_name" "text",
    "account_review_status" "text",
    "message_template_namespace" "text",
    "currency" "text",
    "timezone_id" "text",
    "is_default" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."waba_configs" OWNER TO "postgres";


COMMENT ON TABLE "public"."waba_configs" IS 'Stores configurations for WhatsApp Business Accounts (WABA)';



COMMENT ON COLUMN "public"."waba_configs"."team_id" IS 'Reference to the team that owns this WABA configuration';



COMMENT ON COLUMN "public"."waba_configs"."waba_id" IS 'WhatsApp Business Account ID from Meta';



COMMENT ON COLUMN "public"."waba_configs"."phone_number_id" IS 'WhatsApp Business Phone Number ID';



COMMENT ON COLUMN "public"."waba_configs"."access_token" IS 'Access token for the WhatsApp Business API';



COMMENT ON COLUMN "public"."waba_configs"."business_name" IS 'Name of the business as registered with Meta';



COMMENT ON COLUMN "public"."waba_configs"."verified_name" IS 'Verified business name from Meta';



COMMENT ON COLUMN "public"."waba_configs"."account_review_status" IS 'Current status of the WABA review process';



COMMENT ON COLUMN "public"."waba_configs"."is_default" IS 'Indicates if this is the default WABA for the team';



CREATE TABLE IF NOT EXISTS "public"."webhook_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "source" "text" NOT NULL,
    "payload" "jsonb",
    "path" "text",
    "team_id" "uuid" NOT NULL
);


ALTER TABLE "public"."webhook_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."webhook_logs" IS 'Armazena payloads brutos de webhooks recebidos para depuração e inspeção.';



ALTER TABLE ONLY "public"."automation_node_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."automation_node_logs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."automation_node_logs"
    ADD CONSTRAINT "automation_node_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."automation_node_stats"
    ADD CONSTRAINT "automation_node_stats_pkey" PRIMARY KEY ("automation_id", "node_id");



ALTER TABLE ONLY "public"."automation_runs"
    ADD CONSTRAINT "automation_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."automation_triggers"
    ADD CONSTRAINT "automation_triggers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."automations"
    ADD CONSTRAINT "automations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."canned_responses"
    ADD CONSTRAINT "canned_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_activities"
    ADD CONSTRAINT "contact_activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_contact_id_key" UNIQUE ("contact_id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."custom_field_definitions"
    ADD CONSTRAINT "custom_field_definitions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."message_metrics"
    ADD CONSTRAINT "message_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."message_metrics"
    ADD CONSTRAINT "message_metrics_profile_id_message_id_key" UNIQUE ("profile_id", "message_id");



ALTER TABLE ONLY "public"."message_templates"
    ADD CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_meta_message_id_key" UNIQUE ("meta_message_id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pipeline_stages"
    ADD CONSTRAINT "pipeline_stages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pipelines"
    ADD CONSTRAINT "pipelines_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_webhook_path_prefix_key" UNIQUE ("webhook_path_prefix");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_pkey" PRIMARY KEY ("team_id", "user_id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."waba_configs"
    ADD CONSTRAINT "waba_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."waba_configs"
    ADD CONSTRAINT "waba_configs_team_id_waba_id_key" UNIQUE ("team_id", "waba_id");



ALTER TABLE ONLY "public"."webhook_logs"
    ADD CONSTRAINT "webhook_logs_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_goals_metric_type" ON "public"."goals" USING "btree" ("metric_type");



CREATE INDEX "idx_goals_status" ON "public"."goals" USING "btree" ("status");



CREATE INDEX "idx_goals_team_id" ON "public"."goals" USING "btree" ("team_id");



CREATE INDEX "idx_goals_user_id" ON "public"."goals" USING "btree" ("user_id");



CREATE INDEX "idx_message_metrics_campaign_id" ON "public"."message_metrics" USING "btree" ("campaign_id") WHERE ("campaign_id" IS NOT NULL);



CREATE INDEX "idx_message_metrics_contact_id" ON "public"."message_metrics" USING "btree" ("contact_id");



CREATE INDEX "idx_message_metrics_profile_id" ON "public"."message_metrics" USING "btree" ("profile_id");



CREATE INDEX "idx_message_metrics_status" ON "public"."message_metrics" USING "btree" ("status");



CREATE INDEX "idx_message_metrics_timestamp" ON "public"."message_metrics" USING "btree" ("timestamp");



CREATE INDEX "idx_waba_configs_team_id" ON "public"."waba_configs" USING "btree" ("team_id");



CREATE INDEX "idx_waba_configs_waba_id" ON "public"."waba_configs" USING "btree" ("waba_id");



CREATE INDEX "ix_contact_activities_contact_id" ON "public"."contact_activities" USING "btree" ("contact_id");



CREATE INDEX "ix_contact_activities_due_date" ON "public"."contact_activities" USING "btree" ("due_date");



CREATE INDEX "ix_deals_status" ON "public"."deals" USING "btree" ("status");



CREATE INDEX "messages_campaign_id_idx" ON "public"."messages" USING "btree" ("campaign_id");



CREATE OR REPLACE TRIGGER "update_goals_updated_at" BEFORE UPDATE ON "public"."goals" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_message_metrics_updated_at" BEFORE UPDATE ON "public"."message_metrics" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_waba_configs_updated_at" BEFORE UPDATE ON "public"."waba_configs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."automation_node_logs"
    ADD CONSTRAINT "automation_node_logs_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "public"."automation_runs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."automation_node_logs"
    ADD CONSTRAINT "automation_node_logs_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."automation_node_stats"
    ADD CONSTRAINT "automation_node_stats_automation_id_fkey" FOREIGN KEY ("automation_id") REFERENCES "public"."automations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."automation_node_stats"
    ADD CONSTRAINT "automation_node_stats_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."automation_runs"
    ADD CONSTRAINT "automation_runs_automation_id_fkey" FOREIGN KEY ("automation_id") REFERENCES "public"."automations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."automation_runs"
    ADD CONSTRAINT "automation_runs_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."automation_runs"
    ADD CONSTRAINT "automation_runs_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."automation_triggers"
    ADD CONSTRAINT "automation_triggers_automation_id_fkey" FOREIGN KEY ("automation_id") REFERENCES "public"."automations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."automation_triggers"
    ADD CONSTRAINT "automation_triggers_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."automations"
    ADD CONSTRAINT "automations_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."message_templates"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."canned_responses"
    ADD CONSTRAINT "canned_responses_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact_activities"
    ADD CONSTRAINT "contact_activities_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact_activities"
    ADD CONSTRAINT "contact_activities_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."custom_field_definitions"
    ADD CONSTRAINT "custom_field_definitions_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "public"."pipelines"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "public"."pipeline_stages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message_metrics"
    ADD CONSTRAINT "message_metrics_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message_templates"
    ADD CONSTRAINT "message_templates_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_automation_id_fkey" FOREIGN KEY ("automation_id") REFERENCES "public"."automations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_replied_to_message_id_fkey" FOREIGN KEY ("replied_to_message_id") REFERENCES "public"."messages"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pipeline_stages"
    ADD CONSTRAINT "pipeline_stages_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "public"."pipelines"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pipelines"
    ADD CONSTRAINT "pipelines_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."waba_configs"
    ADD CONSTRAINT "waba_configs_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."webhook_logs"
    ADD CONSTRAINT "webhook_logs_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can manage members in their teams" ON "public"."team_members" USING ("public"."is_team_admin"("team_id"));



CREATE POLICY "Enable access for team members" ON "public"."automation_node_logs" USING ("public"."is_team_member"("team_id")) WITH CHECK ("public"."is_team_member"("team_id"));



CREATE POLICY "Enable access for team members" ON "public"."automation_node_stats" USING ("public"."is_team_member"("team_id")) WITH CHECK ("public"."is_team_member"("team_id"));



CREATE POLICY "Enable access for team members" ON "public"."automation_runs" USING ("public"."is_team_member"("team_id")) WITH CHECK ("public"."is_team_member"("team_id"));



CREATE POLICY "Enable access for team members" ON "public"."automation_triggers" USING ("public"."is_team_member"("team_id")) WITH CHECK ("public"."is_team_member"("team_id"));



CREATE POLICY "Enable access for team members" ON "public"."automations" USING ("public"."is_team_member"("team_id")) WITH CHECK ("public"."is_team_member"("team_id"));



CREATE POLICY "Enable access for team members" ON "public"."campaigns" USING ("public"."is_team_member"("team_id")) WITH CHECK ("public"."is_team_member"("team_id"));



CREATE POLICY "Enable access for team members" ON "public"."canned_responses" USING ("public"."is_team_member"("team_id")) WITH CHECK ("public"."is_team_member"("team_id"));



CREATE POLICY "Enable access for team members" ON "public"."contact_activities" USING ("public"."is_team_member"("team_id")) WITH CHECK ("public"."is_team_member"("team_id"));



CREATE POLICY "Enable access for team members" ON "public"."contacts" USING ("public"."is_team_member"("team_id")) WITH CHECK ("public"."is_team_member"("team_id"));



CREATE POLICY "Enable access for team members" ON "public"."conversations" USING ("public"."is_team_member"("team_id")) WITH CHECK ("public"."is_team_member"("team_id"));



CREATE POLICY "Enable access for team members" ON "public"."custom_field_definitions" USING ("public"."is_team_member"("team_id")) WITH CHECK ("public"."is_team_member"("team_id"));



CREATE POLICY "Enable access for team members" ON "public"."deals" USING ("public"."is_team_member"("team_id")) WITH CHECK ("public"."is_team_member"("team_id"));



CREATE POLICY "Enable access for team members" ON "public"."message_templates" USING ("public"."is_team_member"("team_id")) WITH CHECK ("public"."is_team_member"("team_id"));



CREATE POLICY "Enable access for team members" ON "public"."messages" USING ("public"."is_team_member"("team_id")) WITH CHECK ("public"."is_team_member"("team_id"));



CREATE POLICY "Enable access for team members" ON "public"."pipeline_stages" USING ((EXISTS ( SELECT 1
   FROM "public"."pipelines" "p"
  WHERE (("p"."id" = "pipeline_stages"."pipeline_id") AND "public"."is_team_member"("p"."team_id"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."pipelines" "p"
  WHERE (("p"."id" = "pipeline_stages"."pipeline_id") AND "public"."is_team_member"("p"."team_id")))));



CREATE POLICY "Enable access for team members" ON "public"."pipelines" USING ("public"."is_team_member"("team_id")) WITH CHECK ("public"."is_team_member"("team_id"));



CREATE POLICY "Enable access for team members" ON "public"."webhook_logs" USING ("public"."is_team_member"("team_id")) WITH CHECK ("public"."is_team_member"("team_id"));



CREATE POLICY "Members can view their own team's memberships" ON "public"."team_members" FOR SELECT USING ("public"."is_team_member"("team_id"));



CREATE POLICY "Permitir atualização para dono do perfil" ON "public"."message_metrics" FOR UPDATE USING (("auth"."uid"() = "profile_id")) WITH CHECK (("auth"."uid"() = "profile_id"));



CREATE POLICY "Permitir inserção para dono do perfil" ON "public"."message_metrics" FOR INSERT WITH CHECK (("auth"."uid"() = "profile_id"));



CREATE POLICY "Permitir leitura para dono do perfil" ON "public"."message_metrics" FOR SELECT USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Team admins can manage their WABA configs" ON "public"."waba_configs" USING ((EXISTS ( SELECT 1
   FROM "public"."team_members"
  WHERE (("team_members"."team_id" = "waba_configs"."team_id") AND ("team_members"."user_id" = "auth"."uid"()) AND ("team_members"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."team_members"
  WHERE (("team_members"."team_id" = "waba_configs"."team_id") AND ("team_members"."user_id" = "auth"."uid"()) AND ("team_members"."role" = 'admin'::"text")))));



CREATE POLICY "Team admins can update their teams" ON "public"."teams" FOR UPDATE USING ("public"."is_team_admin"("id"));



CREATE POLICY "Team members can view their own teams" ON "public"."teams" FOR SELECT USING ("public"."is_team_member"("id"));



CREATE POLICY "Users can manage their own profile" ON "public"."profiles" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their team's WABA configs" ON "public"."waba_configs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."team_members"
  WHERE (("team_members"."team_id" = "waba_configs"."team_id") AND ("team_members"."user_id" = "auth"."uid"())))));



CREATE POLICY "Usuários podem atualizar suas próprias metas" ON "public"."goals" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuários podem excluir suas próprias metas" ON "public"."goals" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuários podem inserir suas próprias metas" ON "public"."goals" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuários podem ver suas próprias metas" ON "public"."goals" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."automation_node_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."automation_node_stats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."automation_runs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."automation_triggers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."automations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."campaigns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."canned_responses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contact_activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."custom_field_definitions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."goals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."message_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."message_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pipeline_stages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pipelines" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "select team node logs" ON "public"."automation_node_logs" FOR SELECT USING ("public"."is_team_member"("team_id"));



CREATE POLICY "select team node stats" ON "public"."automation_node_stats" FOR SELECT USING ("public"."is_team_member"("team_id"));



CREATE POLICY "select team runs" ON "public"."automation_runs" FOR SELECT USING ("public"."is_team_member"("team_id"));



ALTER TABLE "public"."team_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."teams" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."waba_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."webhook_logs" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."automations";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."contacts";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."custom_field_definitions";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."deals";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."messages";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_slug"("title" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_slug"("title" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_slug"("title" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_unique_slug"("title" "text", "table_name" "text", "id_column" "text", "id_value" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_unique_slug"("title" "text", "table_name" "text", "id_column" "text", "id_value" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_unique_slug"("title" "text", "table_name" "text", "id_column" "text", "id_value" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_average_response_time"("start_date_param" timestamp with time zone, "end_date_param" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_average_response_time"("start_date_param" timestamp with time zone, "end_date_param" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_average_response_time"("start_date_param" timestamp with time zone, "end_date_param" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_average_response_time"("p_profile_id" "text", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_average_response_time"("p_profile_id" "text", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_average_response_time"("p_profile_id" "text", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_campaign_metrics"("start_date_param" timestamp with time zone, "end_date_param" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_campaign_metrics"("start_date_param" timestamp with time zone, "end_date_param" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_campaign_metrics"("start_date_param" timestamp with time zone, "end_date_param" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_conversation_analytics"("p_team_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_conversation_analytics"("p_team_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_conversation_analytics"("p_team_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_conversations_with_contacts"("p_team_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_conversations_with_contacts"("p_team_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_conversations_with_contacts"("p_team_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_flow_metrics"("p_team_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_flow_metrics"("p_team_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_flow_metrics"("p_team_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_goal_progress"("goal_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_goal_progress"("goal_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_goal_progress"("goal_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_metrics_by_status"("p_profile_id" "text", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_metrics_by_status"("p_profile_id" "text", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_metrics_by_status"("p_profile_id" "text", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_metrics_by_status"("p_profile_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_metrics_by_status"("p_profile_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_metrics_by_status"("p_profile_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_metrics_summary"("start_date_param" timestamp with time zone, "end_date_param" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_metrics_summary"("start_date_param" timestamp with time zone, "end_date_param" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_metrics_summary"("start_date_param" timestamp with time zone, "end_date_param" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_status_metrics"("start_date_param" timestamp with time zone, "end_date_param" timestamp with time zone, "direction_filter" "text", "message_type_filter" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_status_metrics"("start_date_param" timestamp with time zone, "end_date_param" timestamp with time zone, "direction_filter" "text", "message_type_filter" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_status_metrics"("start_date_param" timestamp with time zone, "end_date_param" timestamp with time zone, "direction_filter" "text", "message_type_filter" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_template_analytics"("p_team_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_template_analytics"("p_team_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_template_analytics"("p_team_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unified_message_history"("p_user_id" "uuid", "p_contact_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_unified_message_history"("p_user_id" "uuid", "p_contact_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unified_message_history"("p_user_id" "uuid", "p_contact_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_teams_and_profile"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_teams_and_profile"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_teams_and_profile"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_waba_analytics"("p_team_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_waba_analytics"("p_team_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_waba_analytics"("p_team_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "postgres";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "anon";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_node_stat"("p_automation_id" "uuid", "p_node_id" "text", "p_status" "text", "p_team_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_node_stat"("p_automation_id" "uuid", "p_node_id" "text", "p_status" "text", "p_team_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_node_stat"("p_automation_id" "uuid", "p_node_id" "text", "p_status" "text", "p_team_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_node_stat"("p_automation_id" "uuid", "p_node_id" "text", "p_team_id" "uuid", "p_status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_node_stat"("p_automation_id" "uuid", "p_node_id" "text", "p_team_id" "uuid", "p_status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_node_stat"("p_automation_id" "uuid", "p_node_id" "text", "p_team_id" "uuid", "p_status" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_team_admin"("p_team_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_team_admin"("p_team_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_team_admin"("p_team_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_team_member"("p_team_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_team_member"("p_team_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_team_member"("p_team_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "postgres";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "anon";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "authenticated";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."match_documents"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."match_documents"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_documents"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_post_slug"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_post_slug"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_post_slug"() TO "service_role";



GRANT ALL ON FUNCTION "public"."setup_new_user"("user_id" "uuid", "user_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."setup_new_user"("user_id" "uuid", "user_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."setup_new_user"("user_id" "uuid", "user_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_automation_triggers"("automation_id_in" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."sync_automation_triggers"("automation_id_in" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_automation_triggers"("automation_id_in" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_deal_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_deal_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_deal_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "service_role";












GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "service_role";









GRANT ALL ON TABLE "public"."automation_node_logs" TO "anon";
GRANT ALL ON TABLE "public"."automation_node_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."automation_node_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."automation_node_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."automation_node_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."automation_node_logs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."automation_node_stats" TO "anon";
GRANT ALL ON TABLE "public"."automation_node_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."automation_node_stats" TO "service_role";



GRANT ALL ON TABLE "public"."automation_runs" TO "anon";
GRANT ALL ON TABLE "public"."automation_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."automation_runs" TO "service_role";



GRANT ALL ON TABLE "public"."automation_triggers" TO "anon";
GRANT ALL ON TABLE "public"."automation_triggers" TO "authenticated";
GRANT ALL ON TABLE "public"."automation_triggers" TO "service_role";



GRANT ALL ON TABLE "public"."automations" TO "anon";
GRANT ALL ON TABLE "public"."automations" TO "authenticated";
GRANT ALL ON TABLE "public"."automations" TO "service_role";



GRANT ALL ON TABLE "public"."campaigns" TO "anon";
GRANT ALL ON TABLE "public"."campaigns" TO "authenticated";
GRANT ALL ON TABLE "public"."campaigns" TO "service_role";



GRANT ALL ON TABLE "public"."canned_responses" TO "anon";
GRANT ALL ON TABLE "public"."canned_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."canned_responses" TO "service_role";



GRANT ALL ON TABLE "public"."contact_activities" TO "anon";
GRANT ALL ON TABLE "public"."contact_activities" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_activities" TO "service_role";



GRANT ALL ON TABLE "public"."contacts" TO "anon";
GRANT ALL ON TABLE "public"."contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."contacts" TO "service_role";



GRANT ALL ON TABLE "public"."conversations" TO "anon";
GRANT ALL ON TABLE "public"."conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."conversations" TO "service_role";



GRANT ALL ON TABLE "public"."custom_field_definitions" TO "anon";
GRANT ALL ON TABLE "public"."custom_field_definitions" TO "authenticated";
GRANT ALL ON TABLE "public"."custom_field_definitions" TO "service_role";



GRANT ALL ON TABLE "public"."deals" TO "anon";
GRANT ALL ON TABLE "public"."deals" TO "authenticated";
GRANT ALL ON TABLE "public"."deals" TO "service_role";



GRANT ALL ON TABLE "public"."goals" TO "anon";
GRANT ALL ON TABLE "public"."goals" TO "authenticated";
GRANT ALL ON TABLE "public"."goals" TO "service_role";



GRANT ALL ON TABLE "public"."message_metrics" TO "anon";
GRANT ALL ON TABLE "public"."message_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."message_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."message_templates" TO "anon";
GRANT ALL ON TABLE "public"."message_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."message_templates" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."pipeline_stages" TO "anon";
GRANT ALL ON TABLE "public"."pipeline_stages" TO "authenticated";
GRANT ALL ON TABLE "public"."pipeline_stages" TO "service_role";



GRANT ALL ON TABLE "public"."pipelines" TO "anon";
GRANT ALL ON TABLE "public"."pipelines" TO "authenticated";
GRANT ALL ON TABLE "public"."pipelines" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."team_members" TO "anon";
GRANT ALL ON TABLE "public"."team_members" TO "authenticated";
GRANT ALL ON TABLE "public"."team_members" TO "service_role";



GRANT ALL ON TABLE "public"."teams" TO "anon";
GRANT ALL ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";



GRANT ALL ON TABLE "public"."waba_configs" TO "anon";
GRANT ALL ON TABLE "public"."waba_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."waba_configs" TO "service_role";



GRANT ALL ON TABLE "public"."webhook_logs" TO "anon";
GRANT ALL ON TABLE "public"."webhook_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."webhook_logs" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;

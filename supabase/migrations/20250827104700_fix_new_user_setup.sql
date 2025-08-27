-- ============================================================
--   Fix for setup_new_user function
-- ============================================================
-- This migration updates the setup_new_user function to properly
-- initialize new user profiles with a default company name and
-- dashboard layout. This fixes a bug where new users would not
-- have these fields set, causing issues in the application.
--
-- Changes:
-- - Sets 'company_name' based on the user's email.
-- - Sets a default 'dashboard_layout' as a JSON array of strings.
-- - Uses ON CONFLICT DO UPDATE for better robustness.
-- ============================================================

create or replace function public.setup_new_user(user_id uuid, user_email text)
    returns json
    language plpgsql
    security definer
as $$
declare
    v_profile public.profiles;
    v_team    public.teams;
    v_company_name text := coalesce(split_part(user_email,'@',1), 'My Company');
    -- Default dashboard layout based on frontend component 'defaultCardOrder'
    v_dashboard_layout jsonb := '["stats", "sales", "growth", "tasks", "campaigns", "automations", "activity"]';
begin
    -- Create profile if it doesn't exist, with default values.
    -- If it exists, update it only if company_name or dashboard_layout is null.
    insert into public.profiles (id, company_name, dashboard_layout, updated_at)
    values (user_id, v_company_name, v_dashboard_layout, now())
    on conflict (id) do update
    set
        company_name = coalesce(public.profiles.company_name, v_company_name),
        dashboard_layout = coalesce(public.profiles.dashboard_layout, v_dashboard_layout),
        updated_at = now();

    -- Create a default team and admin membership
    insert into public.teams (name, owner_id)
    values (v_company_name, user_id)
    returning * into v_team;

    insert into public.team_members (team_id, user_id, role)
    values (v_team.id, user_id, 'admin')
    on conflict do nothing;

    -- Create a default pipeline and stages
    with p as (
        insert into public.pipelines (team_id, name)
        values (v_team.id, 'Pipeline Padrão')
        returning id
    )
    insert into public.pipeline_stages (pipeline_id, name, sort_order, type)
    select p.id, s.name, s.sort_order, s.type
    from p,
         (values
              ('Novo', 1, 'Intermediária'::stage_type),
              ('Em Progresso', 2, 'Intermediária'::stage_type),
              ('Ganho', 3, 'Ganho'::stage_type),
              ('Perdido', 4, 'Perdido'::stage_type)
         ) as s(name, sort_order, type);

    select * into v_profile from public.profiles where id = user_id;
    return json_build_object('profile', to_json(v_profile), 'team', to_json(v_team));
end;
$$;

-- ============================================================
--   Definitive Fix for setup_new_user (v2 - Exception Handling)
-- ============================================================
-- This migration provides a robust and idempotent version of the
-- setup_new_user function using a BEGIN...EXCEPTION block to avoid
-- issues with `ON CONFLICT` in the trigger environment.
--
-- Fixes:
-- - Resolves a 500 Internal Server Error during user signup.
-- - Prevents the creation of duplicate teams.
-- - Reliably populates profile fields for new and existing users.
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
    v_dashboard_layout jsonb := '["stats", "sales", "growth", "tasks", "campaigns", "automations", "activity"]';
    v_team_id uuid;
begin
    -- Handle profile creation/update using a BEGIN...EXCEPTION block
    -- for better stability in the trigger context.
    begin
        insert into public.profiles (id, company_name, dashboard_layout, updated_at)
        values (user_id, v_company_name, v_dashboard_layout, now());
    exception when unique_violation then
        update public.profiles
        set
            company_name = coalesce(public.profiles.company_name, v_company_name),
            dashboard_layout = coalesce(public.profiles.dashboard_layout, v_dashboard_layout),
            updated_at = now()
        where
            id = user_id;
    end;

    -- Now, check if the user already has a team to prevent duplicates.
    select team_id into v_team_id from public.team_members where team_members.user_id = setup_new_user.user_id limit 1;

    -- If no team exists for the user, create a new one.
    if v_team_id is null then
        insert into public.teams (name, owner_id)
        values (v_company_name, user_id)
        returning * into v_team;

        insert into public.team_members (team_id, user_id, role)
        values (v_team.id, user_id, 'admin');

        -- Create a default pipeline and stages for the new team
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
    else
        -- If a team already exists, just load its data into v_team.
        select * into v_team from public.teams where id = v_team_id;
    end if;

    -- Finally, fetch the user's profile and return the data.
    select * into v_profile from public.profiles where id = user_id;
    return json_build_object('profile', to_json(v_profile), 'team', to_json(v_team));
end;
$$;

import pool from './_lib/db.js';
import { logger } from './_lib/utils/logger.js';

const migrationQuery = `
  -- Extensão para gerar UUIDs se não existir
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

  -- ============================================================
  --   Tabela de Usuários
  -- ============================================================
  CREATE TABLE IF NOT EXISTS public.users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  COMMENT ON TABLE public.users IS 'Tabela para armazenar informações de login dos usuários.';

  -- ============================================================
  --   Tabela de Perfis
  -- ============================================================
  CREATE TABLE IF NOT EXISTS public.profiles (
      id UUID PRIMARY KEY,
      company_name VARCHAR(255),
      dashboard_layout JSONB,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT fk_user FOREIGN KEY(id) REFERENCES public.users(id) ON DELETE CASCADE
  );
  COMMENT ON TABLE public.profiles IS 'Armazena informações de perfil para cada usuário.';

  -- ============================================================
  --   Tabela de Times
  -- ============================================================
  CREATE TABLE IF NOT EXISTS public.teams (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(255) NOT NULL,
      owner_id UUID NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT fk_owner FOREIGN KEY(owner_id) REFERENCES public.users(id) ON DELETE CASCADE
  );
  COMMENT ON TABLE public.teams IS 'Armazena informações sobre as equipes.';

  -- ============================================================
  --   Tabela de Membros do Time
  -- ============================================================
  DO $$
  BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'team_role') THEN
          CREATE TYPE team_role AS ENUM ('admin', 'member');
      END IF;
  END$$;

  CREATE TABLE IF NOT EXISTS public.team_members (
      team_id UUID NOT NULL,
      user_id UUID NOT NULL,
      role team_role DEFAULT 'member',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (team_id, user_id),
      CONSTRAINT fk_team FOREIGN KEY(team_id) REFERENCES public.teams(id) ON DELETE CASCADE,
      CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES public.users(id) ON DELETE CASCADE
  );
  COMMENT ON TABLE public.team_members IS 'Tabela de associação para usuários e equipes.';

  -- ============================================================
  --   Tabela de Pipelines de Vendas
  -- ============================================================
  CREATE TABLE IF NOT EXISTS public.pipelines (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      team_id UUID NOT NULL,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT fk_team FOREIGN KEY(team_id) REFERENCES public.teams(id) ON DELETE CASCADE
  );
  COMMENT ON TABLE public.pipelines IS 'Armazena os pipelines de vendas para cada equipe.';

  -- ============================================================
  --   Tabela de Estágios do Pipeline
  -- ============================================================
  DO $$
  BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stage_type') THEN
          CREATE TYPE stage_type AS ENUM ('Intermediária', 'Ganho', 'Perdido');
      END IF;
  END$$;

  CREATE TABLE IF NOT EXISTS public.pipeline_stages (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      pipeline_id UUID NOT NULL,
      name VARCHAR(255) NOT NULL,
      sort_order INT NOT NULL,
      type stage_type NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT fk_pipeline FOREIGN KEY(pipeline_id) REFERENCES public.pipelines(id) ON DELETE CASCADE
  );
  COMMENT ON TABLE public.pipeline_stages IS 'Armazena os estágios de um pipeline de vendas.';

  -- Adiciona triggers para atualizar 'updated_at' em todas as tabelas
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  -- Lista de tabelas para adicionar o trigger
  DO $$
  DECLARE
      t_name TEXT;
  BEGIN
      FOR t_name IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users', 'profiles', 'teams', 'team_members', 'pipelines', 'pipeline_stages')
      LOOP
          -- Remove o trigger antigo se existir, para evitar duplicação
          EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON %I.%I;', 'public', t_name);
          -- Cria o novo trigger
          EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I.%I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();', 'public', t_name);
      END LOOP;
  END;
  $$;

  -- Adicionar outras tabelas aqui conforme necessário...
`;

const migrate = async () => {
  logger.info('Iniciando migração do banco de dados...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(migrationQuery);
    await client.query('COMMIT');
    logger.info('Migração do banco de dados concluída com sucesso.');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Erro durante a migração do banco de dados:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  } finally {
    client.release();
    // Encerra o pool para que o script possa terminar
    await pool.end();
  }
};

migrate().catch(error => {
  process.exit(1);
});

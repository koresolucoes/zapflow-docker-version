-- Create waba_configs table to store WhatsApp Business Account configurations
CREATE TABLE IF NOT EXISTS public.waba_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    waba_id TEXT NOT NULL,
    phone_number_id TEXT NOT NULL,
    access_token TEXT NOT NULL,
    business_name TEXT,
    business_id TEXT,
    verified_name TEXT,
    account_review_status TEXT,
    message_template_namespace TEXT,
    currency TEXT,
    timezone_id TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT waba_configs_team_id_waba_id_key UNIQUE (team_id, waba_id)
);

-- Enable Row Level Security
ALTER TABLE public.waba_configs ENABLE ROW LEVEL SECURITY;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_waba_configs_team_id ON public.waba_configs(team_id);
CREATE INDEX IF NOT EXISTS idx_waba_configs_waba_id ON public.waba_configs(waba_id);

-- Create RLS policies
CREATE POLICY "Users can view their team's WABA configs"
    ON public.waba_configs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_members.team_id = waba_configs.team_id
            AND team_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Team admins can manage their WABA configs"
    ON public.waba_configs
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_members.team_id = waba_configs.team_id
            AND team_members.user_id = auth.uid()
            AND team_members.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_members.team_id = waba_configs.team_id
            AND team_members.user_id = auth.uid()
            AND team_members.role = 'admin'
        )
    );

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the updated_at column
CREATE TRIGGER update_waba_configs_updated_at
BEFORE UPDATE ON public.waba_configs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add comment to the table
COMMENT ON TABLE public.waba_configs IS 'Stores configurations for WhatsApp Business Accounts (WABA)';

-- Add comments to columns
COMMENT ON COLUMN public.waba_configs.team_id IS 'Reference to the team that owns this WABA configuration';
COMMENT ON COLUMN public.waba_configs.waba_id IS 'WhatsApp Business Account ID from Meta';
COMMENT ON COLUMN public.waba_configs.phone_number_id IS 'WhatsApp Business Phone Number ID';
COMMENT ON COLUMN public.waba_configs.access_token IS 'Access token for the WhatsApp Business API';
COMMENT ON COLUMN public.waba_configs.business_name IS 'Name of the business as registered with Meta';
COMMENT ON COLUMN public.waba_configs.verified_name IS 'Verified business name from Meta';
COMMENT ON COLUMN public.waba_configs.account_review_status IS 'Current status of the WABA review process';
COMMENT ON COLUMN public.waba_configs.is_default IS 'Indicates if this is the default WABA for the team';

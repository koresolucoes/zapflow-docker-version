import type { Node as XyNode, Edge } from '@xyflow/react';
import { MetaTemplateComponent } from '../services/meta/types';

// General JSON type
export type Json = | string | number | boolean | null | { [key: string]: Json } | Json[];

// --- Enums and Literal Types ---
export type Page = 'dashboard' | 'campaigns' | 'templates' | 'template-editor' | 'contacts' | 'new-campaign' | 'profile' | 'settings' | 'auth' | 'campaign-details' | 'automations' | 'automation-editor' | 'funnel' | 'contact-details' | 'inbox' | 'webhook-inspector' | 'metrics' | 'activities' | 'tasks' | 'company-profile';
export type TemplateCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
export type TemplateStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type CampaignStatus = 'Draft' | 'Sending' | 'Sent' | 'Failed';
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed' | 'pending';
export type MessageType = 'inbound' | 'outbound';
export type MessageSource = 'direct' | 'campaign' | 'automation';
export type AutomationStatus = 'active' | 'inactive' | 'draft';
export type AutomationRunStatus = 'running' | 'success' | 'failed';
export type AutomationLogStatus = 'success' | 'failed';
export type CustomFieldType = 'text' | 'number' | 'date';
export type ActivityType = 'NOTA' | 'TAREFA';
export type DealStatus = 'Aberto' | 'Ganho' | 'Perdido';
export type StageType = 'Intermediária' | 'Ganho' | 'Perdido';
export type TeamRole = 'admin' | 'member';

// --- Automation Node Types ---
export type NodeType = 'trigger' | 'action' | 'logic';
export type TriggerType = 'new_contact_with_tag' | 'message_received_with_keyword' | 'button_clicked' | 'new_contact' | 'webhook_received' | 'deal_created' | 'deal_stage_changed';
export type ActionType = 'send_template' | 'add_tag' | 'remove_tag' | 'send_text_message' | 'send_media' | 'send_interactive_message' | 'set_custom_field' | 'send_webhook' | 'create_deal' | 'update_deal_stage';
export type LogicType = 'condition' | 'split_path';

export interface AutomationNodeData {
  [key: string]: any;
  nodeType: NodeType;
  type: TriggerType | ActionType | LogicType;
  label: string;
  config: Json;
}
export type AutomationNode = XyNode<AutomationNodeData, string>;


// --- Manually Defined Table Interfaces (based on migrate.ts) ---

export interface User {
    id: string; // uuid
    email: string;
    password_hash: string;
    created_at: string; // timestamptz
    updated_at: string; // timestamptz
}

export interface Profile {
    id: string; // uuid, FK to users
    company_name?: string | null;
    dashboard_layout?: Json | null;
    updated_at?: string | null; // timestamptz
    created_at?: string | null; // timestamptz
    meta_access_token?: string | null;
    meta_waba_id?: string | null;
    meta_phone_number_id?: string | null;
}

export interface Team {
    id: string; // uuid
    name: string;
    owner_id: string; // uuid, FK to users
    created_at?: string | null; // timestamptz
    updated_at?: string | null; // timestamptz
}

export interface TeamMember {
    team_id: string; // uuid, FK to teams
    user_id: string; // uuid, FK to users
    role?: TeamRole | null;
    created_at?: string | null; // timestamptz
}

export interface Contact {
    id: string; // uuid
    team_id: string; // uuid, FK to teams
    name: string;
    phone: string;
    email?: string | null;
    company?: string | null;
    tags?: string[] | null;
    custom_fields?: Json | null;
    created_at?: string | null; // timestamptz
    updated_at?: string | null; // timestamptz
}

export interface Pipeline {
    id: string; // uuid
    team_id: string; // uuid, FK to teams
    name: string;
    created_at?: string | null; // timestamptz
    updated_at?: string | null; // timestamptz
}

export interface PipelineStage {
    id: string; // uuid
    pipeline_id: string; // uuid, FK to pipelines
    name: string;
    sort_order: number;
    type: StageType;
    created_at?: string | null; // timestamptz
    updated_at?: string | null; // timestamptz
}

export interface Deal {
    id: string; // uuid
    team_id: string; // uuid, FK to teams
    pipeline_id: string; // uuid, FK to pipelines
    stage_id: string; // uuid, FK to pipeline_stages
    contact_id: string; // uuid, FK to contacts
    name: string;
    value?: number | null;
    status: DealStatus;
    closed_at?: string | null; // timestamptz
    created_at?: string | null; // timestamptz
    updated_at?: string | null; // timestamptz
}

export interface MessageTemplate {
    id: string; // uuid
    team_id: string; // uuid, FK to teams
    template_name: string;
    content: string;
    category: TemplateCategory;
    status: TemplateStatus;
    meta_id?: string | null;
    components: MetaTemplateComponent[];
    created_at?: string | null; // timestamptz
}

export interface Message {
    id: string; // uuid
    team_id: string; // uuid, FK to teams
    contact_id: string; // uuid, FK to contacts
    campaign_id?: string | null; // uuid, FK to campaigns
    automation_id?: string | null; // uuid, FK to automations
    content?: string | null;
    meta_message_id?: string | null;
    status: MessageStatus;
    error_message?: string | null;
    source: MessageSource;
    type: MessageType;
    sent_at?: string | null; // timestamptz
    delivered_at?: string | null; // timestamptz
    read_at?: string | null; // timestamptz
    created_at?: string | null; // timestamptz
}

export interface Campaign {
    id: string; // uuid
    team_id: string; // uuid, FK to teams
    name: string;
    message_template_id: string; // uuid, FK to message_templates
    status: CampaignStatus;
    sent_at?: string | null; // timestamptz
    created_at?: string | null; // timestamptz
}

export interface Automation {
    id: string; // uuid
    team_id: string; // uuid, FK to teams
    name: string;
    status: AutomationStatus;
    nodes: AutomationNode[];
    edges: Edge[];
    created_at?: string | null; // timestamptz
}

export interface CustomFieldDefinition {
    id: string; // uuid
    team_id: string; // uuid, FK to teams
    name: string;
    type: CustomFieldType;
    created_at?: string | null; // timestamptz
}

export interface CannedResponse {
    id: string; // uuid
    team_id: string; // uuid, FK to teams
    shortcut: string;
    message: string;
    created_at?: string | null; // timestamptz
}

export interface ContactActivity {
    id: string; // uuid
    team_id: string; // uuid, FK to teams
    contact_id: string; // uuid, FK to contacts
    user_id?: string | null; // uuid, FK to users
    type: ActivityType;
    content: string;
    due_date?: string | null; // timestamptz
    completed_at?: string | null; // timestamptz
    created_at?: string | null; // timestamptz
    updated_at?: string | null; // timestamptz
}

// --- Combined/Custom Interfaces ---

export type DealWithContact = Deal & {
    contacts: Pick<Contact, 'id' | 'name'> | null;
};

export interface UnifiedMessage {
    id: string;
    contact_id: string;
    content: string;
    created_at: string;
    type: MessageType;
    status: MessageStatus;
    source: MessageSource;
    template?: MessageTemplate | null;
    message_template_id: string | null;
    replied_to_message_id: string | null;
    replied_to_message_content?: string | null;
}

export interface Conversation {
    contact: Contact;
    last_message: UnifiedMessage;
    unread_count: number;
    assignee_id: string | null;
    assignee_email: string | null;
}

export interface TimelineEvent {
  id: string;
  type: 'MESSAGE' | 'AUTOMATION_RUN' | 'DEAL_CREATED' | 'NOTE' | 'TASK';
  timestamp: string;
  data: any;
}

export type TaskWithContact = ContactActivity & {
    contacts: { id: string; name: string; } | null;
};

export type TeamMemberWithEmail = {
  team_id: string;
  user_id: string;
  role: TeamRole;
  email: string;
};

export type CampaignWithMetrics = Campaign & {
    recipient_count: number;
    metrics: { sent: number; delivered: number; read: number; failed: number; };
}

export interface MessageWithContact extends Message {
  contacts: Pick<Contact, 'name' | 'phone'> | null;
}

export interface CampaignWithDetails extends Campaign {
  recipient_count: number;
  metrics: { sent: number; delivered: number; read: number; failed: number; };
  messages: MessageWithContact[];
  message_templates: MessageTemplate | null;
}

export interface ContactWithDetails extends Contact {
    deals: Deal[];
}

export interface MetaConfig {
  accessToken: string;
  phoneNumberId: string;
  wabaId: string;
}

// --- Insert/Update Types ---

export type EditableContact = Omit<Contact, 'id' | 'team_id' | 'created_at' | 'updated_at'>;
export type EditableProfile = Omit<Profile, 'id' | 'created_at' | 'updated_at'>;
export type MessageTemplateInsert = Omit<MessageTemplate, 'id' | 'created_at'>;
export type MessageInsert = Omit<Message, 'id' | 'created_at'>;
export type CustomFieldDefinitionInsert = Omit<CustomFieldDefinition, 'id' | 'created_at'>;
export type ContactActivityInsert = Omit<ContactActivity, 'id' | 'created_at' | 'updated_at'>;
export type ContactActivityUpdate = Partial<Omit<ContactActivity, 'id' | 'team_id' | 'contact_id' | 'created_at' | 'updated_at'>>;
export type CannedResponseInsert = Omit<CannedResponse, 'id' | 'created_at'>;
export type AutomationInsert = Omit<Automation, 'id' | 'created_at'>;
export type DealInsert = Omit<Deal, 'id' | 'created_at' | 'updated_at'>;

// Re-export types that might be used elsewhere
export type { Edge, MetaTemplateComponent };

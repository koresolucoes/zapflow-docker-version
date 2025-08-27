import { Json as DbJson, Database, Enums, Tables, TablesInsert, TablesUpdate } from './database.types.js';
import { MetaTemplateComponent } from './meta/types.js';

export type Json = DbJson;
export type { TablesInsert, TablesUpdate };

/**
 * Tipos base para nós de automação
 */
export interface BackendNode<T = any> {
  id: string;
  position: { x: number; y: number };
  data: T;
  type?: string;
  width?: number | null;
  height?: number | null;
  selected?: boolean;
  positionAbsolute?: { x: number; y: number };
  dragging?: boolean;
}

/**
 * Tipos base para conexões entre nós
 */
export interface BackendEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

export type AutomationNode = BackendNode<NodeData>;

// --- String literal unions ---
export type TemplateCategory = Enums<'template_category'>;
export type TemplateStatus = Enums<'template_status'>;
export type AutomationStatus = Enums<'automation_status'>;
export type AutomationRunStatus = 'running' | 'success' | 'failed';
export type NodeType = 'trigger' | 'action' | 'logic';

export type TriggerType = 
  | 'new_contact_with_tag' 
  | 'message_received_with_keyword' 
  | 'button_clicked' 
  | 'new_contact' 
  | 'webhook_received' 
  | 'deal_created' 
  | 'deal_stage_changed';

export type ActionType = 
  | 'send_template' 
  | 'add_tag' 
  | 'remove_tag' 
  | 'send_text_message' 
  | 'send_media' 
  | 'send_interactive_message' 
  | 'set_custom_field' 
  | 'send_webhook' 
  | 'create_deal' 
  | 'update_deal_stage';

export type LogicType = 'condition' | 'split_path';

/**
 * Estrutura de dados para nós de automação
 */
export interface NodeData {
  nodeType: NodeType;
  type: TriggerType | ActionType | LogicType;
  label: string;
  config: Record<string, any>;
}

// --- Tipos de dados do banco ---
/**
 * Perfil de usuário
 */
export type Profile = Database['public']['Tables']['profiles']['Row'];

/**
 * Contato
 */
export type Contact = Database['public']['Tables']['contacts']['Row'];

/**
 * Mensagem
 */
export type Message = Database['public']['Tables']['messages']['Row'];

/**
 * Dados para inserção de mensagem
 */
export type MessageInsert = Database['public']['Tables']['messages']['Insert'];

/**
 * Negócio (deal)
 */
export type Deal = Database['public']['Tables']['deals']['Row'];

/**
 * Modelo de mensagem
 */
export type MessageTemplate = Omit<
  Database['public']['Tables']['message_templates']['Row'], 
  'category' | 'status' | 'components'
> & {
  category: TemplateCategory;
  status: TemplateStatus;
  components: MetaTemplateComponent[];
};

/**
 * Automação
 */
export type Automation = Omit<
  Database['public']['Tables']['automations']['Row'], 
  'nodes' | 'edges' | 'status'
> & {
  nodes: AutomationNode[];
  edges: BackendEdge[];
  status: AutomationStatus;
};

/**
 * Configuração do Meta (Facebook/WhatsApp)
 */
export interface MetaConfig {
  accessToken: string;
  phoneNumberId: string;
  wabaId: string;
}

/**
 * Contexto para execução de ações de automação
 */
export interface ActionContext {
  profile: Profile;
  contact: Contact | null;
  trigger: Json | null;
  node: AutomationNode;
  automationId: string;
  teamId: string;
}

/**
 * Informações de trigger para automação
 */
export interface TriggerInfo {
  automation_id: string;
  node_id: string;
}

/**
 * Membro de equipe
 */
export interface TeamMember {
  team_id: string;
  user_id: string;
  role: 'admin' | 'agent';
}

/**
 * Equipe
 */
export interface Team {
  id: string;
  name: string;
  owner_id: string | null;
  created_at: string;
}

/**
 * Resultado de operação
 */
export interface OperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

/**
 * Opções de paginação
 */
export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Resultado paginado
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

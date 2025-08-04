import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient.js';
import type { Session, User, RealtimeChannel } from '@supabase/supabase-js';
import type { RealtimePostgresChangesPayload } from '@supabase/realtime-js';
import type { 
    Profile, EditableProfile, MetaConfig, Team, TeamMemberWithEmail, Page, MessageTemplate, MessageTemplateInsert, Contact,
    EditableContact, ContactWithDetails, Campaign, CampaignWithMetrics, MessageInsert, CampaignWithDetails, CampaignStatus,
    Automation, AutomationNode, Edge, AutomationNodeStats, AutomationNodeLog, AutomationStatus, Pipeline, PipelineStage,
    DealInsert, DealWithContact, CustomFieldDefinition, CustomFieldDefinitionInsert, CannedResponse, CannedResponseInsert,
    Conversation, UnifiedMessage, Message, ContactActivity, ContactActivityInsert, ContactActivityUpdate, TaskWithContact
} from '../types/index.js';
import { updateProfileInDb } from '../services/profileService.js';
import * as teamService from '../services/teamService.js';
import { createTemplateOnMetaAndDb } from '../services/templateService.js';
import * as contactService from '../services/contactService.js';
import { fetchCampaignDetailsFromDb, addCampaignToDb, deleteCampaignFromDb } from '../services/campaignService.js';
import * as automationService from '../services/automationService.js';
import * as funnelService from '../services/funnelService.js';
import * as customFieldService from '../services/customFieldService.js';
import * as cannedResponseService from '../services/cannedResponseService.js';
import * as inboxService from '../services/inboxService.js';
import * as activityService from '../services/activityService.js';
import { fetchAllInitialData } from '../services/dataService.js';
import type { TablesUpdate } from '../types/database.types.js';
import { useUiStore } from './uiStore.js';
import { triggerAutomation } from '../services/api.js';

interface AuthState {
  // Auth
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isInitialized: boolean;
  activeTeam: Team | null;
  userTeams: Team[];
  allTeamMembers: TeamMemberWithEmail[];
  teamLoading: boolean;
  teamSubscription: RealtimeChannel | null;
  messagesSubscription: RealtimeChannel | null;
  initializeAuth: () => () => void;
  updateProfile: (profileData: EditableProfile) => Promise<void>;
  setActiveTeam: (team: Team) => void;
  clearSubscriptions: () => void;
  
  // Navigation
  currentPage: Page;
  pageParams: Record<string, any>;
  setCurrentPage: (page: Page, params?: Record<string, any>) => void;

  // Data Loading
  dataLoadedForTeam: string | null;
  fetchInitialData: (teamId: string) => Promise<void>;
  clearAllData: () => void;

  // Templates
  templates: MessageTemplate[];
  setTemplates: React.Dispatch<React.SetStateAction<MessageTemplate[]>>;
  createTemplate: (templateData: Omit<MessageTemplateInsert, 'id' | 'team_id' | 'created_at' | 'status' | 'meta_id'>) => Promise<void>;

  // Contacts
  contacts: Contact[];
  allTags: string[];
  contactDetails: ContactWithDetails | null;
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  setContactDetails: React.Dispatch<React.SetStateAction<ContactWithDetails | null>>;
  addContact: (contact: EditableContact) => Promise<void>;
  updateContact: (contact: Contact) => Promise<void>;
  deleteContact: (contactId: string) => Promise<void>;
  importContacts: (newContacts: EditableContact[]) => Promise<{ importedCount: number; skippedCount: number }>;
  fetchContactDetails: (contactId: string) => Promise<void>;
  sendDirectMessages: (message: string, recipients: Contact[]) => Promise<void>;

  // Campaigns
  campaigns: CampaignWithMetrics[];
  campaignDetails: CampaignWithDetails | null;
  setCampaigns: React.Dispatch<React.SetStateAction<CampaignWithMetrics[]>>;
  setCampaignDetails: React.Dispatch<React.SetStateAction<CampaignWithDetails | null>>;
  addCampaign: (campaign: Omit<Campaign, 'id' | 'team_id' | 'created_at' | 'recipient_count'>, messages: Omit<MessageInsert, 'campaign_id' | 'team_id'>[]) => Promise<void>;
  fetchCampaignDetails: (campaignId: string) => Promise<void>;
  deleteCampaign: (campaignId: string) => Promise<void>;

  // Automations
  automations: Automation[];
  setAutomations: React.Dispatch<React.SetStateAction<Automation[]>>;
  automationStats: Record<string, AutomationNodeStats>;
  setAutomationStats: React.Dispatch<React.SetStateAction<Record<string, AutomationNodeStats>>>;
  createAndNavigateToAutomation: () => Promise<void>;
  updateAutomation: (automation: Automation) => Promise<void>;
  deleteAutomation: (automationId: string) => Promise<void>;
  fetchAutomationStats: (automationId: string) => Promise<void>;
  fetchNodeLogs: (automationId: string, nodeId: string) => Promise<AutomationNodeLog[]>;
  
  // Funnel
  pipelines: Pipeline[];
  stages: PipelineStage[];
  deals: DealWithContact[];
  activePipelineId: string | null;
  setPipelines: React.Dispatch<React.SetStateAction<Pipeline[]>>;
  setStages: React.Dispatch<React.SetStateAction<PipelineStage[]>>;
  setDeals: React.Dispatch<React.SetStateAction<DealWithContact[]>>;
  setActivePipelineId: (id: string | null) => void;
  addDeal: (dealData: Omit<DealInsert, 'team_id'>) => Promise<void>;
  updateDeal: (dealId: string, updates: TablesUpdate<'deals'>) => Promise<void>;
  deleteDeal: (dealId: string) => Promise<void>;
  createDefaultPipeline: () => Promise<void>;
  addPipeline: (name: string) => Promise<void>;
  updatePipeline: (id: string, name: string) => Promise<void>;
  deletePipeline: (id: string) => Promise<void>;
  addStage: (pipelineId: string) => Promise<void>;
  updateStage: (id: string, updates: TablesUpdate<'pipeline_stages'>) => Promise<void>;
  deleteStage: (id: string) => Promise<void>;

  // Custom Fields
  definitions: CustomFieldDefinition[];
  setDefinitions: React.Dispatch<React.SetStateAction<CustomFieldDefinition[]>>;
  addDefinition: (definition: Omit<CustomFieldDefinitionInsert, 'team_id' | 'id' | 'created_at'>) => Promise<void>;
  deleteDefinition: (id: string) => Promise<void>;

  // Canned Responses
  responses: CannedResponse[];
  setResponses: React.Dispatch<React.SetStateAction<CannedResponse[]>>;
  addResponse: (response: Omit<CannedResponseInsert, 'team_id' | 'id' | 'created_at'>) => Promise<void>;
  updateResponse: (id: string, updates: TablesUpdate<'canned_responses'>) => Promise<void>;
  deleteResponse: (id: string) => Promise<void>;

  // Inbox
  conversations: Conversation[];
  messages: UnifiedMessage[];
  activeContactId: string | null;
  setActiveContactId: (contactId: string | null) => void;
  sendMessage: (contactId: string, text: string) => Promise<void>;
  assignConversation: (contactId: string, assigneeId: string | null) => Promise<void>;
  deleteConversation: (contactId: string) => Promise<void>;
  inboxLoading: boolean;
  isSending: boolean;
  fetchConversations: () => Promise<void>;
  setMessages: React.Dispatch<React.SetStateAction<UnifiedMessage[]>>;

  // Activities
  activitiesForContact: ContactActivity[];
  todaysTasks: TaskWithContact[];
  activityLoading: boolean;
  fetchActivitiesForContact: (contactId: string) => Promise<void>;
  addActivity: (activityData: Omit<ContactActivityInsert, 'team_id'>) => Promise<ContactActivity | null>;
  updateActivity: (activityId: string, updates: ContactActivityUpdate) => Promise<ContactActivity | null>;
  deleteActivity: (activityId: string) => Promise<void>;
  fetchTodaysTasks: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => {
    
  const _setupSubscriptionsForTeam = (teamId: string) => {
    const user = get().user;
    if (!user) return;
    
    get().clearSubscriptions();

    // Messages subscription
    const messagesChannel = supabase.channel(`team-messages-${teamId}`)
        .on('postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'messages', filter: `team_id=eq.${teamId}` },
            async (payload: RealtimePostgresChangesPayload<Message>) => {
                const newMessage = payload.new as Message;
                await get().fetchConversations();
                if (get().activeContactId === newMessage.contact_id) {
                    const unifiedMessage = inboxService.mapPayloadToUnifiedMessage(newMessage);
                    set(state => ({
                        messages: [...state.messages, unifiedMessage]
                    }));
                }
            }
        ).subscribe();

    // Team Members subscription
    const teamMembersChannel = supabase.channel(`team-members-changes-${teamId}`)
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'team_members', filter: `team_id=eq.${teamId}` },
            async (payload: RealtimePostgresChangesPayload<TeamMemberWithEmail>) => {
                const teamIds = get().userTeams.map(t => t.id);
                if (teamIds.length > 0) {
                    const updatedMembers = await teamService.getTeamMembersForTeams(teamIds);
                    set({ allTeamMembers: updatedMembers });
                }
            }
        ).subscribe();

    set({ messagesSubscription: messagesChannel, teamSubscription: teamMembersChannel });
  };

  return {
  // Auth
  session: null,
  user: null,
  profile: null,
  loading: true,
  isInitialized: false,
  activeTeam: null,
  userTeams: [],
  allTeamMembers: [],
  teamLoading: true,
  teamSubscription: null,
  messagesSubscription: null,
  
  clearSubscriptions: () => {
    const { teamSubscription, messagesSubscription } = get();
    if (teamSubscription) {
        supabase.removeChannel(teamSubscription);
    }
    if (messagesSubscription) {
        supabase.removeChannel(messagesSubscription);
    }
    set({ teamSubscription: null, messagesSubscription: null });
  },

  initializeAuth: () => {
    if (get().isInitialized) return () => {};

    const handleSession = async (session: Session | null) => {
        const isRefresh = !!get().session && !!session && get().session?.user.id === session.user.id;

        const user = session?.user ?? null;
        set({ session, user });

        if (user) {
            if (!isRefresh) {
                set({ loading: true, teamLoading: true });
            } else {
                set({ teamLoading: true });
            }
            
            try {
                console.log('Initializing user session for:', user.email);
                
                // First, try to get user teams and profile
                console.log('Fetching user teams and profile...');
                let { data: userData, error: userError } = await supabase.rpc('get_user_teams_and_profile');
                
                // If user data is not found, it's a new user - run setup
                if (userError || !userData) {
                    console.log('No user data found, setting up new user...');
                    const { data: setupData, error: setupError } = await supabase.rpc('setup_new_user', {
                        user_id: user.id,
                        user_email: user.email
                    });

                    if (setupError) {
                        console.error('Error setting up new user:', setupError);
                        throw setupError;
                    }
                    console.log('New user setup complete:', setupData);

                    // After setup, fetch the user data again
                    const { data: refetchData, error: refetchError } = await supabase.rpc('get_user_teams_and_profile');
                    
                    if (refetchError) {
                        console.error('Error fetching user data after setup:', refetchError);
                        throw refetchError;
                    }
                    
                    userData = refetchData;
                }

                // Parse the response
                const { profile: profileData, teams: teamsData } = userData as { 
                    profile: Profile | null, 
                    teams: Team[] | null 
                };
                
                if (!profileData) {
                    throw new Error('Failed to load user profile');
                }

                // Sort teams by creation date
                const teams = (teamsData || []).sort((a, b) => 
                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );

                // Set active team (first team by default)
                const activeTeam = teams.length > 0 ? teams[0] : null;

                // Update state
                set({
                    profile: profileData,
                    userTeams: teams,
                    activeTeam,
                    loading: false,
                    teamLoading: false
                });

                console.log('User session initialized successfully');
                
                // Load initial data if we have an active team
                if (activeTeam) {
                    console.log('Loading initial data for team:', activeTeam.id);
                    get().fetchInitialData(activeTeam.id);
                }

            } catch (error) {
                console.error("Error initializing user session:", error);
                set({ loading: false, teamLoading: false });
                return;
            }

        } else {
            get().clearAllData();
            set({ session: null, user: null, profile: null, activeTeam: null, userTeams: [], allTeamMembers: [], loading: false, teamLoading: false, dataLoadedForTeam: null });
            get().clearSubscriptions();
        }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: Session | null) => {
      if (event === 'SIGNED_OUT') {
        handleSession(null);
      } else if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED')) {
        handleSession(session);
      }
    });

    set({ isInitialized: true });
    
    return () => {
      subscription?.unsubscribe();
      get().clearSubscriptions();
    };
  },
  
  updateProfile: async (profileData: EditableProfile) => {
    if (!get().user) throw new Error("Usuário não autenticado.");
    const { addToast } = useUiStore.getState();
    try {
      const updatedProfile = await updateProfileInDb(get().user!.id, profileData);
      set({ profile: updatedProfile });
      addToast('Perfil salvo com sucesso!', 'success');
    } catch (error: any) {
      addToast(`Erro ao salvar perfil: ${error.message}`, 'error');
      throw error;
    }
  },

  setActiveTeam: (team: Team) => {
    if (get().activeTeam?.id === team.id) return;
    set({ activeTeam: team, dataLoadedForTeam: null, activeContactId: null, messages: [] });
    _setupSubscriptionsForTeam(team.id);
  },

  // Navigation
  currentPage: 'dashboard',
  pageParams: {},
  setCurrentPage: (page: Page, params?: Record<string, any>) => {
    set({ currentPage: page, pageParams: params });
  },

  // Data Loading
  dataLoadedForTeam: null,
  fetchInitialData: async (teamId: string) => {
    try {
      const data = await fetchAllInitialData(teamId);
      set({
        templates: data.templates,
        contacts: data.contacts,
        allTags: [...new Set(data.contacts.flatMap(c => c.tags || []))] as string[],
        campaigns: data.campaigns,
        automations: data.automations,
        pipelines: data.pipelines,
        stages: data.stages,
        deals: data.deals,
        activePipelineId: data.pipelines[0]?.id || null,
        definitions: data.definitions,
        responses: data.responses,
        dataLoadedForTeam: teamId,
      });
      get().fetchTodaysTasks();
      get().fetchConversations();
    } catch (error) {
      console.error("Failed to fetch initial data for team:", teamId, error);
      useUiStore.getState().addToast(`Falha ao carregar dados da equipe: ${(error as Error).message}`, 'error');
    }
  },
  
  clearAllData: () => {
    set({
      templates: [],
      contacts: [],
      allTags: [],
      campaigns: [],
      automations: [],
      pipelines: [],
      stages: [],
      deals: [],
      activePipelineId: null,
      definitions: [],
      responses: [],
      conversations: [],
      messages: [],
      todaysTasks: [],
    });
  },

  // Templates
  templates: [],
  setTemplates: (updater) => set(state => ({ templates: typeof updater === 'function' ? updater(state.templates) : updater })),
  createTemplate: async (templateData: Omit<MessageTemplateInsert, 'id' | 'team_id' | 'created_at' | 'status' | 'meta_id'>) => {
    const metaConfig = useMetaConfig.getState();
    const teamId = get().activeTeam?.id;
    if (!teamId) throw new Error("Nenhuma equipe ativa selecionada.");
    const newTemplate = await createTemplateOnMetaAndDb(metaConfig, templateData, teamId);
    set(state => ({ templates: [newTemplate, ...state.templates] }));
  },
  
  // Contacts
  contacts: [],
  allTags: [],
  contactDetails: null,
  setContacts: (updater) => set(state => ({ contacts: typeof updater === 'function' ? updater(state.contacts) : updater })),
  setContactDetails: (updater) => set(state => ({ contactDetails: typeof updater === 'function' ? updater(state.contactDetails) : updater })),
  addContact: async (contact: EditableContact) => {
    const { activeTeam, user } = get();
    const teamId = activeTeam?.id;
    if (!teamId || !user) throw new Error("Nenhuma equipe ativa ou usuário selecionado.");
    
    const newContact = await contactService.addContactToDb(teamId, contact);
    
    set(state => ({
      contacts: [newContact, ...state.contacts],
      allTags: [...new Set([...state.allTags, ...(newContact.tags || [])])] as string[]
    }));

    // Fire and forget automation trigger
    triggerAutomation('contact_created', user.id, newContact.id);
  },
  updateContact: async (contact: Contact) => {
    const { activeTeam, user, contacts } = get();
    const teamId = activeTeam?.id;
    if (!teamId || !user) throw new Error("Nenhuma equipe ativa ou usuário selecionado.");

    const originalContact = contacts.find(c => c.id === contact.id);
    const originalTags = new Set(originalContact?.tags || []);
    
    const updatedContact = await contactService.updateContactInDb(teamId, contact);

    const newTags = new Set((updatedContact.tags as string[]) || []);
    const addedTags = [...newTags].filter(tag => !originalTags.has(tag));

    set(state => {
        const newContacts = state.contacts.map(c => c.id === updatedContact.id ? updatedContact : c);
        const newAllTags = [...new Set(newContacts.flatMap(c => c.tags || []))] as string[];
        const updatedContactDetails = state.contactDetails?.id === updatedContact.id
            ? { ...state.contactDetails, ...updatedContact }
            : state.contactDetails;
        return {
            contacts: newContacts,
            allTags: newAllTags,
            contactDetails: updatedContactDetails
        };
    });

    // Fire automation trigger for added tags
    if (addedTags.length > 0) {
        triggerAutomation('tags_added', user.id, updatedContact.id, { added_tags: addedTags });
    }
  },
  deleteContact: async (contactId: string) => {
    const teamId = get().activeTeam?.id;
    if (!teamId) throw new Error("Nenhuma equipe ativa selecionada.");
    await contactService.deleteContactFromDb(teamId, contactId);
    set(state => ({
      contacts: state.contacts.filter(c => c.id !== contactId),
    }));
  },
  importContacts: async (newContacts: EditableContact[]) => {
    const teamId = get().activeTeam?.id;
    if (!teamId) throw new Error("Nenhuma equipe ativa selecionada.");
    const existingPhones: Set<string> = new Set(get().contacts.map(c => c.phone));
    const { imported, skippedCount } = await contactService.importContactsToDb(teamId, newContacts, existingPhones);
    set(state => ({
      contacts: [...imported, ...state.contacts],
      allTags: [...new Set([...state.allTags, ...imported.flatMap(c => c.tags || [])])] as string[]
    }));
    return { importedCount: imported.length, skippedCount };
  },
  fetchContactDetails: async (contactId: string) => {
    const teamId = get().activeTeam?.id;
    if (!teamId) throw new Error("Nenhuma equipe ativa selecionada.");
    try {
      const details = await contactService.fetchContactDetailsFromDb(teamId, contactId);
      set({ contactDetails: details });
    } catch (error) {
      console.error("Failed to fetch contact details", error);
    }
  },
  sendDirectMessages: async (message: string, recipients: Contact[]) => {
    const metaConfig = useMetaConfig.getState();
    const teamId = get().activeTeam?.id;
    if (!teamId) throw new Error("Nenhuma equipe ativa selecionada.");
    await contactService.sendDirectMessagesFromApi(metaConfig, teamId, message, recipients);
    // Realtime should handle message updates.
  },

  // Campaigns
  campaigns: [],
  campaignDetails: null,
  setCampaigns: (updater) => set(state => ({ campaigns: typeof updater === 'function' ? updater(state.campaigns) : updater })),
  setCampaignDetails: (updater) => set(state => ({ campaignDetails: typeof updater === 'function' ? updater(state.campaignDetails) : updater })),
  addCampaign: async (campaign: Omit<Campaign, 'id' | 'team_id' | 'created_at' | 'recipient_count'>, messages: Omit<MessageInsert, 'campaign_id' | 'team_id'>[]) => {
    const teamId = get().activeTeam?.id;
    if (!teamId) throw new Error("Nenhuma equipe ativa selecionada.");
    const newCampaign = await addCampaignToDb(teamId, campaign, messages);
    const newCampaignWithMetrics: CampaignWithMetrics = {
        ...newCampaign,
        metrics: {
            sent: messages.filter(m => m.status === 'sent').length,
            delivered: 0,
            read: 0,
            failed: messages.filter(m => m.status === 'failed').length,
        }
    };
    set(state => ({ campaigns: [newCampaignWithMetrics, ...state.campaigns] }));
  },
  fetchCampaignDetails: async (campaignId: string) => {
    const teamId = get().activeTeam?.id;
    if (!teamId) throw new Error("Nenhuma equipe ativa selecionada.");
    const details = await fetchCampaignDetailsFromDb(teamId, campaignId);
    set({ campaignDetails: details });
  },
  deleteCampaign: async (campaignId: string) => {
    const teamId = get().activeTeam?.id;
    if (!teamId) throw new Error("Nenhuma equipe ativa selecionada.");
    await deleteCampaignFromDb(teamId, campaignId);
    set(state => ({ campaigns: state.campaigns.filter(c => (c as Campaign).id !== campaignId) }));
  },

  // Automations
  automations: [],
  setAutomations: (updater) => set(state => ({ automations: typeof updater === 'function' ? updater(state.automations) : updater })),
  automationStats: {},
  setAutomationStats: (updater) => set(state => ({ automationStats: typeof updater === 'function' ? updater(state.automationStats) : updater })),
  createAndNavigateToAutomation: async () => {
    const teamId = get().activeTeam?.id;
    if (!teamId) throw new Error("Nenhuma equipe ativa selecionada.");
    const newAutomation = await automationService.createAutomationInDb(teamId);
    set(state => ({ automations: [newAutomation, ...state.automations] }));
    get().setCurrentPage('automation-editor', { automationId: newAutomation.id });
  },
  updateAutomation: async (automation: Automation) => {
    const teamId = get().activeTeam?.id;
    if (!teamId) throw new Error("Nenhuma equipe ativa selecionada.");
    const updatedAutomation = await automationService.updateAutomationInDb(teamId, automation);
    set(state => ({
      automations: state.automations.map(a => a.id === updatedAutomation.id ? updatedAutomation : a)
    }));
  },
  deleteAutomation: async (automationId: string) => {
    const teamId = get().activeTeam?.id;
    if (!teamId) throw new Error("Nenhuma equipe ativa selecionada.");
    await automationService.deleteAutomationFromDb(automationId, teamId);
    set(state => ({ automations: state.automations.filter(a => a.id !== automationId) }));
  },
  fetchAutomationStats: async (automationId: string) => {
    const stats = await automationService.fetchStatsForAutomation(automationId);
    set({ automationStats: stats });
  },
  fetchNodeLogs: async (automationId: string, nodeId: string) => {
    return await automationService.fetchLogsForNode(automationId, nodeId);
  },

  // Funnel
  pipelines: [],
  stages: [],
  deals: [],
  activePipelineId: null,
  setPipelines: (updater) => set(state => ({ pipelines: typeof updater === 'function' ? updater(state.pipelines) : updater })),
  setStages: (updater) => set(state => ({ stages: typeof updater === 'function' ? updater(state.stages) : updater })),
  setDeals: (updater) => set(state => ({ deals: typeof updater === 'function' ? updater(state.deals) : updater })),
  setActivePipelineId: (id: string | null) => set({ activePipelineId: id }),
  addDeal: async (dealData: Omit<DealInsert, 'team_id'>) => {
    const { activeTeam, user } = get();
    const teamId = activeTeam?.id;
    if (!teamId || !user) throw new Error("Nenhuma equipe ativa ou usuário selecionado.");
    
    const newDeal = await funnelService.addDealToDb({ ...dealData, team_id: teamId });
    
    set(state => ({ deals: [newDeal, ...state.deals] }));

    // Fire and forget automation trigger
    triggerAutomation('deal_created', user.id, newDeal.contact_id, { deal: newDeal });
  },
  updateDeal: async (dealId: string, updates: TablesUpdate<'deals'>) => {
    const { activeTeam, user, deals } = get();
    const teamId = activeTeam?.id;
    if (!teamId || !user) throw new Error("Nenhuma equipe ativa ou usuário selecionado.");

    const originalDeal = deals.find(d => d.id === dealId);
    
    const updatedDeal = await funnelService.updateDealInDb(dealId, teamId, updates);

    set(state => ({
      deals: state.deals.map(d => d.id === dealId ? updatedDeal : d)
    }));
    
    // Fire automation trigger if stage changed
    if (updates.stage_id && originalDeal && originalDeal.stage_id !== updates.stage_id) {
      triggerAutomation(
        'deal_stage_changed', 
        user.id, 
        updatedDeal.contact_id,
        { 
          deal: updatedDeal, 
          new_stage_id: updates.stage_id 
        }
      );
    }
  },
  deleteDeal: async (dealId: string) => {
    const teamId = get().activeTeam?.id;
    if (!teamId) throw new Error("Nenhuma equipe ativa selecionada.");
    await funnelService.deleteDealFromDb(dealId, teamId);
    set(state => ({ deals: state.deals.filter(d => d.id !== dealId) }));
  },
  createDefaultPipeline: async () => {
    const teamId = get().activeTeam?.id;
    if (!teamId) throw new Error("Nenhuma equipe ativa selecionada.");
    const { pipeline, stages } = await funnelService.createDefaultPipelineInDb(teamId);
    set(state => ({
      pipelines: [...state.pipelines, pipeline],
      stages: [...state.stages, ...stages],
      activePipelineId: pipeline.id,
    }));
  },
  addPipeline: async (name: string) => {
    const teamId = get().activeTeam?.id;
    if (!teamId) throw new Error("Nenhuma equipe ativa selecionada.");
    const { pipeline, stage } = await funnelService.addPipelineToDb(teamId, name);
    set(state => ({
      pipelines: [...state.pipelines, pipeline],
      stages: [...state.stages, stage]
    }));
  },
  updatePipeline: async (id: string, name: string) => {
    const teamId = get().activeTeam?.id;
    if (!teamId) throw new Error("Nenhuma equipe ativa selecionada.");
    const updated = await funnelService.updatePipelineInDb(id, teamId, name);
    set(state => ({ pipelines: state.pipelines.map(p => p.id === id ? updated : p) }));
  },
  deletePipeline: async (id: string) => {
    const teamId = get().activeTeam?.id;
    if (!teamId) throw new Error("Nenhuma equipe ativa selecionada.");
    await funnelService.deletePipelineFromDb(id, teamId);
    set(state => ({
      pipelines: state.pipelines.filter(p => p.id !== id),
      stages: state.stages.filter(s => s.pipeline_id !== id),
      deals: state.deals.filter(d => d.pipeline_id !== id),
      activePipelineId: state.activePipelineId === id ? (state.pipelines[0]?.id || null) : state.activePipelineId,
    }));
  },
  addStage: async (pipelineId: string) => {
    const existingStages = get().stages.filter(s => s.pipeline_id === pipelineId);
    const maxSortOrder = Math.max(-1, ...existingStages.map(s => s.sort_order));
    const newStage = await funnelService.addStageToDb(pipelineId, maxSortOrder + 1);
    set(state => ({ stages: [...state.stages, newStage] }));
  },
  updateStage: async (id: string, updates: TablesUpdate<'pipeline_stages'>) => {
    const updated = await funnelService.updateStageInDb(id, updates);
    set(state => ({ stages: state.stages.map(s => s.id === id ? updated : s) }));
  },
  deleteStage: async (id: string) => {
    await funnelService.deleteStageFromDb(id);
    set(state => ({ stages: state.stages.filter(s => s.id !== id) }));
  },

  // Custom Fields
  definitions: [],
  setDefinitions: (updater) => set(state => ({ definitions: typeof updater === 'function' ? updater(state.definitions) : updater })),
  addDefinition: async (definition: Omit<CustomFieldDefinitionInsert, 'team_id' | 'id' | 'created_at'>) => {
    const teamId = get().activeTeam?.id;
    if (!teamId) throw new Error("Nenhuma equipe ativa selecionada.");
    const newDef = await customFieldService.addCustomFieldDefinition(teamId, definition);
    set(state => ({ definitions: [...state.definitions, newDef] }));
  },
  deleteDefinition: async (id: string) => {
    const teamId = get().activeTeam?.id;
    if (!teamId) throw new Error("Nenhuma equipe ativa selecionada.");
    await customFieldService.deleteCustomFieldDefinition(id, teamId);
    set(state => ({ definitions: state.definitions.filter(d => d.id !== id) }));
  },
  
  // Canned Responses
  responses: [],
  setResponses: (updater) => set(state => ({ responses: typeof updater === 'function' ? updater(state.responses) : updater })),
  addResponse: async (response: Omit<CannedResponseInsert, 'team_id' | 'id' | 'created_at'>) => {
    const teamId = get().activeTeam?.id;
    if (!teamId) throw new Error("Nenhuma equipe ativa selecionada.");
    const newRes = await cannedResponseService.addCannedResponse(teamId, response);
    set(state => ({ responses: [...state.responses, newRes].sort((a,b) => a.shortcut.localeCompare(b.shortcut)) }));
  },
  updateResponse: async (id: string, updates: TablesUpdate<'canned_responses'>) => {
    const teamId = get().activeTeam?.id;
    if (!teamId) throw new Error("Nenhuma equipe ativa selecionada.");
    const updatedRes = await cannedResponseService.updateCannedResponse(id, teamId, updates);
    set(state => ({
      responses: state.responses.map(r => r.id === id ? updatedRes : r).sort((a,b) => a.shortcut.localeCompare(b.shortcut))
    }));
  },
  deleteResponse: async (id: string) => {
    const teamId = get().activeTeam?.id;
    if (!teamId) throw new Error("Nenhuma equipe ativa selecionada.");
    await cannedResponseService.deleteCannedResponse(id, teamId);
    set(state => ({ responses: state.responses.filter(r => r.id !== id) }));
  },

  // Inbox
  conversations: [],
  messages: [],
  activeContactId: null,
  inboxLoading: false,
  isSending: false,
  setMessages: (updater) => set(state => ({ messages: typeof updater === 'function' ? updater(state.messages) : updater })),
  fetchConversations: async () => {
    const teamId = get().activeTeam?.id;
    if (!teamId) return;
    set({ inboxLoading: true });
    try {
      const convos = await inboxService.fetchConversationsFromDb(teamId);
      const membersMap = new Map(get().allTeamMembers.map(m => [m.user_id, m.email]));
      
      const convosWithEmail = convos.map(c => ({
          ...c,
          assignee_email: c.assignee_id ? membersMap.get(c.assignee_id) || null : null
      }));

      set({ conversations: convosWithEmail });
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      set({ inboxLoading: false });
    }
  },
  setActiveContactId: async (contactId: string | null) => {
    const teamId = get().activeTeam?.id;
    if (!teamId) return;
    
    // Clear old messages and set loading state
    set({ activeContactId: contactId, messages: [], inboxLoading: true });

    if (!contactId) {
      set({ inboxLoading: false });
      return;
    }

    try {
        const messages = await inboxService.fetchMessagesFromDb(teamId, contactId);
        set({ messages });

        // Update unread count locally for immediate UI feedback
        set(state => ({
          conversations: state.conversations.map(c => 
            c.contact.id === contactId ? { ...c, unread_count: 0 } : c
          )
        }));

    } catch (error) {
        console.error("Failed to fetch messages for active contact:", error);
    } finally {
        set({ inboxLoading: false });
    }
  },
  sendMessage: async (contactId: string, text: string) => {
    const teamId = get().activeTeam?.id;
    const contact = get().contacts.find(c => c.id === contactId);
    const metaConfig = useMetaConfig.getState();
    if (!teamId || !contact) throw new Error("Contexto inválido para enviar mensagem.");

    set({ isSending: true });
    try {
        const tempId = `temp_${Date.now()}`;
        const pendingMessage: UnifiedMessage = {
            id: tempId,
            contact_id: contactId,
            content: text,
            created_at: new Date().toISOString(),
            type: 'outbound',
            status: 'pending',
            source: 'direct',
            message_template_id: null,
            replied_to_message_id: null,
        };
        set(state => ({ messages: [...state.messages, pendingMessage] }));

        const sentMessage = await inboxService.sendMessageToApi(teamId, contact, text, metaConfig);
        const finalMessage = inboxService.mapPayloadToUnifiedMessage(sentMessage);

        set(state => ({
            messages: state.messages.map(m => m.id === tempId ? finalMessage : m)
        }));

    } catch (error) {
        console.error("Failed to send message:", error);
        set(state => ({
            messages: state.messages.map(m => m.id.startsWith('temp_') ? { ...m, status: 'failed' } : m)
        }));
        throw error;
    } finally {
        set({ isSending: false });
    }
  },
  assignConversation: async (contactId: string, assigneeId: string | null) => {
    await inboxService.assignConversation(contactId, assigneeId);
    set(state => {
        const membersMap = new Map(state.allTeamMembers.map(m => [m.user_id, m.email]));
        const assigneeEmail = assigneeId ? membersMap.get(assigneeId) || null : null;
        return {
            conversations: state.conversations.map(c => 
                c.contact.id === contactId ? { ...c, assignee_id: assigneeId, assignee_email: assigneeEmail } : c
            )
        };
    });
  },
  deleteConversation: async (contactId: string) => {
    await inboxService.deleteConversation(contactId);
    set(state => ({
      conversations: state.conversations.filter(c => c.contact.id !== contactId),
      activeContactId: state.activeContactId === contactId ? null : state.activeContactId,
      messages: state.activeContactId === contactId ? [] : state.messages
    }));
  },

  // Activities
  activitiesForContact: [],
  todaysTasks: [],
  activityLoading: false,
  fetchActivitiesForContact: async (contactId: string) => {
    const teamId = get().activeTeam?.id;
    if (!teamId) return;
    set({ activityLoading: true });
    try {
      const activities = await activityService.fetchActivitiesForContact(teamId, contactId);
      set({ activitiesForContact: activities });
    } finally {
      set({ activityLoading: false });
    }
  },
  addActivity: async (activityData: Omit<ContactActivityInsert, 'team_id'>) => {
    const teamId = get().activeTeam?.id;
    if (!teamId) return null;
    const newActivity = await activityService.addActivity({ ...activityData, team_id: teamId });
    get().fetchActivitiesForContact(activityData.contact_id); // Re-fetch for consistency
    get().fetchTodaysTasks(); // Refresh dashboard tasks
    return newActivity;
  },
  updateActivity: async (activityId: string, updates: ContactActivityUpdate) => {
    const teamId = get().activeTeam?.id;
    if (!teamId) return null;
    const updatedActivity = await activityService.updateActivity(activityId, teamId, updates);
    get().fetchActivitiesForContact(updatedActivity.contact_id); // Re-fetch
    get().fetchTodaysTasks(); // Refresh dashboard tasks
    return updatedActivity;
  },
  deleteActivity: async (activityId: string) => {
    const teamId = get().activeTeam?.id;
    if (!teamId) return;
    await activityService.deleteActivity(activityId, teamId);
    // Re-fetching will be handled by the component that calls this
  },
  fetchTodaysTasks: async () => {
    const teamId = get().activeTeam?.id;
    if (!teamId) return;
    const tasks = await activityService.fetchTodaysTasks(teamId);
    set({ todaysTasks: tasks });
  },
}});

export const useMetaConfig = create<MetaConfig>(() => ({
  accessToken: '',
  wabaId: '',
  phoneNumberId: '',
}));

// Sincroniza as credenciais da Meta do perfil principal para o store dedicado
useAuthStore.subscribe(
  (state, previousState) => {
    // Only run if the profile object itself has changed instance
    if (state.profile !== previousState.profile) {
      const profile = state.profile;
      if (profile) {
        useMetaConfig.setState({
          accessToken: profile.meta_access_token || '',
          wabaId: profile.meta_waba_id || '',
          phoneNumberId: profile.meta_phone_number_id || '',
        });
      } else {
        // Clear meta config if profile is null (e.g., on logout)
        useMetaConfig.setState({
          accessToken: '',
          wabaId: '',
          phoneNumberId: '',
        });
      }
    }
  }
);
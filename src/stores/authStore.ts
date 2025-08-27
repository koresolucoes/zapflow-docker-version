import { create } from 'zustand';
import { apiGet, apiPost } from '../lib/apiClient';
import type { 
    Profile, EditableProfile, Team, TeamMemberWithEmail, Page, MessageTemplate, MessageTemplateInsert, Contact,
    EditableContact, ContactWithDetails, Campaign, CampaignWithMetrics, MessageInsert, CampaignWithDetails,
    Automation, Pipeline, PipelineStage, DealInsert, DealWithContact, CustomFieldDefinition,
    CustomFieldDefinitionInsert, CannedResponse, CannedResponseInsert, Conversation, UnifiedMessage,
    Message, ContactActivity, ContactActivityInsert, ContactActivityUpdate, TaskWithContact
} from '../types/index.js';
import { updateProfileInDb } from '../services/profileService.js';
import { fetchAllInitialData } from '../services/dataService.js';
import type { TablesUpdate } from '../types/database.types.js';
import { useUiStore } from './uiStore.js';

// Representa o objeto de usuário que recebemos da nossa API
interface ApiUser {
  id: string;
  email: string;
  profile: Profile;
}

// Representa a resposta do endpoint /api/auth/me
interface MeResponse {
    user: {
        id: string;
        email: string;
        created_at: string;
        company_name: string;
        dashboard_layout: any;
    };
    teams: Team[];
}

interface AuthState {
  // Auth
  token: string | null;
  user: ApiUser | null;
  profile: Profile | null;
  loading: boolean;
  isInitialized: boolean;
  activeTeam: Team | null;
  userTeams: Team[];

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, companyName: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateProfile: (profileData: EditableProfile) => Promise<void>;
  setActiveTeam: (team: Team) => void;
  
  // Navigation
  currentPage: Page;
  pageParams: Record<string, any>;
  setCurrentPage: (page: Page, params?: Record<string, any>) => void;

  // Data Loading
  dataLoadedForTeam: string | null;
  fetchInitialData: (teamId: string) => Promise<void>;
  clearAllData: () => void;

  // Other states...
  contacts: Contact[];
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Auth State
  token: null,
  user: null,
  profile: null,
  loading: true,
  isInitialized: false,
  activeTeam: null,
  userTeams: [],

  // Auth Actions
  login: async (email, password) => {
    try {
      set({ loading: true });
      const { token, user } = await apiPost<{ token: string; user: ApiUser }>('/auth/login', { email, password });

      localStorage.setItem('authToken', token);
      set({ token, user, profile: user.profile, loading: false });

      await get().checkAuth();

    } catch (error) {
      console.error("Login failed:", error);
      set({ loading: false });
      throw error;
    }
  },

  register: async (email, password, companyName) => {
    await apiPost('/auth/register', { email, password, company_name: companyName });
  },

  logout: () => {
    localStorage.removeItem('authToken');
    get().clearAllData();
    set({
      token: null,
      user: null,
      profile: null,
      activeTeam: null,
      userTeams: [],
      dataLoadedForTeam: null,
      loading: false,
    });
  },

  checkAuth: async () => {
    if (get().isInitialized) {
        set({ loading: false });
        return;
    }

    const token = localStorage.getItem('authToken');
    if (token) {
      set({ token, loading: true });
      try {
        const { user, teams } = await apiGet<MeResponse>('/auth/me');

        const apiUser: ApiUser = {
            id: user.id,
            email: user.email,
            profile: {
                id: user.id,
                company_name: user.company_name,
                dashboard_layout: user.dashboard_layout,
                created_at: user.created_at,
            }
        };

        const sortedTeams = teams.sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        const activeTeam = sortedTeams.length > 0 ? sortedTeams[0] : null;

        set({
          user: apiUser,
          profile: apiUser.profile,
          userTeams: sortedTeams,
          activeTeam,
        });

        if (activeTeam) {
          get().fetchInitialData(activeTeam.id);
        }

      } catch (error) {
        console.error("Token validation failed:", error);
        get().logout();
      } finally {
        set({ loading: false, isInitialized: true });
      }
    } else {
      set({ loading: false, isInitialized: true });
    }
  },

  updateProfile: async (profileData: EditableProfile) => {
    if (!get().user) throw new Error("User not authenticated.");
    const { addToast } = useUiStore.getState();
    try {
      const updatedProfile = await updateProfileInDb(get().user!.id, profileData);
      set({ profile: updatedProfile });
      addToast('Profile saved successfully!', 'success');
    } catch (error: any) {
      addToast(`Error saving profile: ${error.message}`, 'error');
      throw error;
    }
  },

  setActiveTeam: (team: Team) => {
    if (get().activeTeam?.id === team.id) return;
    set({ activeTeam: team, dataLoadedForTeam: null });
    if(team.id) get().fetchInitialData(team.id);
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
        contacts: data.contacts,
        dataLoadedForTeam: teamId,
      });
    } catch (error) {
      console.error("Failed to fetch initial data for team:", teamId, error);
      useUiStore.getState().addToast(`Failed to load team data: ${(error as Error).message}`, 'error');
    }
  },
  
  clearAllData: () => {
    set({
      contacts: [],
    });
  },

  // Other states
  contacts: [],
  setContacts: (updater) => set(state => ({ contacts: typeof updater === 'function' ? updater(state.contacts) : updater })),
}));

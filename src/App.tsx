import React, { Suspense, lazy, useEffect } from 'react';
import './index.css';
import { useAuthStore } from './stores/authStore.js';
import { useUiStore } from './stores/uiStore.js';
import MainLayout from './components/layout/MainLayout.js';
import { ToastContainer } from './components/common/Toast.js';
import ConfirmationModal from './components/common/ConfirmationModal.js';

const Auth = lazy(() => import('./pages/Auth/Auth.js'));
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard.js'));
const Campaigns = lazy(() => import('./pages/Campaigns/Campaigns.js'));
const CampaignDetails = lazy(() => import('./pages/CampaignDetails/CampaignDetails.js'));
const Templates = lazy(() => import('./pages/Templates/Templates.js'));
const TemplateEditor = lazy(() => import('./pages/TemplateEditor/TemplateEditor.js'));
const Contacts = lazy(() => import('./pages/Contacts/Contacts.js'));
const ContactDetails = lazy(() => import('./pages/ContactDetails/ContactDetails.js'));
const Funnel = lazy(() => import('./pages/Funnel/Funnel.js'));
const NewCampaign = lazy(() => import('./pages/NewCampaign/NewCampaign.js'));
const CompanyProfile = lazy(() => import('./pages/Profile/CompanyProfile.js'));
const Settings = lazy(() => import('./pages/Settings/Settings.js'));
const Automations = lazy(() => import('./pages/Automations/Automations.js'));
const AutomationEditor = lazy(() => import('./pages/AutomationEditor/AutomationEditor.js'));
const Inbox = lazy(() => import('./pages/Inbox/Inbox.js'));
const WebhookInspector = lazy(() => import('./pages/WebhookInspector/WebhookInspector.js'));

const PageSuspenseFallback = () => (
    <div className="flex items-center justify-center w-full h-full p-10">
        <svg className="animate-spin h-8 w-8 text-gray-500 dark:text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
);

const FullPageSuspenseFallback = () => (
    <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-slate-900">
        <PageSuspenseFallback />
    </div>
);

const App: React.FC = () => {
  const { 
    session, 
    loading, 
    currentPage, 
    activeTeam, 
    fetchInitialData, 
    dataLoadedForTeam, 
    clearAllData,
    initializeAuth,
  } = useAuthStore();
  const { setTheme } = useUiStore();

  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => {
      unsubscribe();
    };
  }, [initializeAuth]);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (storedTheme === 'dark' || (!storedTheme && systemPrefersDark)) {
        setTheme('dark');
    } else {
        setTheme('light');
    }
  }, [setTheme]);

  useEffect(() => {
    if (activeTeam && activeTeam.id !== dataLoadedForTeam) {
        console.log(`Team changed to ${activeTeam.name}. Fetching new data.`);
        clearAllData();
        fetchInitialData(activeTeam.id);
    }
  }, [activeTeam, dataLoadedForTeam, fetchInitialData, clearAllData]);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'inbox':
        return <Inbox />;
      case 'campaigns':
        return <Campaigns />;
      case 'campaign-details':
        return <CampaignDetails />;
      case 'templates':
        return <Templates />;
      case 'template-editor':
        return <TemplateEditor />;
      case 'contacts':
        return <Contacts />;
      case 'contact-details':
        return <ContactDetails />;
      case 'funnel':
        return <Funnel />;
      case 'automations':
        return <Automations />;
      case 'automation-editor':
        return <AutomationEditor />;
      case 'new-campaign':
        return <NewCampaign />;
      case 'profile':
        return <CompanyProfile />;
      case 'settings':
        return <Settings />;
      case 'webhook-inspector':
        return <WebhookInspector />;
      default:
        return <Dashboard />;
    }
  };

  if (loading) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-slate-900">
            <div className="text-gray-800 dark:text-white text-xl">Carregando...</div>
        </div>
      )
  }

  return (
    <>
      {!session ? (
        <Suspense fallback={<FullPageSuspenseFallback />}>
          <Auth />
        </Suspense>
      ) : (
        <MainLayout>
          <Suspense fallback={<PageSuspenseFallback />}>
            {renderPage()}
          </Suspense>
        </MainLayout>
      )}
      <ToastContainer />
      <ConfirmationModal />
    </>
  );
};

export default App;
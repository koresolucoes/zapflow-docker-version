import React from 'react';
import { Page } from '../../types/index.js';
import { ZAPFLOW_AI_LOGO, DASHBOARD_ICON, CAMPAIGN_ICON, TEMPLATE_ICON, CONTACTS_ICON, PROFILE_ICON, SETTINGS_ICON, AUTOMATION_ICON, FUNNEL_ICON, INBOX_ICON, WEBHOOK_INSPECTOR_ICON } from '../icons/index.js';
import { useAuthStore } from '../../stores/authStore.js';
import { cn } from '../../lib/utils.js';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  page: Page;
  isActive: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick }) => (
  <li>
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={cn(
        'flex items-center p-3 my-1 rounded-lg transition-colors',
        isActive 
          ? 'bg-primary text-primary-foreground font-semibold' 
          : 'text-secondary-foreground hover:bg-primary/50 hover:text-primary-foreground'
      )}
    >
      {icon}
      <span className="ml-4 text-sm font-medium">{label}</span>
    </a>
  </li>
);

const Sidebar: React.FC = () => {
  const { currentPage, setCurrentPage } = useAuthStore();

  const navItems = [
    { icon: <DASHBOARD_ICON className="w-5 h-5" />, label: 'Painel', page: 'dashboard' as Page },
    { icon: <INBOX_ICON className="w-5 h-5" />, label: 'Caixa de Entrada', page: 'inbox' as Page },
    { icon: <CONTACTS_ICON className="w-5 h-5" />, label: 'Contatos', page: 'contacts' as Page },
    { icon: <FUNNEL_ICON className="w-5 h-5" />, label: 'Funil', page: 'funnel' as Page },
    { icon: <CAMPAIGN_ICON className="w-5 h-5" />, label: 'Campanhas', page: 'campaigns' as Page },
    { icon: <TEMPLATE_ICON className="w-5 h-5" />, label: 'Templates', page: 'templates' as Page },
    { icon: <AUTOMATION_ICON className="w-5 h-5" />, label: 'Automações', page: 'automations' as Page },
    { icon: <PROFILE_ICON className="w-5 h-5" />, label: 'Perfil da Empresa', page: 'profile' as Page },
  ];
  
  const bottomNavItems = [
      { icon: <WEBHOOK_INSPECTOR_ICON className="w-5 h-5" />, label: 'Webhook Inspector', page: 'webhook-inspector' as Page },
      { icon: <SETTINGS_ICON className="w-5 h-5" />, label: 'Configurações', page: 'settings' as Page },
  ];

  return (
    <aside className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 border-r border-border h-screen bg-background">
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-border bg-card">
          <div className="flex items-center">
            <ZAPFLOW_AI_LOGO className="h-8 w-auto" />
            <span className="ml-2 text-lg font-bold text-foreground">ZapFlow</span>
          </div>
        </div>
        
        {/* Navegação principal */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <NavItem
                key={item.page}
                icon={item.icon}
                label={item.label}
                page={item.page}
                isActive={currentPage === item.page}
                onClick={() => setCurrentPage(item.page)}
              />
            ))}
          </ul>
        </nav>
        
        {/* Navegação inferior */}
        <div className="p-3 border-t border-border bg-card">
          <ul className="space-y-2">
            {bottomNavItems.map((item) => (
              <NavItem
                key={item.page}
                icon={item.icon}
                label={item.label}
                page={item.page}
                isActive={currentPage === item.page}
                onClick={() => setCurrentPage(item.page)}
              />
            ))}
          </ul>
        </div>
        <div className="p-4 mt-auto bg-muted/50 rounded-t-lg text-center">
            <p className="text-xs text-muted-foreground"> 2024 ZapFlow AI. Todos os direitos reservados.</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
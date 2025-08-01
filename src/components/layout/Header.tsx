import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { Button } from '../common/Button.js';
import { useAuthStore } from '../../stores/authStore.js';
import { useUiStore } from '../../stores/uiStore.js';
import { USERS_ICON, SUN_ICON, MOON_ICON } from '../icons/index.js';
import { Team } from '../../types/index.js';

const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useUiStore();
    
    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="w-10 h-10 p-0"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
            {theme === 'dark' ? (
                <SUN_ICON className="w-5 h-5 text-muted-foreground hover:text-foreground" />
            ) : (
                <MOON_ICON className="w-5 h-5 text-muted-foreground hover:text-foreground" />
            )}
        </Button>
    );
};

const TeamSwitcher: React.FC = () => {
    const { userTeams, activeTeam, setActiveTeam, teamLoading } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (teamLoading) {
        return <div className="text-sm text-muted-foreground">Carregando equipes...</div>;
    }
    
    if (!activeTeam) {
        return <div className="text-sm text-muted-foreground">Nenhuma equipe encontrada.</div>;
    }

    const switchTeam = (team: Team) => {
        setActiveTeam(team);
        setIsOpen(false);
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-2 rounded-lg bg-secondary hover:bg-muted transition-colors"
            >
                <USERS_ICON className="w-5 h-5 text-muted-foreground" />
                <span className="font-semibold text-foreground text-sm">{activeTeam.name}</span>
                <svg 
                    className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 origin-top-right bg-popover rounded-md shadow-lg ring-1 ring-border/10 z-10">
                    <div className="py-1">
                        {userTeams.map(team => (
                            <a
                                key={team.id}
                                href="#"
                                onClick={(e) => { e.preventDefault(); switchTeam(team); }}
                                className={`block px-4 py-2 text-sm ${activeTeam.id === team.id ? 'bg-accent text-accent-foreground font-semibold' : 'text-foreground hover:bg-accent/50'}`}
                            >
                                {team.name}
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

const Header: React.FC = () => {
  const user = useAuthStore(state => state.user);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex items-center h-16 px-4">
        <div className="flex items-center space-x-4">
          <TeamSwitcher />
        </div>
        <div className="flex-1" />
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <span className="text-sm font-medium text-foreground">
              {user?.email?.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
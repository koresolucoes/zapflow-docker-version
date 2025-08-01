import React, { useState, FC } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { ZAPFLOW_AI_LOGO, GOOGLE_ICON } from '../../components/icons/index.js';
import { Button } from '../../components/common/Button.js';
import { Card } from '../../components/common/Card.js';
import { useUiStore } from '../../stores/uiStore.js';

type AuthView = 'login' | 'signup' | 'reset_password';

const Auth: FC = () => {
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const theme = useUiStore(state => state.theme);

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (view === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (view === 'signup') {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password, 
          options: { 
            data: { company_name: 'Minha Empresa' } 
          } 
        });
        if (error) throw error;
        setMessage("Cadastro realizado! Verifique seu e-mail para confirmar a conta.");
      } else if (view === 'reset_password') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { 
          redirectTo: window.location.origin 
        });
        if (error) throw error;
        setMessage("Instruções para redefinição de senha enviadas para o seu e-mail.");
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleOAuthLogin = async (provider: 'google') => {
      setLoading(true);
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({ provider });
      if (error) {
          setError(error.message);
          setLoading(false);
      }
  };

  const switchView = (newView: AuthView) => {
      setEmail('');
      setPassword('');
      setError(null);
      setMessage(null);
      setView(newView);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <ZAPFLOW_AI_LOGO className="h-12 w-auto mb-4 text-foreground" />
          <h1 className="text-2xl font-bold text-foreground text-center">
            {view === 'login' && 'Acesse sua conta'}
            {view === 'signup' && 'Crie sua conta'}
            {view === 'reset_password' && 'Redefinir senha'}
          </h1>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            {view === 'login' && 'Entre para gerenciar suas campanhas'}
            {view === 'signup' && 'Crie uma conta para começar a usar o ZapFlow'}
            {view === 'reset_password' && 'Digite seu e-mail para redefinir sua senha'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 text-sm rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 text-sm rounded-lg bg-success/10 text-success border border-success/20">
            {message}
          </div>
        )}

        <form onSubmit={handlePasswordAuth} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring/30 bg-background text-foreground"
              placeholder="seu@email.com"
              required
            />
          </div>

          {view !== 'reset_password' && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring/30 bg-background text-foreground"
                placeholder="••••••••"
                required={view === 'login' || view === 'signup'}
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            {view === 'login' && (
              <button
                type="button"
                onClick={() => switchView('reset_password')}
                className="text-sm text-primary hover:text-primary/80 hover:underline"
              >
                Esqueceu sua senha?
              </button>
            )}
            {view === 'reset_password' && (
              <button
                type="button"
                onClick={() => switchView('login')}
                className="text-sm text-primary hover:text-primary/80 hover:underline"
              >
                Voltar para login
              </button>
            )}
          </div>

          <Button
            type="submit"
            className="w-full justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
            disabled={loading}
          >
            {loading ? (
              'Carregando...'
            ) : view === 'login' ? (
              'Entrar'
            ) : view === 'signup' ? (
              'Criar conta'
            ) : (
              'Enviar link de redefinição'
            )}
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">
                Ou continue com
              </span>
            </div>
          </div>

          <div className="mt-6">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-center py-2 px-4 border border-input rounded-md shadow-sm text-sm font-medium text-foreground bg-background hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
              onClick={() => handleOAuthLogin('google')}
              disabled={loading}
            >
              <GOOGLE_ICON className="h-5 w-5 mr-2" />
              Google
            </Button>
          </div>
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {view === 'login' ? (
            <>
              Não tem uma conta?{' '}
              <button
                type="button"
                onClick={() => switchView('signup')}
                className="font-medium text-primary hover:text-primary/80 hover:underline"
              >
                Cadastre-se
              </button>
            </>
          ) : view === 'signup' ? (
            <>
              Já tem uma conta?{' '}
              <button
                type="button"
                onClick={() => switchView('login')}
                className="font-medium text-primary hover:text-primary/80 hover:underline"
              >
                Faça login
              </button>
            </>
          ) : null}
        </p>
      </Card>
    </div>
  );
};

export default Auth;
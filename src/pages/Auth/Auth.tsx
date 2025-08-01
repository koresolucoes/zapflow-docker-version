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
          <ZAPFLOW_AI_LOGO className="h-12 w-auto mb-4" />
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
          <div className="mb-4 p-3 text-sm rounded-lg bg-destructive/10 text-destructive-foreground">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 text-sm rounded-lg bg-success/10 text-success-foreground">
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
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              placeholder="seu@email.com"
              required
            />
          </div>

          {view !== 'reset_password' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-foreground">
                  Senha
                </label>
                {view === 'login' && (
                  <button
                    type="button"
                    onClick={() => switchView('reset_password')}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processando...
              </span>
            ) : view === 'login' ? (
              'Entrar'
            ) : view === 'signup' ? (
              'Criar conta'
            ) : (
              'Enviar instruções'
            )}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-background text-muted-foreground">
              {view === 'reset_password' ? 'Voltar para' : 'Ou continue com'}
            </span>
          </div>
        </div>

        {view === 'reset_password' ? (
          <Button
            variant="outline"
            onClick={() => switchView('login')}
            className="w-full"
            disabled={loading}
          >
            Voltar para login
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => handleOAuthLogin('google')}
            className="w-full flex items-center justify-center"
            disabled={loading}
          >
            <GOOGLE_ICON className="w-5 h-5 mr-2" />
            {view === 'login' ? 'Entrar com Google' : 'Cadastrar com Google'}
          </Button>
        )}

        <p className="mt-6 text-sm text-center text-muted-foreground">
          {view === 'login' ? (
            <>
              Não tem uma conta?{' '}
              <button
                type="button"
                onClick={() => switchView('signup')}
                className="font-medium text-primary hover:underline"
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
                className="font-medium text-primary hover:underline"
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
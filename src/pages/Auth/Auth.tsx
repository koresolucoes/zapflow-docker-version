import React, { useState, FC } from 'react';
import { useAuthStore } from '../../stores/authStore.js';
import { ZAPFLOW_AI_LOGO } from '../../components/icons/index.js';
import { Button } from '../../components/common/Button.js';
import { Card } from '../../components/common/Card.js';

type AuthView = 'login' | 'signup';

const Auth: FC = () => {
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const { login, register } = useAuthStore();

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (view === 'login') {
        await login(email, password);
        // O redirecionamento será tratado pelo App.tsx
      } else if (view === 'signup') {
        await register(email, password, companyName);
        setMessage("Cadastro realizado com sucesso! Você já pode fazer o login.");
        setView('login');
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro.');
    } finally {
      setLoading(false);
    }
  };

  const switchView = (newView: AuthView) => {
      setEmail('');
      setPassword('');
      setCompanyName('');
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
            {view === 'login' ? 'Acesse sua conta' : 'Crie sua conta'}
          </h1>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            {view === 'login' ? 'Entre para gerenciar suas campanhas' : 'Crie uma conta para começar a usar o ZapFlow'}
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

        <form onSubmit={handleAuthAction} className="space-y-4">
          {view === 'signup' && (
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-foreground mb-1">
                Nome da Empresa
              </label>
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring/30 bg-background text-foreground"
                placeholder="Sua Empresa Inc."
                required
              />
            </div>
          )}
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
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
            disabled={loading}
          >
            {loading ? 'Carregando...' : view === 'login' ? 'Entrar' : 'Criar conta'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
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
          ) : (
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
          )}
        </p>
      </Card>
    </div>
  );
};

export default Auth;
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    // Carregar todas as variáveis de ambiente que começam com VITE_
    const env = loadEnv(mode, '.', 'VITE_');
    
    // Criar um objeto com as variáveis de ambiente que serão injetadas
    const envWithProcessPrefix = {
        'process.env': `${JSON.stringify(env)}`,
        'import.meta.env': `${JSON.stringify(env)}`,
        'import.meta.env.VITE_SUPABASE_URL': `"${env.VITE_SUPABASE_URL}"`,
        'import.meta.env.VITE_SUPABASE_ANON_KEY': `"${env.VITE_SUPABASE_ANON_KEY}"`,
        'process.env.VITE_SUPABASE_URL': `"${env.VITE_SUPABASE_URL}"`,
        'process.env.VITE_SUPABASE_ANON_KEY': `"${env.VITE_SUPABASE_ANON_KEY}"`,
        'process.env.GEMINI_API_KEY': `"${env.VITE_GEMINI_API_KEY || ''}"`
    };
    
    return {
        define: envWithProcessPrefix,
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),
            },
        },
    };
});

import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default defineConfig(({ mode }) => {
    // Carregar todas as variáveis de ambiente que começam com VITE_
    const env = loadEnv(mode, '.', 'VITE_');
    
    // Criar um objeto com as variáveis de ambiente que serão injetadas
    const envWithProcessPrefix = {
        'process.env': `${JSON.stringify(env)}`,
        'import.meta.env': `${JSON.stringify(env)}`,
        'import.meta.env.VITE_APP_URL': `"${env.VITE_APP_URL || 'http://localhost:5173'}"`,
        'process.env.VITE_APP_URL': `"${env.VITE_APP_URL || 'http://localhost:5173'}"`,
        'process.env.GEMINI_API_KEY': `"${env.VITE_GEMINI_API_KEY || ''}"`
    };
    
    return {
        // Configuração do CSS
        css: {
            postcss: {
                plugins: [
                    tailwindcss,
                    autoprefixer,
                ],
            },
        },
        // Configuração de build
        build: {
            outDir: 'dist',
            emptyOutDir: true,
            rollupOptions: {
                input: 'index.html',
            },
            target: 'esnext',
            minify: 'esbuild',
            cssCodeSplit: true,
            sourcemap: false,
        },
        // Configuração do servidor de desenvolvimento
        server: {
            port: 5173,
            strictPort: true,
            proxy: {
                // Proxy para a API local
                '/api': {
                    target: 'http://localhost:3001',
                    changeOrigin: true,
                    secure: false,
                }
            },
        },
        // Configuração de resolução de módulos
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
        // Define as variáveis de ambiente
        define: envWithProcessPrefix,
    };
});

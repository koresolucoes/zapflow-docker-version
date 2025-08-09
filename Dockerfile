# Estágio de construção
FROM node:20-alpine AS build

WORKDIR /app

# Definir argumentos de build
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_APP_URL

# Criar arquivo .env temporário para o build
RUN echo "VITE_SUPABASE_URL=$VITE_SUPABASE_URL" > .env && \
    echo "VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY" >> .env && \
    echo "VITE_APP_URL=$VITE_APP_URL" >> .env

# Copiar arquivos de configuração
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./

# Instalar dependências
RUN npm install

# Copiar o restante do código
COPY . .

# Construir a aplicação
RUN npm run build

# Estágio de produção
FROM nginx:alpine

# Instalar utilitário para template de env (envsubst)
RUN apk add --no-cache gettext

# Copiar os arquivos construídos do estágio anterior
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuração personalizada do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Adicionar suporte a configuração em runtime via env.js
COPY env.template.js /usr/share/nginx/html/env.template.js
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Usa nosso entrypoint para gerar env.js e depois iniciar nginx
ENTRYPOINT ["/docker-entrypoint.sh"]
# Expor a porta 80
EXPOSE 80

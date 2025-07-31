# Estágio de construção
FROM node:18-alpine AS build

WORKDIR /app

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

# Copiar os arquivos construídos do estágio anterior
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuração personalizada do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor a porta 80
EXPOSE 80

# Comando para iniciar o servidor nginx
CMD ["nginx", "-g", "daemon off;"]

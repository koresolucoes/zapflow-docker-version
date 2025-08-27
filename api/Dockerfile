# Development stage
FROM node:20-alpine

WORKDIR /app

# Copiar package.json primeiro
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar o restante do código
COPY . .

# Copiar tsconfig.json do diretório raiz (será copiado pelo docker-compose)
# O docker-compose vai montar o volume do diretório raiz

# Porta que a API vai rodar
EXPOSE 3001

# Tornar o entrypoint executável
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Definir o entrypoint
ENTRYPOINT ["docker-entrypoint.sh"]

# Comando para iniciar o servidor de desenvolvimento
CMD ["npx", "tsx", "watch", "server.ts"]

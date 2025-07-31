# Estágio de desenvolvimento
FROM node:18-alpine

WORKDIR /app

# Copiar arquivos de configuração
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependências
RUN npm install

# Copiar o restante do código
COPY . .

# Construir a aplicação (se necessário)
# RUN npm run build

# Porta que a API vai rodar
EXPOSE 3001

# Comando para iniciar o servidor de desenvolvimento
CMD ["npm", "run", "dev"]

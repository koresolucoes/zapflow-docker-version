# ZapFlow - Plataforma de Automação de Marketing

ZapFlow é uma plataforma completa de automação de marketing que combina CRM, automação de workflows, campanhas de email e integração com WhatsApp Business API. A plataforma oferece uma interface intuitiva para criar automações complexas, gerenciar contatos e executar campanhas de marketing eficazes.

## 🚀 Características Principais

- **Automação Visual**: Editor de workflows drag-and-drop para criar automações complexas
- **CRM Integrado**: Gerenciamento completo de contatos e leads
- **Campanhas de Marketing**: Sistema avançado de campanhas com templates personalizáveis
- **Integração WhatsApp**: Conexão direta com WhatsApp Business API
- **Analytics em Tempo Real**: Métricas detalhadas de performance
- **Webhooks**: Sistema flexível de webhooks para integrações externas
- **Interface Moderna**: Design responsivo e intuitivo

## 🏗️ Arquitetura

O projeto é construído sobre uma arquitetura moderna usando Docker, Supabase e React, garantindo escalabilidade, funcionalidade em tempo real e uma experiência de desenvolvedor perfeita.

### Stack Tecnológica

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript (Docker)
- **Banco de Dados:** Supabase (PostgreSQL)
- **Cache/Fila:** Redis + BullMQ
- **Autenticação:** Supabase Auth
- **Deploy:** Docker Compose

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/)
- [Git](https://git-scm.com/)
- Uma conta no [Supabase](https://supabase.com/) para o banco de dados.

## 🛠️ Configuração do Ambiente

### Passo 1: Clone o Repositório

```bash
git clone <url-do-repositorio>
cd zapflow-docker-version
```

### Passo 2: Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto ou configure essas variáveis diretamente no seu ambiente Docker.

```env
# Supabase Configuration
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
SUPABASE_URL=sua_url_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_do_supabase

# API Configuration
PORT=3001
NODE_ENV=production

# Redis Configuration
REDIS_URL=redis://redis:6379

# App Configuration
APP_URL=http://localhost:5173
```

### Passo 3: Executar com Docker

1. Construa e inicie os containers:
```bash
docker-compose up --build
```

2. A aplicação estará disponível em:
   - Frontend: http://localhost:5173
   - API: http://localhost:3001
   - Redis Commander: http://localhost:8081

### Passo 4: Configurar Webhooks

Após o deploy, configure os webhooks no Supabase para apontar para:

```
http://localhost:3001/api/webhook/<SEU_USER_ID>
```

## 🚀 Desenvolvimento Local

Você pode executar a aplicação localmente usando Docker para um ambiente que espelha a produção.

### Executar em Modo de Desenvolvimento

```bash
# Instalar dependências globais
npm install -g tsx

# Executar com Docker Compose
docker-compose up --build
```

## 📁 Estrutura do Projeto

```
zapflow-docker-version/
├── api/                    # Backend API (Node.js + Express)
│   ├── handlers/          # Handlers das rotas da API
│   ├── _lib/             # Bibliotecas compartilhadas
│   ├── workers/          # Workers para processamento em background
│   └── server.ts         # Servidor principal
├── src/                   # Frontend (React + TypeScript)
│   ├── components/       # Componentes React
│   ├── pages/           # Páginas da aplicação
│   ├── services/        # Serviços de API
│   └── stores/          # Gerenciamento de estado
├── docker-compose.yml    # Configuração Docker Compose
├── Dockerfile           # Dockerfile para o frontend
└── README.md           # Este arquivo
```

### Componentes Principais

-   **Frontend (React):** Interface de usuário moderna e responsiva
-   **Backend (Node.js + Express):** API RESTful robusta com suporte a webhooks
-   **Workers:** Sistema de processamento em background para automações
-   **Redis:** Cache e filas para processamento assíncrono

## 🔧 Configurações Avançadas

### Variáveis de Ambiente Adicionais

```env
# Google Gemini AI (opcional)
GEMINI_API_KEY=sua_chave_do_gemini

# Meta WhatsApp Business API (opcional)
META_ACCESS_TOKEN=seu_token_do_meta
META_PHONE_NUMBER_ID=seu_phone_number_id
META_WABA_ID=seu_waba_id
META_VERIFY_TOKEN=seu_verify_token
```

### Personalização do Docker

Você pode personalizar as configurações do Docker editando os arquivos:
- `docker-compose.yml` - Configuração dos serviços
- `Dockerfile` - Configuração do frontend
- `api/Dockerfile` - Configuração do backend

## 📊 Monitoramento

- **Health Check:** http://localhost:3001/health
- **API Docs:** http://localhost:3001/api-docs
- **Redis Commander:** http://localhost:8081

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Se você encontrar algum problema ou tiver dúvidas, por favor:

1. Verifique a documentação da API em http://localhost:3001/api-docs
2. Consulte os logs do Docker: `docker-compose logs`
3. Abra uma issue no repositório

---

**ZapFlow** - Transformando automação de marketing em realidade.
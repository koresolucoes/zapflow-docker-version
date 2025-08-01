# API de Métricas

Documentação dos endpoints disponíveis para consulta de métricas do WhatsApp.

## Autenticação

Todos os endpoints exigem autenticação via token JWT no cabeçalho `Authorization`:

```
Authorization: Bearer <seu_token_jwt>
```

## Endpoints

### 1. Obter Resumo de Métricas

Retorna um resumo das métricas de mensagens.

```
GET /api/metrics/summary
```

#### Parâmetros de Consulta

- `startDate` (opcional): Data de início no formato ISO 8601 (padrão: 30 dias atrás)
- `endDate` (opcional): Data de término no formato ISO 8601 (padrão: data atual)

#### Exemplo de Resposta

```json
{
  "data": [
    {
      "status": "delivered",
      "message_count": 150,
      "direction": "outbound",
      "message_type": "template"
    },
    {
      "status": "read",
      "message_count": 120,
      "direction": "outbound",
      "message_type": "template"
    }
  ]
}
```

### 2. Obter Tempo Médio de Resposta

Retorna o tempo médio de resposta para mensagens de saída.

```
GET /api/metrics/average-response-time
```

#### Parâmetros de Consulta

- `startDate` (opcional): Data de início no formato ISO 8601 (padrão: 30 dias atrás)
- `endDate` (opcional): Data de término no formato ISO 8601 (padrão: data atual)

#### Exemplo de Resposta

```json
{
  "data": {
    "averageResponseTime": 120.5,
    "unit": "milliseconds"
  }
}
```

### 3. Obter Métricas por Status

Retorna a contagem de mensagens agrupadas por status.

```
GET /api/metrics/status
```

#### Parâmetros de Consulta

- `startDate` (opcional): Data de início no formato ISO 8601 (padrão: 30 dias atrás)
- `endDate` (opcional): Data de término no formato ISO 8601 (padrão: data atual)
- `direction` (opcional): Filtrar por direção (`inbound` ou `outbound`)
- `messageType` (opcional): Filtrar por tipo de mensagem (ex: `text`, `image`, `template`)

#### Exemplo de Resposta

```json
{
  "data": [
    {
      "status": "sent",
      "message_count": 200,
      "direction": "outbound",
      "message_type": "template"
    },
    {
      "status": "delivered",
      "message_count": 180,
      "direction": "outbound",
      "message_type": "template"
    }
  ]
}
```

### 4. Obter Métricas de Campanhas

Retorna métricas detalhadas das campanhas.

```
GET /api/metrics/campaigns
```

#### Parâmetros de Consulta

- `startDate` (opcional): Data de início no formato ISO 8601 (padrão: 30 dias atrás)
- `endDate` (opcional): Data de término no formato ISO 8601 (padrão: data atual)

#### Exemplo de Resposta

```json
{
  "data": [
    {
      "campaign_id": "123e4567-e89b-12d3-a456-426614174000",
      "campaign_name": "Promoção de Verão",
      "total_messages": 1000,
      "delivered": 980,
      "read_count": 850,
      "failed": 20,
      "delivery_rate": 98.0,
      "read_rate": 86.73
    },
    {
      "campaign_id": "223e4567-e89b-12d3-a456-426614174001",
      "campaign_name": "Lançamento de Produto",
      "total_messages": 500,
      "delivered": 490,
      "read_count": 400,
      "failed": 10,
      "delivery_rate": 98.0,
      "read_rate": 81.63
    }
  ]
}
```

## Códigos de Status HTTP

- `200 OK`: Requisição bem-sucedida
- `400 Bad Request`: Parâmetros inválidos
- `401 Unauthorized`: Token de autenticação inválido ou ausente
- `404 Not Found`: Endpoint não encontrado
- `500 Internal Server Error`: Erro interno do servidor

## Exemplo de Uso com cURL

```bash
# Obter resumo de métricas
curl -X GET 'http://localhost:3001/api/metrics/summary?startDate=2023-01-01&endDate=2023-01-31' \
  -H 'Authorization: Bearer seu_token_jwt'

# Obter métricas de campanhas
curl -X GET 'http://localhost:3001/api/metrics/campaigns' \
  -H 'Authorization: Bearer seu_token_jwt'
```

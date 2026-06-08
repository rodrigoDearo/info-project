# Fleet Management API — Aivacol

Backend do módulo de Gestão de Frota. NestJS 10 · TypeORM · SQL Server · MongoDB (Audit) · Redis (Cache) · RabbitMQ (Events)

## Stack
- **Runtime**: Node.js 20 LTS
- **Framework**: NestJS 10
- **ORM**: TypeORM + SQL Server (dados relacionais)
- **Audit**: MongoDB via Mongoose (logs de eventos)
- **Cache**: Redis via cache-manager-redis-yet
- **Mensageria**: RabbitMQ via @nestjs/microservices
- **Auth**: JWT via passport-jwt
- **Docs**: Swagger em /docs

## Pré-requisitos
- Node.js 20 + npm 10
- Docker 24 + docker-compose v2

## Instalação
```bash
git clone <repo> && cd fleet-api
npm install
cp .env.example .env
```

## Rodando (Docker — recomendado)
```bash
docker-compose up
```
Sobe SQL Server + MongoDB + Redis + RabbitMQ + API.
Migrations e seed rodam automaticamente.
Endpoint http://localhost:3000  &  Documentacao: http://localhost:3000/docs

## Testes
```bash
npm test          # unitários
npm run test:cov  # cobertura
```

## Credenciais (seed)
| Campo    | Valor         |
|----------|---------------|
| nickname | aivacol       |
| password | aivacol@2024  |

## Endpoints
| Método | Rota          | Descrição                      |
|--------|--------------|--------------------------------|
| POST   | /auth/login   | Autenticar                     |
| GET    | /auth/me      | Dados do usuário               |
| CRUD   | /brands       | Marcas                         |
| CRUD   | /models       | Modelos (vinculados à marca)   |
| CRUD   | /vehicles     | Veículos (cache + eventos)     |

Swagger: `http://localhost:3000/docs`
RabbitMQ Management: `http://localhost:15672` (guest/guest)

## Como funciona o Cache
- `GET /vehicles` e `GET /vehicles/:id` — resultado em cache no Redis
- TTL configurável via `CACHE_TTL_SECONDS` no `.env` (padrão: 300s)
- Cache invalidado automaticamente em qualquer escrita (POST, PUT, DELETE)

## Como funciona a Mensageria
- Ao criar/atualizar/deletar veículo, um evento é publicado no RabbitMQ
- O AuditController consome esses eventos e persiste no MongoDB
- Desacoplamento total: se o MongoDB cair, a operação principal não falha

## Decisões técnicas
- **SQL Server + TypeORM**: requisito do teste; migrations explícitas para rastreabilidade
- **MongoDB para audit**: escrita de logs não deve afetar a transação principal; documento schemaless flexível para diferentes payloads de evento
- **Redis cache**: leituras de veículos são a operação mais frequente; cache com invalidação automática evita dados stale
- **RabbitMQ**: desacopla auditoria do fluxo principal; fila durável garante entrega mesmo se consumer cair
- **Microservice híbrido**: mesma instância NestJS serve HTTP e consome fila RabbitMQ — simples para o escopo sem necessidade de processo separado

## Com mais tempo
- Refresh token com Redis blacklist
- Paginação com cursor para volumes grandes
- Soft delete com campo `deleted_at`
- Rate limiting por IP no login
- Health check endpoint (/health)





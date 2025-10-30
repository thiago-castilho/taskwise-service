# TaskWise Service

API REST para registro de tarefas de QA com estimativas PERT, sprints, capacidade por nível de QA e dashboard de progresso.

## Requisitos
- Node.js 18+

## Instalação e execução
```bash
npm install
npm start
```
A API sobe em `http://localhost:3000`.

## Autenticação (JWT)
- Todas as rotas protegidas exigem header `Authorization: Bearer <token>`.
- Faça login com:
  - Admin: `admin@taskwise.local` / `admin123`
  - Read/Write: `user@taskwise.local` / `user123`

### Obter token
```bash
curl -s -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@taskwise.local","password":"admin123"}'
```
Resposta contém `token` (JWT).

## Swagger (OpenAPI)
- Arquivo: `resources/swagger.yaml`
- UI: `GET /docs` → `http://localhost:3000/docs`

## Conceitos e regras
- Dia produtivo = 6h
- Fases fixas por tarefa: Análise e Modelagem, Execução, Reteste, Documentação
- PERT por fase: `(O + 4*M + P) / 6` com validação `O ≤ M ≤ P`
- `totalHours` = soma PERT das 4 fases (1 casa decimal)
- `totalDays` = `totalHours / 6` (1 casa decimal)
- `dueDate` da tarefa: a partir do dia seguinte à criação, somar `ceil(totalDays)` apenas em dias úteis (seg–sex)
- Capacidade sprint: Júnior 4.8h/dia, Pleno 6.0h/dia, Sênior 7.2h/dia; soma por quantidade
- `dias_sprint` = `horas_sprint / capacidade_diaria` (1 casa decimal)
- `dueDate` da sprint: a partir do início, somar `ceil(dias_sprint)` apenas em dias úteis
- Transições de status: `Backlog → Em Andamento`; `Em Andamento ↔ Bloqueada`; `Em Andamento → Concluída`
- Concluir exige responsável e PERT válida
- Bloqueio: para entrar em `Bloqueada` exige `motivo` e `responsavelId`; registra `blockedAt`; ao sair registra `resolvedAt`
- Somente Admin pode iniciar/encerrar sprint

## Endpoints principais
Veja o Swagger para os contratos detalhados. Resumo:
- Auth
  - POST `/auth/login`
- Users
  - POST `/users` (cria Read/Write)
  - GET `/users/me`
- Tasks
  - POST `/tasks`
  - GET `/tasks`
  - GET `/tasks/:id`
  - PUT `/tasks/:id`
  - PATCH `/tasks/:id/status`
  - PATCH `/tasks/:id/assign/:userId`
- Sprints
  - POST `/sprints`
  - PATCH `/sprints/:id/capacity`
  - PATCH `/sprints/:id/start` (Admin)
  - PATCH `/sprints/:id/close` (Admin)
- Dashboard
  - GET `/dashboard/summary?sprintId=...`

## Observabilidade
- `x-request-id` é retornado em todas as respostas
- Datas em UTC (ISO 8601)
- Erros 4xx/5xx no formato: `[{ code, field, message }]`
- Paginação padrão: 20 itens (metadados `page`, `pageSize`, `total`, `totalPages`)

## Seeds (banco em memória)
- 1 Admin e 1 Read/Write
- 1 sprint (não iniciada) e 2 tarefas de exemplo

## Variáveis de ambiente
- `PORT` (opcional) — padrão 3000
- `JWT_SECRET` (opcional) — padrão interno de desenvolvimento


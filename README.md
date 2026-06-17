# BasquiArt

Projeto acadêmico desenvolvido para a disciplina de S204.

O BasquiArt é uma aplicação para criação e interação em coletivos de arte. O sistema possui frontend em React, backend em FastAPI e banco de dados PostgreSQL.

## Documentação

A documentação principal do projeto está disponível no Notion:

[Documentação S204](https://www.notion.so/Documenta-o-S204-31a7b24c222580fc9bd8fd14144d010e)

## Tecnologias usadas

### Frontend

- React;
- Vite;
- TypeScript;
- Playwright para testes E2E.

### Backend

- Python;
- FastAPI;
- Prisma;
- PostgreSQL;
- Pytest para testes unitários.

### DevOps e testes

- GitHub Actions;
- Playwright HTML Report;
- Playwright test-results;
- Docker Compose para banco de dados.

## Como rodar o projeto

### Banco de dados

Entre na pasta do banco:

```bash
cd backend/database
docker compose up -d
```

## Deploy

O projeto está publicado no Render com três recursos separados:

- Frontend: Static Site
- Backend: Web Service
- Banco de dados: Render PostgreSQL

### URLs públicas

- Frontend: https://basquiart.onrender.com
- Backend: https://basquiart-backend.onrender.com
- OpenAPI: https://basquiart-backend.onrender.com/openapi.json

### Configuração do frontend no Render

```text
Root Directory: frontend
Build Command: npm install && npm run build
Publish Directory: dist
```

Variável de ambiente:

```text
VITE_API_BASE_URL=https://basquiart-backend.onrender.com
```

### Configuração do backend no Render

```text
Root Directory: backend
Build Command: pip install -r requirements.txt && prisma generate && prisma py fetch && prisma db push
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

Variáveis de ambiente usadas pelo backend:

```text
DATABASE_URL
SECRET_KEY
ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_MINUTES
CORS_ORIGINS
PYTHON_VERSION
PRISMA_BINARY_CACHE_DIR
```

> Valores sensíveis, como `DATABASE_URL` e `SECRET_KEY`, devem ficar apenas no painel do Render e não devem ser commitados.

### Observações

- O deploy está ligado a branch `main` do GitHub.
- Alterações mergeadas na `main` disparam novo deploy automaticamente, conforme configuração de auto deploy do Render.
- No plano gratuito, o backend pode hibernar após um período sem tráfego e acorda automaticamente no próximo acesso.
- O banco PostgreSQL gratuito do Render expira após o período informado no painel do Render.

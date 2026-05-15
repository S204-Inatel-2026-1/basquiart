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
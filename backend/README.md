# Basquiart — Backend

## Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (necessário para o PostgreSQL)
- Python 3.x

---

## Configuração inicial

> Realize esses passos apenas na **primeira vez** que for usar o projeto.

1. **Inicie o Docker Desktop** e aguarde até que ele esteja completamente em execução.
2. Execute o script de instalação:

```bash
installDependencies.bat
```

Esse script irá:
- Baixar e configurar o container do **PostgreSQL** via Docker
- Criar um **ambiente virtual Python** local
- Instalar todas as **dependências do projeto**

Após a conclusão, o ambiente estará pronto para uso.

---

## Rodando o servidor

Com o projeto já configurado, execute:

```bash
RunServer.bat
```

Esse script irá:
1. Ativar o ambiente virtual Python
2. Sincronizar o **Prisma** com o banco de dados
3. Iniciar o servidor

> Certifique-se de que o **Docker Desktop está aberto** antes de rodar o servidor.

---

## Resolução de problemas

### Resetar o banco de dados

Caso precise limpar todos os dados do banco e começar do zero:

```bash
wipeDB.bat
```

---

## Testes

### Suite rapida com coverage

```bash
venv\Scripts\python -m pytest tests -q --cov=features --cov-report=term-missing --cov-report=xml --cov-report=html
```

### Integracao com PostgreSQL real

```bash
docker compose -f database/docker-compose.yml up -d
set PATH=%CD%\venv\Scripts;%PATH%
set DATABASE_URL=postgresql://s204:senhamuitosegura@localhost:5432/mydb
set RUN_DB_TESTS=1
venv\Scripts\python -m prisma generate
venv\Scripts\python -m prisma db push
venv\Scripts\python -m pytest tests\integration -q -rs
```

> O `PATH` precisa incluir `venv\Scripts` antes do `prisma generate` para que o Prisma Client Python seja gerado dentro do ambiente virtual correto.

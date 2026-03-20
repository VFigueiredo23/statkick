# StatKick MVP (Docker)

Monorepo do MVP do StatKick para analise de futebol por video e eventos, sem IA e sem cloud.

## Estrutura

- `backend/` API Django + DRF + PostgreSQL
- `frontend/` Next.js + React + TypeScript + TailwindCSS
- `media/` arquivos locais do sistema
- `media/videos/` armazenamento local de videos
- `media/clipes/` armazenamento local de clipes
- `videos/` pasta reservada para ingestao local
- `clipes/` pasta reservada para exportacoes locais

## Stack em containers

- `db`: PostgreSQL 16
- `backend`: Django (`runserver` em `DJANGO_DEBUG=1`, `gunicorn` em `DJANGO_DEBUG=0`)
- `frontend`: Next.js em modo `standalone`
- `caddy`: proxy reverso e TLS automatico no ambiente de producao

## Ambiente de desenvolvimento

### 1. Configurar variaveis

```bash
cd /Users/cor/Statkick
cp docker.env.example .env
```

### 2. Subir tudo

```bash
docker compose up --build -d
```

### 3. Ver logs

```bash
docker compose logs -f
```

### URLs

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Admin Django: `http://localhost:8000/admin`

## Ambiente de producao

### 1. Configurar variaveis de producao

```bash
cd /Users/cor/Statkick
cp docker.env.prod.example .env
```

Preencha no `.env`:
- `DJANGO_SECRET_KEY` forte
- `POSTGRES_PASSWORD` forte
- `APP_DOMAIN`
- `API_DOMAIN`
- `DJANGO_ALLOWED_HOSTS`
- `DJANGO_CORS_ALLOWED_ORIGINS`
- `DJANGO_CSRF_TRUSTED_ORIGINS`
- `NEXT_PUBLIC_API_URL`

### 2. Subir com compose de producao

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

### 3. Validar status

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f caddy backend frontend
```

### URLs em producao

- Frontend: `https://APP_DOMAIN`
- Backend API: `https://API_DOMAIN`
- Admin Django: `https://API_DOMAIN/admin/`

## Ambiente de VPS sem dominio

Enquanto o dominio nao estiver definido, voce pode operar temporariamente por IP.

### 1. Configurar variaveis para IP publico

```bash
cd /Users/cor/Statkick
cp docker.env.vps-ip.example .env
```

Preencha o `.env` com o IP real da VPS em:
- `PUBLIC_IP`
- `DJANGO_ALLOWED_HOSTS`
- `DJANGO_CORS_ALLOWED_ORIGINS`
- `DJANGO_CSRF_TRUSTED_ORIGINS`
- `NEXT_PUBLIC_API_URL`

### 2. Subir por IP

```bash
docker compose -f docker-compose.yml -f docker-compose.vps-ip.yml up --build -d
```

### 3. URLs por IP

- Frontend: `http://IP_DA_VPS:3000`
- Backend API: `http://IP_DA_VPS:8000`
- Admin Django: `http://IP_DA_VPS:8000/admin/`

### Teste local com stack de producao

Se voce subir com `docker-compose.prod.yml` mas ainda estiver acessando por `localhost`, ajuste o `.env` para o ambiente local:

```env
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
DJANGO_CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
DJANGO_CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
DJANGO_SECURE_SSL_REDIRECT=0
DJANGO_SESSION_COOKIE_SECURE=0
DJANGO_CSRF_COOKIE_SECURE=0
DJANGO_SECURE_HSTS_SECONDS=0
DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS=0
DJANGO_SECURE_HSTS_PRELOAD=0
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Com os valores de dominio real (`api.seu-dominio.com`, `https://...`) o Django respondera `400 Bad Request` ao acessar `http://localhost:8000/admin/`.

## Migracoes

As migracoes sao aplicadas automaticamente no start do backend via `backend/entrypoint.sh`.

Execucao manual (se necessario):

```bash
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py migrate
```

## Superusuario

### Opcao manual

```bash
docker compose exec backend python manage.py createsuperuser
```

### Opcao automatica

No `.env`:

```env
DJANGO_CREATE_SUPERUSER=1
DJANGO_SUPERUSER_EMAIL=admin@seu-dominio.com
DJANGO_SUPERUSER_PASSWORD=troque_senha_admin
DJANGO_SUPERUSER_NOME=Administrador
```

## Endpoints MVP

- `GET /partidas`
- `POST /partidas`
- `GET /partidas/{id}`
- `GET /partidas/{id}/eventos`
- `GET /eventos`
- `POST /eventos`
- `GET /equipes`
- `GET /jogadores`

## Fluxo de analise

1. Cadastrar partida em `/partidas`
2. Abrir `/analise/[partidaId]`
3. Assistir o video
4. Marcar evento na barra lateral
5. Selecionar equipe/jogador no modal
6. Salvar evento com timestamp atual do video
7. Visualizar timeline atualizada

## Comandos uteis

Parar containers:

```bash
docker compose down
```

Parar e remover volumes do banco:

```bash
docker compose down -v
```

Rebuild completo:

```bash
docker compose build --no-cache
docker compose up -d
```

## Guia de VPS

O passo a passo de bootstrap e deploy na VPS esta em [docs/vps.md](docs/vps.md).

## CI/CD

O fluxo de deploy por GitHub Actions para a VPS esta em [docs/cicd-github-actions.md](docs/cicd-github-actions.md).

# Deploy na VPS

## Premissas

- Docker Engine e Docker Compose Plugin instalados na VPS
- DNS configurado apontando para a VPS:
  - `APP_DOMAIN` para o frontend
  - `API_DOMAIN` para a API Django
- Portas `80` e `443` liberadas no firewall da VPS

## 1. Copiar o projeto para a VPS

Exemplo com `rsync`:

```bash
rsync -avz --exclude '.env' /Users/cor/Statkick/ usuario@SEU_IP:/opt/statkick
```

Ou clone o repositório diretamente na VPS, se ele estiver versionado remotamente.

## 2. Configurar o ambiente

Na VPS:

```bash
cd /opt/statkick
cp docker.env.prod.example .env
```

Preencha pelo menos:

```env
POSTGRES_PASSWORD=senha_forte
APP_DOMAIN=seu-dominio.com
API_DOMAIN=api.seu-dominio.com
DJANGO_SECRET_KEY=gere_uma_secret_key_forte
DJANGO_ALLOWED_HOSTS=api.seu-dominio.com
DJANGO_CORS_ALLOWED_ORIGINS=https://seu-dominio.com
DJANGO_CSRF_TRUSTED_ORIGINS=https://seu-dominio.com,https://api.seu-dominio.com
NEXT_PUBLIC_API_URL=https://api.seu-dominio.com
```

Se quiser criar o admin no primeiro boot:

```env
DJANGO_CREATE_SUPERUSER=1
DJANGO_SUPERUSER_EMAIL=admin@seu-dominio.com
DJANGO_SUPERUSER_PASSWORD=troque_senha_admin
DJANGO_SUPERUSER_NOME=Administrador
```

## 3. Subir em produção

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

## 4. Validar

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f caddy backend frontend
```

Verificacoes esperadas:

- `https://APP_DOMAIN` responde o frontend
- `https://API_DOMAIN/admin/` responde o admin Django
- `https://API_DOMAIN/partidas` responde a API

## 5. Redeploy

Depois de atualizar o codigo na VPS:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

## Observacoes

- Em producao, `frontend` e `backend` nao ficam mais expostos diretamente; apenas o proxy responde nas portas publicas.
- O Caddy gera e renova TLS automaticamente quando os dominios ja apontam para a VPS.
- O banco continua interno ao Compose e sem exposicao publica.
- Os arquivos de `media/` sao montados no backend e servidos pelo proxy em `https://API_DOMAIN/media/...`.

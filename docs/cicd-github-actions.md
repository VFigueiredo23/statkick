# CI/CD com GitHub Actions para VPS

## Como funciona

1. Voce faz `push` na branch `main`
2. O GitHub Actions valida o `docker compose` e builda `backend` e `frontend`
3. Se a validacao passar, o workflow sincroniza o projeto para a VPS via `rsync`
4. A VPS executa `scripts/deploy-vps.sh`
5. O script rebuilda os containers de producao e sobe a nova versao

## Requisitos

- O projeto precisa estar em um repositorio GitHub
- A VPS precisa ter Docker Engine + Docker Compose Plugin
- A pasta de deploy precisa existir na VPS, por exemplo `/opt/statkick`
- O arquivo `.env` de deploy precisa estar salvo na VPS e nao no GitHub
- Se usar deploy com dominio, as portas `80` e `443` precisam estar liberadas
- Se usar deploy temporario por IP, as portas `3000` e `8000` precisam estar liberadas

## Secrets do GitHub

Crie os seguintes secrets no ambiente `production` do repositorio:

- `VPS_HOST`: IP ou dominio da VPS
- `VPS_USER`: usuario SSH da VPS
- `VPS_PORT`: porta SSH, normalmente `22`
- `VPS_PATH`: caminho do projeto na VPS, por exemplo `/opt/statkick`
- `VPS_SSH_KEY`: chave privada SSH usada pelo GitHub Actions para acessar a VPS

Referencia oficial do GitHub sobre secrets:

- https://docs.github.com/github/automating-your-workflow-with-github-actions/creating-and-using-encrypted-secrets

## Bootstrap inicial da VPS

Na primeira vez, copie o projeto para a VPS e crie o `.env`:

```bash
sudo mkdir -p /opt/statkick
sudo chown -R $USER:$USER /opt/statkick
cd /opt/statkick
cp docker.env.prod.example .env
```

Depois edite o `.env` com os valores reais do ambiente.

Se ainda nao tiver dominio, use `docker.env.vps-ip.example` como base do `.env`.

Se `curl` nao existir na VPS, instale-o para habilitar os smoke tests do deploy:

```bash
sudo apt-get update
sudo apt-get install -y curl
```

## Primeira execucao manual

Antes de confiar no pipeline, rode uma vez na VPS:

```bash
cd /opt/statkick
bash ./scripts/deploy-vps.sh
```

## Branch de deploy

O workflow esta configurado para disparar em `push` para `main`:

```yaml
on:
  push:
    branches:
      - main
```

Se sua branch principal for outra, ajuste `.github/workflows/deploy.yml`.

## Observacoes

- O workflow usa `rsync`, entao a VPS nao precisa acessar o GitHub diretamente
- O `.env`, `media/`, `videos/` e `clipes/` nao sao sobrescritos pelo pipeline
- O deploy grava a versao publicada em `.deploy-version`
- O script usa `docker compose up --build -d --wait`, suportado pela documentacao atual do Docker
- O script detecta `DEPLOY_TARGET_MODE=ip` para operar sem dominio, ou assume `domain` para usar proxy e TLS

Referencias oficiais:

- https://docs.github.com/en/enterprise-cloud@latest/actions/writing-workflows/workflow-syntax-for-github-actions
- https://docs.docker.com/reference/cli/docker/compose/up/

#!/usr/bin/env sh
set -eu

echo "[backend] aguardando banco de dados..."
python - <<'PY'
import os
import sys
import time

import psycopg2

host = os.getenv("POSTGRES_HOST", "db")
port = os.getenv("POSTGRES_PORT", "5432")
name = os.getenv("POSTGRES_DB", "statkick")
user = os.getenv("POSTGRES_USER", "statkick")
password = os.getenv("POSTGRES_PASSWORD", "statkick")

for tentativa in range(1, 61):
    try:
        conexao = psycopg2.connect(
            host=host,
            port=port,
            dbname=name,
            user=user,
            password=password,
        )
        conexao.close()
        print("[backend] banco pronto")
        sys.exit(0)
    except Exception:
        print(f"[backend] tentativa {tentativa}/60 sem conexao")
        time.sleep(2)

print("[backend] falha ao conectar no banco", file=sys.stderr)
sys.exit(1)
PY

echo "[backend] aplicando migracoes"
python manage.py migrate --noinput

echo "[backend] coletando arquivos estaticos"
python manage.py collectstatic --noinput

if [ "${DJANGO_CREATE_SUPERUSER:-0}" = "1" ]; then
  echo "[backend] verificando superusuario"
  python manage.py shell <<'PY'
import os

from usuarios.models import Usuario

email = os.getenv("DJANGO_SUPERUSER_EMAIL", "admin@statkick.local")
senha = os.getenv("DJANGO_SUPERUSER_PASSWORD", "admin123")
nome = os.getenv("DJANGO_SUPERUSER_NOME", "Administrador")

if not Usuario.objects.filter(email=email).exists():
    Usuario.objects.create_superuser(email=email, password=senha, nome=nome)
    print(f"[backend] superusuario criado: {email}")
else:
    print(f"[backend] superusuario ja existe: {email}")
PY
fi

if [ "${DJANGO_DEBUG:-1}" = "1" ]; then
  echo "[backend] iniciando com runserver"
  exec python manage.py runserver 0.0.0.0:8000
fi

echo "[backend] iniciando com gunicorn"
exec gunicorn statkick_api.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers "${GUNICORN_WORKERS:-3}" \
  --timeout "${GUNICORN_TIMEOUT:-120}"

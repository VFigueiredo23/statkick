from typing import Optional

from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models


class GerenciadorUsuario(BaseUserManager):
    def create_user(self, email: str, password: Optional[str] = None, **extra_fields):
        if not email:
            raise ValueError("Usuarios precisam de email")
        email = self.normalize_email(email)
        usuario = self.model(email=email, **extra_fields)
        if password:
            usuario.set_password(password)
        else:
            usuario.set_unusable_password()
        usuario.save(using=self._db)
        return usuario

    def create_superuser(self, email: str, password: Optional[str] = None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superusuario precisa de is_staff=True")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superusuario precisa de is_superuser=True")

        return self.create_user(email, password, **extra_fields)


class Usuario(AbstractBaseUser, PermissionsMixin):
    PLANO_GRATIS = "gratis"
    PLANO_PRO = "pro"
    PLANO_EMPRESA = "empresa"

    OPCOES_PLANO = [
        (PLANO_GRATIS, "Gratis"),
        (PLANO_PRO, "Pro"),
        (PLANO_EMPRESA, "Empresa"),
    ]

    nome = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    plano = models.CharField(max_length=20, choices=OPCOES_PLANO, default=PLANO_GRATIS)
    armazenamento_usado = models.BigIntegerField(default=0)
    limite_armazenamento = models.BigIntegerField(default=10737418240)
    criado_em = models.DateTimeField(auto_now_add=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = GerenciadorUsuario()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["nome"]

    def __str__(self) -> str:
        return self.email

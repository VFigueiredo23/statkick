from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from usuarios.models import Usuario


@admin.register(Usuario)
class UsuarioAdmin(BaseUserAdmin):
    ordering = ["id"]
    list_display = ["email", "nome", "plano", "armazenamento_usado", "limite_armazenamento", "is_staff"]
    readonly_fields = ["criado_em", "last_login"]
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Informacoes pessoais", {"fields": ("nome", "plano", "armazenamento_usado", "limite_armazenamento")}),
        ("Permissoes", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Datas importantes", {"fields": ("last_login", "criado_em")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "nome", "password1", "password2", "is_staff", "is_active"),
            },
        ),
    )
    search_fields = ("email", "nome")

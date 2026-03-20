# Roadmap de Transformacao para SaaS

## Diagnostico Atual

O projeto hoje funciona como um MVP single-tenant:

- o backend expõe tudo com `AllowAny`
- nao existem endpoints de login, cadastro, convite ou recuperacao de senha
- nao existe entidade de tenant, organizacao ou workspace
- `Equipe`, `Jogador`, `Partida`, `Evento` e `AvaliacaoJogador` nao pertencem a usuario nem organizacao
- as queries usam `.all()`, entao qualquer autenticacao futura ainda nao isolaria os dados
- o frontend nao tem sessao, perfil, troca de contexto, onboarding ou area administrativa de conta
- o modelo `Usuario` ja existe e ja tem `plano`, `armazenamento_usado` e `limite_armazenamento`, mas esses campos ainda nao controlam o produto

## O que ja existe e pode ser reaproveitado

- stack web pronta: Next.js + Django + PostgreSQL
- modelo de usuario customizado em `usuarios.Usuario`
- estrutura operacional de deploy na VPS e pipeline de publicacao
- dominio funcional do produto: partidas, jogadores, equipes, eventos e avaliacoes
- upload local de arquivos e contabilizacao de tamanho em `Partida.tamanho_armazenamento_video`

## Arquitetura SaaS Recomendada

Para este estagio, a melhor escolha e **multi-tenant por coluna no mesmo banco**, nao banco por cliente.

Entidades novas:

- `Organizacao`
- `MembroOrganizacao`
- `ConviteOrganizacao`
- `Auditoria` ou `EventoSistema`

Campos novos nas entidades principais:

- `organizacao` em `Equipe`
- `organizacao` em `Jogador`
- `organizacao` em `Partida`
- `organizacao` em `Evento`
- `organizacao` em `AvaliacaoJogador`
- `criado_por` nas entidades mais importantes, quando fizer sentido

Decisoes de produto recomendadas:

- o tenant inicial deve ser a **organizacao**, nao o usuario
- um usuario pode participar de varias organizacoes no futuro
- o plano e o limite de armazenamento devem migrar de `Usuario` para `Organizacao`
- nesta fase inicial, nao precisa cobrar, mas ja vale ter estados como `teste`, `ativo`, `suspenso`

## Fase 1: Fundacao SaaS

Objetivo: sair de MVP aberto para app autenticado e com isolamento de dados.

Entregas:

- autenticação real
- cadastro de conta
- criacao automatica da primeira organizacao no onboarding
- vínculo do usuario como `owner` dessa organizacao
- protecao das rotas e APIs
- escopo de todas as queries pela organizacao atual

Implementacao sugerida:

- backend com login por email e senha
- sessao ou token; para este projeto, a prioridade e simplicidade e previsibilidade
- middleware/servico para resolver a organizacao atual por usuario
- classes base ou mixins para filtrar queryset por `organizacao`

## Fase 2: Controle de Acesso

Objetivo: deixar o SaaS pronto para uso em equipe.

Perfis recomendados:

- `owner`
- `admin`
- `analista`
- `viewer`

Entregas:

- convites por email
- pagina de membros
- remocao e alteracao de papel
- restricoes por papel no backend e frontend

## Fase 3: Onboarding e Conta

Objetivo: sair da experiencia de sistema interno e entrar em experiencia de produto.

Entregas:

- tela de login
- tela de cadastro
- tela de esqueci minha senha
- primeiro acesso guiado
- pagina `Minha organizacao`
- pagina `Minha conta`
- indicador de uso de armazenamento

## Fase 4: Estrutura de Plano sem Cobranca

Objetivo: preparar a camada comercial sem integrar pagamento ainda.

Entregas:

- mover `plano`, `armazenamento_usado` e `limite_armazenamento` para `Organizacao`
- criar enums e regras como:
  - `teste`
  - `starter`
  - `pro`
  - `enterprise`
- criar regras de bloqueio por limite de armazenamento
- registrar data de inicio do teste
- registrar data de expiracao do teste

Nesta fase, o plano pode ser controlado manualmente pelo admin do sistema.

## Fase 5: Seguranca e Operacao

Objetivo: adequar o MVP a um produto real.

Entregas:

- pagina 403/404 e tratamento consistente de erro
- rate limiting basico na API
- logs estruturados
- trilha de auditoria para acoes criticas
- backups do Postgres e de `media/`
- politicas de exclusao e restauracao
- validacao de tamanho e tipo de upload

## Fase 6: Produto SaaS de Verdade

Depois da fundacao, entram itens de produto:

- dashboard por organizacao
- busca global
- filtros salvos
- compartilhamento interno de analises
- bibliotecas e templates de eventos
- relatorios por atleta, clube e competicao

## Gaps Criticos do Estado Atual

### 1. Sem isolamento de dados

Hoje o risco principal e estrutural: todas as entidades sao globais.

### 2. Sem autenticacao de produto

O sistema ainda funciona como um backoffice aberto.

### 3. Campos de plano no lugar errado

`Usuario.plano` atende mal um SaaS B2B/B2B2C. O limite precisa morar na organizacao.

### 4. Criacao implicita de equipes

Hoje `PartidaSerializer` faz `get_or_create` por nome de equipe. Em SaaS isso pode gerar dados duplicados e ambiguos por organizacao. Isso precisa passar a respeitar o escopo do tenant.

### 5. Arquivos locais sem camada de governanca

Os uploads estao ok para MVP, mas ainda faltam:

- ownership por organizacao
- quota real
- limpeza de arquivos orfaos
- politicas de retenção

## Ordem Recomendada de Execucao

1. Introduzir `Organizacao` e `MembroOrganizacao`
2. Migrar ownership dos dados para `organizacao`
3. Implementar auth e sessao
4. Fechar APIs para usuario autenticado
5. Criar onboarding e fluxo de criacao da primeira organizacao
6. Implementar papeis e convites
7. Mover controle de plano e armazenamento para organizacao
8. So depois pensar em cobranca

## Proximo Marco de Implementacao

O melhor proximo passo tecnico e:

**implementar a camada de organizacao + membership + escopo por tenant no backend**

Sem isso, qualquer tela de login que a gente fizer ainda vai sentar em cima de uma base sem isolamento.

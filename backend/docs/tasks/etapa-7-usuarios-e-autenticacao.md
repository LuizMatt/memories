# Etapa 7: Fase 2 — Usuários e Autenticação

> **Referência:** [`../CLAUDE.md`](../CLAUDE.md) e [`../ARCHITECTURE.md`](../ARCHITECTURE.md) (Seções 6, 16 e 18).

## Objetivo
Evoluir o backend para a **Fase 2**, introduzindo cadastro e autenticação de usuários com Spring Security + JWT (access token curto + refresh token), senhas com BCrypt, autorização baseada no dono do recurso (`owner_id` / `author_id`), favoritos por usuário (`user_favorite`) e rate limiting em endpoints sensíveis.

---

## Tasks

### Task 7.1: Migrations Flyway da Fase 2 (`V2` e `V3`)
**Arquivos:**
- `backend/src/main/resources/db/migration/V2__create_user_and_ownership.sql`
- `backend/src/main/resources/db/migration/V3__create_user_favorite.sql`

**Checklist de implementação:**
- [ ] Em `V2__create_user_and_ownership.sql`:
  - Criar tabela `app_user (id UUID PRIMARY KEY, email VARCHAR(255) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL, display_name VARCHAR(80) NOT NULL, role VARCHAR(20) NOT NULL DEFAULT 'USER', created_at TIMESTAMPTZ NOT NULL DEFAULT now())`
  - Inserir usuário sistema/legado padrão para associar registros pré-existentes da Fase 1
  - Adicionar `owner_id UUID NOT NULL REFERENCES app_user(id)` em `memory`
  - Adicionar `author_id UUID NOT NULL REFERENCES app_user(id)` em `memory_comment`
- [ ] Em `V3__create_user_favorite.sql`:
  - Criar tabela `user_favorite (user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE, memory_id UUID NOT NULL REFERENCES memory(id) ON DELETE CASCADE, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY (user_id, memory_id))`
  - Migrar favoritos existentes (`WHERE favorite = true`) para o usuário legado e remover a coluna booleana `memory.favorite`

### Task 7.2: Módulos `user/`, `auth/` e `common/security/` (Spring Security + JWT)
**Arquivos:**
- `backend/src/main/java/com/luizmatt/memories/user/...`
- `backend/src/main/java/com/luizmatt/memories/auth/...`
- `backend/src/main/java/com/luizmatt/memories/common/security/...`

**Checklist de implementação:**
- [ ] Adicionar `spring-boot-starter-security` e suporte a JWT (`spring-boot-starter-oauth2-resource-server` / `NimbusJwtDecoder` + `NimbusJwtEncoder` nativos do Spring Security)
- [ ] Configurar `PasswordEncoder` com `BCryptPasswordEncoder`
- [ ] Implementar endpoints `/api/v1/auth/register`, `/api/v1/auth/login`, `/api/v1/auth/refresh` e `/api/v1/users/me`
- [ ] Configurar `SecurityFilterChain` stateless (CSRF desabilitado para API stateless com Bearer token, `ProblemDetail` customizado para `401 Unauthorized` e `403 Forbidden`)

### Task 7.3: Autorização por Dono do Recurso e Favoritos por Usuário
**Checklist de implementação:**
- [ ] Associar `owner_id` ao usuário autenticado ao criar `Memory`
- [ ] Associar `author_id` e `authorName` (`displayName` do usuário) ao criar `Comment`
- [ ] Garantir que apenas o dono (ou `ADMIN`) possa editar ou apagar uma `Memory` (caso contrário, lançar `AccessDeniedException` → `403 Forbidden` em `ProblemDetail`)
- [ ] Garantir que apenas o autor do comentário, o dono da memória ou `ADMIN` possa apagar um comentário (`DELETE /api/v1/memories/{memoryId}/comments/{commentId}`)
- [ ] Atualizar `PUT` e `DELETE /api/v1/memories/{id}/favorite` para gravar/remover na tabela `user_favorite` para o usuário autenticado

### Task 7.4: Rate Limiting e Testes de Segurança (`*IT`)
- [ ] Implementar rate limiting em `/api/v1/auth/login`, `/api/v1/auth/register` e criação de conteúdo (`429 Too Many Requests` em `ProblemDetail`)
- [ ] Escrever testes unitários e de integração cobrindo:
  - Registro, login, refresh token e rejeição de credenciais inválidas (`401`)
  - Tentativa de editar/apagar memória sem token (`401`) ou com token de outro usuário (`403`)
  - Isolamento de favoritos por usuário (`user A` favorita não afeta `favorite` visto por `user B`)

---

## Verificação e Critérios de Aceite (Definition of Done)

- [ ] `./mvnw verify` passa todos os testes unitários e de integração de segurança
- [ ] Nenhuma senha ou token é logado
- [ ] Todos os erros `401`, `403` e `429` saem em formato `ProblemDetail`
- [ ] Commit realizado: `feat: implement JWT authentication, owner authorization and per-user favorites`

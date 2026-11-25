# Etapa 1: Esqueleto + Docker

> **Referência:** [`../CLAUDE.md`](../CLAUDE.md) e [`../ARCHITECTURE.md`](../ARCHITECTURE.md) (Seções 6, 11, 12, 13, 14, 15 e 18).

## Objetivo
Configurar a infraestrutura base do projeto: container PostgreSQL 17 via Docker Compose, configurações separadas por profile (`dev`, `test`, `prod`), primeira migration do Flyway (`V1__create_memory_and_comment.sql`), Actuator Health check e suporte a testes de integração com Testcontainers compartilhado.

---

## Tasks

### Task 1.1: Configurar Docker Compose (`backend/compose.yaml`)
**Arquivo:** `backend/compose.yaml`
- [ ] Definir serviço `db` com imagem `postgres:17-alpine`
- [ ] Configurar variáveis `POSTGRES_DB=memories`, `POSTGRES_USER=memories`, `POSTGRES_PASSWORD=memories`
- [ ] Expor porta `5432:5432` e volume nomeado `pgdata:/var/lib/postgresql/data`
- [ ] Configurar `healthcheck` usando `pg_isready -U memories -d memories` (interval 5s, timeout 3s, retries 10)
- [ ] Definir esqueleto do serviço `app` com `profiles: ["full"]` para que no dia a dia (`./mvnw spring-boot:run`) apenas o banco `db` seja iniciado automaticamente pelo Spring Boot Docker Compose Support

### Task 1.2: Configurar `application.yml` e Profiles (`dev`, `test`, `prod`)
**Arquivos:**
- `backend/src/main/resources/application.yml`
- `backend/src/main/resources/application-dev.yml`
- `backend/src/main/resources/application-prod.yml`
- `backend/src/test/resources/application-test.yml`

**Checklist de implementação:**
- [ ] Em `application.yml` (base comum):
  - `spring.application.name=memories`
  - `spring.profiles.default=dev`
  - `spring.jpa.open-in-view=false`
  - `spring.jpa.hibernate.ddl-auto=validate`
  - `spring.jpa.properties.hibernate.jdbc.time_zone=UTC`
  - `spring.flyway.enabled=true`
  - `spring.servlet.multipart.max-file-size=5MB` e `max-request-size=6MB`
  - `management.endpoints.web.exposure.include=health,info`
  - `management.endpoint.health.probes.enabled=true`
- [ ] Em `application-dev.yml`:
  - Conexão padrão de dev (`jdbc:postgresql://localhost:5432/memories`, usuário/senha `memories`) ou integração automática via `spring.docker.compose.enabled=true`
  - Diretório local de storage `./uploads`
  - Exposição ampliada do actuator em dev (`health,info,metrics`)
- [ ] Em `application-prod.yml`:
  - Datasource via variáveis obrigatórias `DB_URL`, `DB_USER`, `DB_PASS`
  - Storage via `STORAGE_LOCAL_PATH`
  - `management.endpoint.health.show-details=never`
- [ ] Em `application-test.yml`:
  - `spring.docker.compose.enabled=false` (os testes usam Testcontainers)

### Task 1.3: Criar Migration V1 do Flyway
**Arquivo:** `backend/src/main/resources/db/migration/V1__create_memory_and_comment.sql`
- [ ] Criar tabela `memory`:
  - `id UUID PRIMARY KEY`
  - `title VARCHAR(120) NOT NULL`
  - `description VARCHAR(5000) NOT NULL`
  - `image_key VARCHAR(100) NOT NULL`
  - `favorite BOOLEAN NOT NULL DEFAULT FALSE`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
  - `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- [ ] Criar índice `idx_memory_created_at ON memory (created_at DESC)`
- [ ] Criar tabela `memory_comment`:
  - `id UUID PRIMARY KEY`
  - `memory_id UUID NOT NULL REFERENCES memory (id) ON DELETE CASCADE`
  - `author_name VARCHAR(80) NOT NULL`
  - `content VARCHAR(1000) NOT NULL`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- [ ] Criar índice `idx_memory_comment_memory_created ON memory_comment (memory_id, created_at)`

### Task 1.4: Configurar Auditoria JPA e Suporte a Testcontainers
**Arquivos:**
- `backend/src/main/java/com/luizmatt/memories/common/config/JpaConfig.java`
- `backend/src/test/java/com/luizmatt/memories/support/TestcontainersConfiguration.java`
- `backend/src/test/java/com/luizmatt/memories/support/IntegrationTestBase.java`
- `backend/src/test/java/com/luizmatt/memories/ApplicationIT.java`

**Checklist de implementação:**
- [ ] Habilitar `@EnableJpaAuditing` em `JpaConfig`
- [ ] Configurar container singleton `PostgreSQLContainer` (`postgres:17-alpine`) com `@ServiceConnection` em `TestcontainersConfiguration` para ser reutilizado entre todas as classes `*IT`
- [ ] Criar `ApplicationIT` que sobe o contexto completo (`@SpringBootTest`, `@AutoConfigureMockMvc`), valida se a migration `V1` rodou no Postgres do Testcontainers e faz `GET /actuator/health` esperando `200 OK` e `{"status":"UP"}`

---

## Verificação e Critérios de Aceite (Definition of Done)

- [ ] `docker compose up -d db` sobe o Postgres 17 saudável (`healthy`)
- [ ] `./mvnw verify` executa `ApplicationIT` com Testcontainers, aplica a migration `V1` do Flyway e valida `/actuator/health`
- [ ] `./mvnw spring-boot:run` sobe a aplicação em `dev`, conecta ao Postgres e aplica `V1`
- [ ] Commit realizado: `feat: configure docker compose, flyway V1 migration and testcontainers setup`

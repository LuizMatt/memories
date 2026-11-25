# Tasks do Roadmap — Backend Memories (Spring Boot)

Este diretório contém o plano detalhado de implementação de cada etapa da reescrita do backend do **Memories** em Java 21 + Spring Boot 4.1.x + PostgreSQL 17, seguindo rigorosamente o [`../CLAUDE.md`](../CLAUDE.md) e o [`../ARCHITECTURE.md`](../ARCHITECTURE.md).

## Regras Gerais de Execução

- **Uma etapa por vez**, na ordem abaixo. Não avançar para a próxima etapa sem cumprir o *Definition of Done* da etapa atual.
- **TDD e testes obrigatórios**: toda regra de negócio em Service tem teste unitário (`*Test`), e todo endpoint tem teste de integração (`*IT`) com Testcontainers + PostgreSQL real + MockMvc.
- **Zero vazamento de entidades JPA**: controllers recebem e devolvem apenas DTOs (`record`).
- **Schema gerenciado exclusivamente via Flyway**: `spring.jpa.hibernate.ddl-auto=validate` e `spring.jpa.open-in-view=false`.
- **Erros padronizados**: sempre `ProblemDetail` (RFC 9457) via `@RestControllerAdvice` único (`GlobalExceptionHandler`).

---

## Índice de Etapas

| Etapa | Arquivo | Foco Principal | Status |
|---|---|---|---|
| **Etapa 0** | [`etapa-0-preparacao.md`](./etapa-0-preparacao.md) | Preparação do repositório, bootstrap do projeto Spring Boot 4.1.x (Java 21, Maven Wrapper) e `.gitignore` | 🔄 Em andamento |
| **Etapa 1** | [`etapa-1-esqueleto-e-docker.md`](./etapa-1-esqueleto-e-docker.md) | `compose.yaml` (Postgres 17), profiles (`dev`/`test`/`prod`), Flyway `V1`, Actuator Health e Testcontainers base | ⏳ Pendente |
| **Etapa 2** | [`etapa-2-crud-memory.md`](./etapa-2-crud-memory.md) | CRUD de `Memory` (sem upload real ainda), paginação (`PageResponse`), allowlist de `sort`, validação e `GlobalExceptionHandler` (`ProblemDetail`) | ⏳ Pendente |
| **Etapa 3** | [`etapa-3-upload-imagem.md`](./etapa-3-upload-imagem.md) | `ImageStorage`, `LocalImageStorage`, `ImageValidator` (magic bytes, 5 MB), endpoints de imagem/arquivos e consistência transacional (compensação + `afterCommit`) | ⏳ Pendente |
| **Etapa 4** | [`etapa-4-comentarios-e-favoritos.md`](./etapa-4-comentarios-e-favoritos.md) | Módulo `comment/` paginado, `PUT`/`DELETE /favorite` idempotentes e projeção de `commentCount` em query única (sem N+1) | ⏳ Pendente |
| **Etapa 5** | [`etapa-5-qualidade-e-operacao.md`](./etapa-5-qualidade-e-operacao.md) | OpenAPI/Swagger (`springdoc-openapi`), filtro `X-Request-Id` + MDC, logs estruturados em `prod`, CORS tipado, `Dockerfile` multi-stage, README e CI | ⏳ Pendente |
| **Etapa 6** | [`etapa-6-integracao-frontend.md`](./etapa-6-integracao-frontend.md) | Adaptação do frontend React para o contrato `/api/v1` e remoção definitiva do `backend-legacy/` | ⏳ Pendente |
| **Etapa 7** | [`etapa-7-usuarios-e-autenticacao.md`](./etapa-7-usuarios-e-autenticacao.md) | Fase 2: `app_user`, autenticação JWT + refresh token, autorização por dono, favoritos por usuário (`user_favorite`) e rate limiting | ⏳ Pendente |
| **Etapa 8** | [`etapa-8-evolucoes-opcionais.md`](./etapa-8-evolucoes-opcionais.md) | Evoluções opcionais: `S3ImageStorage` (MinIO), geração de thumbnails, busca por texto/tags e deploy | ⏳ Pendente |

---

## Definition of Done (para todas as etapas de código)

- [ ] Compila e `./mvnw verify` passa (testes unitários + integração com Testcontainers)
- [ ] Migrations Flyway criadas (se houve mudança de schema)
- [ ] Testes unitários (`*Test`) e de integração (`*IT`) escritos cobrindo caminhos felizes e erros
- [ ] Erros tratados em `ProblemDetail` no `GlobalExceptionHandler`
- [ ] Endpoints documentados no OpenAPI (a partir da Etapa 5, ou anotações mínimas)
- [ ] `ARCHITECTURE.md` atualizado se alguma decisão estrutural mudou
- [ ] Mudanças de contrato que afetam o frontend listadas

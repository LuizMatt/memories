# Etapa 5: Qualidade e Operação

> **Referência:** [`../CLAUDE.md`](../CLAUDE.md) e [`../ARCHITECTURE.md`](../ARCHITECTURE.md) (Seções 12, 13, 15, 16 e 18).

## Objetivo
Preparar o backend para operação real: documentação interativa da API via OpenAPI/Swagger (`springdoc-openapi`), rastreabilidade de requisições com `X-Request-Id` no MDC e no `ProblemDetail` de erros 500, logs estruturados JSON em `prod`, configuração tipada de CORS, containerização completa com `Dockerfile` multi-stage não-root, atualização do `README.md` do backend e pipeline de CI no GitHub Actions.

---

## Tasks

### Task 5.1: Filtro de `X-Request-Id` (MDC) e Logs Estruturados em `prod`
**Arquivos:**
- `backend/src/main/java/com/luizmatt/memories/common/web/RequestIdFilter.java`
- `backend/src/main/java/com/luizmatt/memories/common/exception/GlobalExceptionHandler.java`
- `backend/src/main/resources/application-prod.yml`
- `backend/src/test/java/com/luizmatt/memories/common/web/RequestIdFilterIT.java`

**Checklist de implementação:**
- [ ] Implementar `RequestIdFilter extends OncePerRequestFilter`:
  - Ler header `X-Request-Id` da requisição (se ausente ou inválido, gerar um novo `UUID.randomUUID().toString()`)
  - Colocar no `MDC.put("requestId", requestId)` e no atributo da request, remover no `finally`
  - Devolver sempre o header `X-Request-Id` na resposta HTTP
- [ ] No `GlobalExceptionHandler`, ao tratar erro inesperado `500`, incluir a propriedade `"requestId"` no `ProblemDetail` e logar o erro com o `requestId` ativo no MDC
- [ ] Configurar formato de log em `application.yml` para exibir `[%X{requestId}]` no console em `dev` e configurar `logging.structured.format.console=ecs` (ou `logstash`) em `application-prod.yml`
- [ ] Escrever teste de integração `RequestIdFilterIT` validando geração automática de `X-Request-Id`, propagação quando enviado pelo cliente e presença no `ProblemDetail` de erro 500

### Task 5.2: CORS Configurável via `@ConfigurationProperties`
**Arquivos:**
- `backend/src/main/java/com/luizmatt/memories/common/config/CorsProperties.java`
- `backend/src/main/java/com/luizmatt/memories/common/config/CorsConfig.java`
- `backend/src/test/java/com/luizmatt/memories/common/config/CorsConfigIT.java`

**Checklist de implementação:**
- [ ] Criar `@ConfigurationProperties(prefix = "app.cors") record CorsProperties(List<String> allowedOrigins)`
- [ ] Configurar em `application-dev.yml`: `app.cors.allowed-origins: http://localhost:5173`
- [ ] Configurar em `application-prod.yml`: `app.cors.allowed-origins: ${APP_CORS_ALLOWED_ORIGINS}`
- [ ] Registrar `WebMvcConfigurer` em `CorsConfig` aplicando allowlist de origens para `/api/**`, métodos `GET, POST, PUT, PATCH, DELETE, OPTIONS`, headers `Content-Type, Authorization, X-Request-Id` e `exposedHeaders: Location, X-Request-Id`
- [ ] Testar requisição preflight `OPTIONS` em `CorsConfigIT`

### Task 5.3: Documentação OpenAPI / Swagger UI (`springdoc-openapi`)
**Arquivos:**
- `backend/pom.xml`
- `backend/src/main/java/com/luizmatt/memories/common/config/OpenApiConfig.java`
- `backend/src/main/resources/application-prod.yml`

**Checklist de implementação:**
- [ ] Adicionar dependência `springdoc-openapi-starter-webmvc-ui` compatível com a versão do Spring Boot no `pom.xml`
- [ ] Criar `OpenApiConfig` com metadados da API (`Memories API`, `v1`, descrição)
- [ ] Adicionar anotações `@Tag` e `@Operation` concisas nos controllers (`MemoryController`, `CommentController`, `FileController`)
- [ ] Desabilitar Swagger UI e `/v3/api-docs` por padrão no profile `prod` (`springdoc.api-docs.enabled=false`, `springdoc.swagger-ui.enabled=false`)
- [ ] Validar que `GET /v3/api-docs` retorna `200 OK` no profile de teste/dev

### Task 5.4: `Dockerfile` Multi-Stage, `.dockerignore` e Profile `full` do Compose
**Arquivos:**
- `backend/Dockerfile`
- `backend/.dockerignore`
- `backend/compose.yaml`

**Checklist de implementação:**
- [ ] Criar `backend/.dockerignore` ignorando `target/`, `.git/`, `.env*`, `uploads/`, `.idea/`, `.vscode/`
- [ ] Criar `backend/Dockerfile` multi-stage conforme Seção 13 do `ARCHITECTURE.md`:
  - Stage `build`: `eclipse-temurin:21-jdk`, cache de dependências com `./mvnw -q dependency:go-offline`, build com `./mvnw -q -DskipTests package`
  - Stage `runtime`: `eclipse-temurin:21-jre`, criação de usuário não-root `appuser`, diretório `/data/uploads` com permissão para `appuser`, `ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]`
- [ ] Testar `docker compose --profile full up --build -d` e verificar `http://localhost:8080/actuator/health`

### Task 5.5: `backend/README.md` e CI (GitHub Actions)
**Arquivos:**
- `backend/README.md`
- `.github/workflows/backend-ci.yml`

**Checklist de implementação:**
- [ ] Documentar em `backend/README.md`: pré-requisitos, comandos para subir o banco, rodar a aplicação, rodar testes unitários e de integração, variáveis de ambiente e links úteis (Swagger, Health)
- [ ] Criar workflow `.github/workflows/backend-ci.yml` que executa `./mvnw -B verify` em Ubuntu com Java 21 (Temurin) e Docker habilitado para o Testcontainers

---

## Verificação e Critérios de Aceite (Definition of Done)

- [ ] `./mvnw verify` passa todos os testes
- [ ] `docker compose --profile full up --build` sobe `db` + `app` e responde `200` em `/actuator/health` e `/swagger-ui.html`
- [ ] Header `X-Request-Id` presente em todas as respostas
- [ ] Commit realizado: `feat: add openapi docs, request-id filter, cors config, multi-stage dockerfile and CI`

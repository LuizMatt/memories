# Etapa 2: CRUD de Memory (sem imagem real)

> **Referência:** [`../CLAUDE.md`](../CLAUDE.md) e [`../ARCHITECTURE.md`](../ARCHITECTURE.md) (Seções 5, 6, 7, 8, 9, 11, 14 e 18).

## Objetivo
Implementar a estrutura de domínio, persistência, serviço, controller e tratamento global de erros (`ProblemDetail`) para a entidade `Memory`. Nesta etapa, até a Etapa 3 introduzir o `ImageStorage` real, `image_key` será tratada de forma controlada (ou usando um stub/chave padrão temporária quando enviada) para permitir testar todo o ciclo de CRUD, paginação, ordenação segura e validação.

---

## Tasks

### Task 2.1: DTO de Paginação (`PageResponse`) e Exceções Base / `GlobalExceptionHandler`
**Arquivos:**
- `backend/src/main/java/com/luizmatt/memories/common/web/PageResponse.java`
- `backend/src/main/java/com/luizmatt/memories/common/exception/ResourceNotFoundException.java`
- `backend/src/main/java/com/luizmatt/memories/common/exception/InvalidParameterException.java`
- `backend/src/main/java/com/luizmatt/memories/common/exception/GlobalExceptionHandler.java`

**Checklist de implementação:**
- [ ] Criar `record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages)` com método utilitário `from(Page<T> page)`
- [ ] Criar hierarquia de exceções unchecked de domínio (`ResourceNotFoundException`, `InvalidParameterException`) sem acoplamento com HTTP
- [ ] Implementar `GlobalExceptionHandler extends ResponseEntityExceptionHandler` retornando `ProblemDetail` (`application/problem+json`) para:
  - `MethodArgumentNotValidException` / `BindException` → `400`, `type: urn:memories:problem:validation-error`, lista `errors: [{field, message}]`
  - `MethodArgumentTypeMismatchException`, `ConstraintViolationException`, `InvalidParameterException` → `400`, `type: urn:memories:problem:invalid-parameter`
  - `ResourceNotFoundException` → `404`, `type: urn:memories:problem:not-found`
  - `Exception` (fallback) → `500`, `type: urn:memories:problem:internal-error`, logando stack trace com SLF4J sem expor mensagem interna na resposta

### Task 2.2: Entidade `Memory`, `MemoryRepository` e `MemoryNotFoundException`
**Arquivos:**
- `backend/src/main/java/com/luizmatt/memories/memory/Memory.java`
- `backend/src/main/java/com/luizmatt/memories/memory/MemoryRepository.java`
- `backend/src/main/java/com/luizmatt/memories/memory/MemoryNotFoundException.java`

**Checklist de implementação:**
- [ ] Mapear entidade JPA `Memory` para a tabela `memory`:
  - `id` com `@Id` e `@UuidGenerator(style = UuidGenerator.Style.TIME)`
  - `title`, `description`, `imageKey` (`image_key`), `favorite`
  - `createdAt` (`@CreatedDate`) e `updatedAt` (`@LastModifiedDate`) com `@EntityListeners(AuditingEntityListener.class)`
  - Sem Lombok: construtor protegido para JPA, construtor de domínio, getters explícitos, métodos de negócio (`updateText(title, description)`, `changeImageKey(imageKey)`, `markFavorite(boolean)`), `equals`/`hashCode` por `id`
- [ ] Criar `MemoryRepository extends JpaRepository<Memory, UUID>`
- [ ] Criar `MemoryNotFoundException extends ResourceNotFoundException`

### Task 2.3: DTOs e `MemoryMapper`
**Arquivos:**
- `backend/src/main/java/com/luizmatt/memories/memory/dto/CreateMemoryRequest.java`
- `backend/src/main/java/com/luizmatt/memories/memory/dto/UpdateMemoryRequest.java`
- `backend/src/main/java/com/luizmatt/memories/memory/dto/MemoryResponse.java`
- `backend/src/main/java/com/luizmatt/memories/memory/dto/MemorySummaryResponse.java`
- `backend/src/main/java/com/luizmatt/memories/memory/MemoryMapper.java`

**Checklist de implementação:**
- [ ] `CreateMemoryRequest`: `@NotBlank @Size(max = 120) String title`, `@NotBlank @Size(max = 5000) String description` com trim no construtor compacto
- [ ] `UpdateMemoryRequest`: `@Size(min = 1, max = 120) String title`, `@Size(min = 1, max = 5000) String description` com trim no construtor compacto (se após trim ficar vazio, permanece `""` para disparar `@Size(min = 1)`)
- [ ] `MemoryResponse`: `UUID id, String title, String description, String imageUrl, boolean favorite, long commentCount, Instant createdAt, Instant updatedAt`
- [ ] `MemorySummaryResponse`: `UUID id, String title, String imageUrl, boolean favorite, long commentCount, Instant createdAt`
- [ ] `MemoryMapper`: converte `Memory` para `MemoryResponse` e `MemorySummaryResponse` montando `imageUrl` como `"/api/v1/files/" + memory.getImageKey()`

### Task 2.4: `MemoryService` e Testes Unitários (`MemoryServiceTest`)
**Arquivos:**
- `backend/src/main/java/com/luizmatt/memories/memory/MemoryService.java`
- `backend/src/test/java/com/luizmatt/memories/memory/MemoryServiceTest.java`

**Checklist de implementação:**
- [ ] Implementar casos de uso em `MemoryService`:
  - `create(CreateMemoryRequest request)`
  - `findAll(int page, int size, String sort)` com validação de paginação (`page >= 0`, `1 <= size <= 50`) e allowlist de `sort` (`createdAt`, `title`)
  - `findById(UUID id)` (lança `MemoryNotFoundException` se não existir)
  - `update(UUID id, UpdateMemoryRequest request)` (atualiza parcialmente apenas campos não-nulos)
  - `delete(UUID id)` (lança `MemoryNotFoundException` se não existir)
- [ ] Escrever testes unitários com Mockito e AssertJ em `MemoryServiceTest`:
  - Criação com sucesso
  - Busca por ID existente e inexistente (`shouldThrowWhenMemoryDoesNotExist`)
  - Atualização parcial de título e descrição
  - Rejeição de `size > 50` ou propriedade de `sort` fora da allowlist (`shouldRejectInvalidSortProperty`)
  - Exclusão de memória existente e erro ao excluir inexistente

### Task 2.5: `MemoryController` e Testes de Integração (`MemoryControllerIT`)
**Arquivos:**
- `backend/src/main/java/com/luizmatt/memories/memory/MemoryController.java`
- `backend/src/test/java/com/luizmatt/memories/memory/MemoryControllerIT.java`

**Checklist de implementação:**
- [ ] Implementar endpoints em `/api/v1/memories`:
  - `POST /api/v1/memories` → `201 Created` + header `Location: /api/v1/memories/{id}` + `MemoryResponse`
  - `GET /api/v1/memories` → `200 OK` + `PageResponse<MemorySummaryResponse>` (defaults: `page=0`, `size=12`, `sort=createdAt,desc`)
  - `GET /api/v1/memories/{id}` → `200 OK` + `MemoryResponse`
  - `PATCH /api/v1/memories/{id}` → `200 OK` + `MemoryResponse`
  - `DELETE /api/v1/memories/{id}` → `204 No Content`
- [ ] Escrever testes de integração em `MemoryControllerIT` (Testcontainers + MockMvc):
  - `POST` válido retorna `201`, header `Location` e persiste no Postgres
  - `POST` com `title` em branco ou maior que 120 chars retorna `400` em formato `ProblemDetail` com `errors`
  - `GET /api/v1/memories` retorna página ordenada com `PageResponse`
  - `GET /api/v1/memories?size=100` ou `sort=secretField,asc` retorna `400` (`ProblemDetail`)
  - `GET /api/v1/memories/{id}` retorna `200` quando existe e `404` (`ProblemDetail`) quando não existe ou `400` quando UUID é inválido
  - `PATCH /api/v1/memories/{id}` atualiza campos enviados e retorna `404` para ID inexistente
  - `DELETE /api/v1/memories/{id}` retorna `204` e remove do banco (`404` se repetir)

---

## Verificação e Critérios de Aceite (Definition of Done)

- [ ] `./mvnw test` passa todos os testes unitários (`MemoryServiceTest`)
- [ ] `./mvnw verify` passa todos os testes de integração (`MemoryControllerIT`, `ApplicationIT`)
- [ ] Todos os erros retornam `application/problem+json` sem vazar stack trace
- [ ] Nenhuma entidade JPA é exposta no controller
- [ ] Commit realizado: `feat: implement memory CRUD, pagination, validation and problem detail error handling`

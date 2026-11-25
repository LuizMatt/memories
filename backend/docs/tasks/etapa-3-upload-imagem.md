# Etapa 3: Upload de Imagem

> **Referência:** [`../CLAUDE.md`](../CLAUDE.md) e [`../ARCHITECTURE.md`](../ARCHITECTURE.md) (Seções 7, 8, 10, 14 e 18).

## Objetivo
Implementar o módulo desacoplado `storage/` com a interface `ImageStorage`, validação de imagens por assinatura binária (*magic bytes*) e tamanho máximo (5 MB), armazenamento local seguro em disco (`LocalImageStorage`), endpoint de leitura de arquivos (`GET /api/v1/files/{key}`), integração com a criação/atualização/exclusão de `Memory` e garantia de consistência entre banco de dados e sistema de arquivos.

---

## Tasks

### Task 3.1: Propriedades, Exceções de Storage e `ImageValidator`
**Arquivos:**
- `backend/src/main/java/com/luizmatt/memories/storage/StorageProperties.java`
- `backend/src/main/java/com/luizmatt/memories/storage/ImageTooLargeException.java`
- `backend/src/main/java/com/luizmatt/memories/storage/UnsupportedImageTypeException.java`
- `backend/src/main/java/com/luizmatt/memories/storage/ImageNotFoundException.java`
- `backend/src/main/java/com/luizmatt/memories/storage/ImageValidator.java`
- `backend/src/test/java/com/luizmatt/memories/storage/ImageValidatorTest.java`

**Checklist de implementação:**
- [ ] Criar `@ConfigurationProperties(prefix = "app.storage") record StorageProperties(Path localPath, DataSize maxFileSize)`
- [ ] Criar exceções de domínio:
  - `ImageTooLargeException` → mapeada no `GlobalExceptionHandler` junto com `MaxUploadSizeExceededException` para `413 Payload Too Large` (`type: urn:memories:problem:image-too-large`)
  - `UnsupportedImageTypeException` → mapeada no `GlobalExceptionHandler` para `415 Unsupported Media Type` (`type: urn:memories:problem:unsupported-image-type`)
  - `ImageNotFoundException extends ResourceNotFoundException` → `404 Not Found`
- [ ] Implementar `ImageValidator`:
  - Rejeitar arquivo nulo ou vazio (`400` ou `415`)
  - Rejeitar arquivo `> 5 MB` com `ImageTooLargeException`
  - Inspecionar os primeiros 12 bytes (*magic bytes*) ignorando o nome original e o `Content-Type` enviado pelo cliente:
    - JPEG: `FF D8 FF` → extensão `.jpg`, media type `image/jpeg`
    - PNG: `89 50 4E 47 0D 0A 1A 0A` → extensão `.png`, media type `image/png`
    - WebP: bytes `0..3 == "RIFF"` e bytes `8..11 == "WEBP"` → extensão `.webp`, media type `image/webp`
  - Se não corresponder a nenhuma assinatura, lançar `UnsupportedImageTypeException`
- [ ] Escrever testes unitários em `ImageValidatorTest` cobrindo JPEG, PNG, WebP válidos, arquivo `.jpg` falso (texto ou executável disfarçado), arquivo vazio e arquivo acima de 5 MB

### Task 3.2: `ImageStorage` e `LocalImageStorage`
**Arquivos:**
- `backend/src/main/java/com/luizmatt/memories/storage/ImageStorage.java`
- `backend/src/main/java/com/luizmatt/memories/storage/LocalImageStorage.java`
- `backend/src/test/java/com/luizmatt/memories/storage/LocalImageStorageTest.java`

**Checklist de implementação:**
- [ ] Definir interface `ImageStorage`:
  - `String store(MultipartFile file)`
  - `Resource load(String key)`
  - `void delete(String key)`
- [ ] Implementar `LocalImageStorage`:
  - Criar diretório base no startup se não existir (`Files.createDirectories`)
  - Em `store`: validar via `ImageValidator`, gerar chave `<UUID>.<ext>` (UUID v4/v7 aleatório + extensão derivada dos magic bytes), gravar no diretório base e devolver apenas a chave
  - Em `load`: validar a chave contra a regex `^[0-9a-f-]{36}\.(jpg|png|webp)$`, resolver o path normalizado, garantir `resolvedPath.startsWith(baseDir)` (prevenção de *path traversal*) e verificar existência (senão lançar `ImageNotFoundException`)
  - Em `delete`: remover de forma idempotente (`Files.deleteIfExists`), logando `WARN` caso ocorra `IOException` sem derrubar o fluxo chamador
- [ ] Escrever testes unitários em `LocalImageStorageTest` usando `@TempDir` (store, load, delete idempotente, bloqueio de `../` path traversal)

### Task 3.3: `FileController` (`GET /api/v1/files/{key}`)
**Arquivos:**
- `backend/src/main/java/com/luizmatt/memories/storage/FileController.java`
- `backend/src/test/java/com/luizmatt/memories/storage/FileControllerIT.java`

**Checklist de implementação:**
- [ ] Implementar `GET /api/v1/files/{key}`:
  - Carregar `Resource` via `ImageStorage.load(key)`
  - Determinar `Content-Type` (`image/jpeg`, `image/png`, `image/webp`) pela extensão validada
  - Adicionar headers de segurança e cache:
    - `X-Content-Type-Options: nosniff`
    - `Cache-Control: public, max-age=31536000, immutable`
- [ ] Escrever testes de integração em `FileControllerIT`:
  - Download de imagem existente retorna `200`, bytes exatos, `Content-Type` e headers de cache/segurança
  - Chave inexistente ou formato inválido retorna `404` (`ProblemDetail`)

### Task 3.4: Integrar Upload e Consistência Transacional no `MemoryService` e `MemoryController`
**Arquivos:**
- `backend/src/main/java/com/luizmatt/memories/memory/MemoryService.java`
- `backend/src/main/java/com/luizmatt/memories/memory/MemoryController.java`
- `backend/src/test/java/com/luizmatt/memories/memory/MemoryServiceTest.java`
- `backend/src/test/java/com/luizmatt/memories/memory/MemoryControllerIT.java`

**Checklist de implementação:**
- [ ] Atualizar `POST /api/v1/memories` para receber `multipart/form-data` (`@Valid @ModelAttribute CreateMemoryRequest` + `@RequestParam("image") MultipartFile image`)
- [ ] Criar endpoint `PUT /api/v1/memories/{id}/image` recebendo `multipart/form-data` (`@RequestParam("image") MultipartFile image`) → `200 OK` + `MemoryResponse`
- [ ] Implementar fluxos de consistência arquivo ↔ banco no `MemoryService` (Seção 10 do `ARCHITECTURE.md`):
  - **Criar memória:** `key = imageStorage.store(image)` → salvar no banco; se `repository.save`/`flush` lançar exceção, executar bloco de compensação `imageStorage.delete(key)` antes de propagar o erro
  - **Trocar imagem (`updateImage`):** buscar memória → `newKey = imageStorage.store(image)` → atualizar `memory.changeImageKey(newKey)` → registrar `TransactionSynchronization.afterCommit(() -> imageStorage.delete(oldKey))`
  - **Apagar memória (`delete`):** buscar memória → `repository.delete(memory)` → registrar `TransactionSynchronization.afterCommit(() -> imageStorage.delete(oldKey))`
- [ ] Adicionar testes unitários e de integração:
  - Upload com JPEG/PNG/WebP cria memória e a URL `/api/v1/files/{key}` serve a imagem
  - Upload de `.jpg` falso (texto disfarçado) retorna `415` (`ProblemDetail`)
  - Upload maior que 5 MB retorna `413` (`ProblemDetail`)
  - `PUT /api/v1/memories/{id}/image` substitui a imagem e apaga o arquivo antigo do disco após o commit
  - `DELETE /api/v1/memories/{id}` apaga o registro do banco e remove o arquivo do disco após o commit
  - Simulação de falha ao persistir no banco durante `create` remove o arquivo recém-gravado do disco (compensação contra arquivos órfãos)

---

## Verificação e Critérios de Aceite (Definition of Done)

- [ ] `./mvnw verify` passa com todos os testes unitários e de integração verdes
- [ ] Nenhum acesso direto a `Files.*` existe fora do pacote `storage/`
- [ ] Consistência transacional testada (compensação em falha de create e remoção `afterCommit` em update/delete)
- [ ] Commit realizado: `feat: implement image storage with magic-byte validation and transactional consistency`

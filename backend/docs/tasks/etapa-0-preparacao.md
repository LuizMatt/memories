# Etapa 0: Preparação

> **Referência:** [`../CLAUDE.md`](../CLAUDE.md) e [`../ARCHITECTURE.md`](../ARCHITECTURE.md) (Seções 3, 4 e 18).

## Objetivo
Organizar a estrutura física do repositório separando o backend Node legado (`backend-legacy/`) e inicializar o projeto Maven com Java 21 e Spring Boot 4.1.x dentro de `backend/`, com wrapper `./mvnw` funcional e `.gitignore` adequado.

---

## Tasks

### Task 0.1: Isolar o backend legado e organizar documentação
- [x] Mover o antigo `backend/` (Node/Express) para `backend-legacy/`
- [x] Criar diretório `backend/docs/` e mover `CLAUDE.md` e `ARCHITECTURE.md` para dentro dele
- [x] Criar estrutura `backend/docs/tasks/` com o planejamento de todas as etapas

### Task 0.2: Gerar estrutura base do projeto Spring Boot em `backend/`
**Arquivos a criar:**
- `backend/pom.xml`
- `backend/mvnw` e `backend/mvnw.cmd`
- `backend/.mvn/wrapper/maven-wrapper.properties`
- `backend/src/main/java/com/luizmatt/memories/MemoriesApplication.java`
- `backend/src/main/resources/application.yml`
- `backend/src/test/java/com/luizmatt/memories/MemoriesApplicationTests.java`

**Checklist de implementação:**
- [ ] Configurar `pom.xml` com:
  - Java 21 (`<java.version>21</java.version>`)
  - Spring Boot 4.1.x parent (ou versão estável mais recente disponível no Maven Central compatível com a especificação; validar resolução do Maven)
  - Dependências principais:
    - `spring-boot-starter-web` (ou starter web correspondente no Boot 4)
    - `spring-boot-starter-validation`
    - `spring-boot-starter-data-jpa`
    - `spring-boot-starter-actuator`
    - `org.flywaydb:flyway-core` + `org.flywaydb:flyway-database-postgresql`
    - `org.postgresql:postgresql` (runtime)
    - `spring-boot-docker-compose` (developmentOnly / optional)
  - Dependências de teste:
    - `spring-boot-starter-test`
    - `spring-boot-testcontainers`
    - `org.testcontainers:postgresql`
    - `org.testcontainers:junit-jupiter`
  - Plugins:
    - `spring-boot-maven-plugin`
    - `maven-surefire-plugin` (para testes unitários `*Test.java` em `./mvnw test`)
    - `maven-failsafe-plugin` (para testes de integração `*IT.java` em `./mvnw verify`)
- [ ] Incluir Maven Wrapper (`mvnw`, `mvnw.cmd`, `.mvn/`)
- [ ] Criar classe principal `com.luizmatt.memories.MemoriesApplication`

### Task 0.3: Configurar `.gitignore` do backend
**Arquivo:** `backend/.gitignore`
- [ ] Ignorar artefatos de build Maven (`target/`, `*.log`)
- [ ] Ignorar arquivos de ambiente e segredos (`.env`, `.env.*`, `application-local.yml`)
- [ ] Ignorar diretório local de uploads de desenvolvimento (`uploads/`, `data/`)
- [ ] Ignorar arquivos de IDEs (`.idea/`, `*.iml`, `.vscode/`, `.settings/`, `.classpath`, `.project`)

---

## Verificação e Critérios de Aceite (Definition of Done)

- [ ] `backend-legacy/` contém todo o código Node/Express antigo intocado
- [ ] `backend/docs/` contém `CLAUDE.md`, `ARCHITECTURE.md` e `tasks/`
- [ ] `./mvnw --version` e `./mvnw test-compile` executam com sucesso a partir de `backend/`
- [ ] Commit realizado: `chore: initialize spring boot project structure and move legacy backend`

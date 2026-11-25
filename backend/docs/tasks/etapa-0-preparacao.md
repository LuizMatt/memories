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
**Arquivos criados:**
- `backend/pom.xml`
- `backend/mvnw`, `backend/mvnw.cmd` e `backend/.gitattributes`
- `backend/.mvn/wrapper/maven-wrapper.properties`
- `backend/src/main/java/com/luizmatt/memories/MemoriesApplication.java`
- `backend/src/main/resources/application.yml`
- `backend/src/main/resources/db/migration/.gitkeep`

**Checklist de implementação:**
- [x] Configurar `pom.xml` com:
  - Java 21 (`<java.version>21</java.version>`)
  - `spring-boot-starter-parent` versão `4.1.3`
  - Starters modularizados do Spring Boot 4.1:
    - `spring-boot-starter-webmvc`
    - `spring-boot-starter-validation`
    - `spring-boot-starter-data-jpa`
    - `spring-boot-starter-flyway` + `org.flywaydb:flyway-database-postgresql`
    - `spring-boot-starter-actuator`
    - `org.postgresql:postgresql` (runtime)
    - `spring-boot-docker-compose` (runtime / optional)
  - Starters de teste modularizados do Spring Boot 4.1:
    - `spring-boot-starter-webmvc-test`, `spring-boot-starter-validation-test`, `spring-boot-starter-data-jpa-test`, `spring-boot-starter-flyway-test`, `spring-boot-starter-actuator-test`
    - `spring-boot-testcontainers`, `org.testcontainers:testcontainers-junit-jupiter`, `org.testcontainers:testcontainers-postgresql`
  - Plugins:
    - `spring-boot-maven-plugin`
    - `maven-failsafe-plugin` (executa `*IT.java` em `./mvnw verify`, enquanto o `surefire` padrão executa `*Test.java` em `./mvnw test`)
- [x] Incluir Maven Wrapper (`mvnw`, `mvnw.cmd`, `.mvn/`)
- [x] Criar classe principal `com.luizmatt.memories.MemoriesApplication`

### Task 0.3: Configurar `.gitignore` do backend
**Arquivo:** `backend/.gitignore`
- [x] Ignorar artefatos de build Maven (`target/`, `*.log`)
- [x] Ignorar arquivos de ambiente e segredos (`.env`, `.env.*`, `application-local.yml`)
- [x] Ignorar diretório local de uploads de desenvolvimento (`uploads/`, `data/`)
- [x] Ignorar arquivos de IDEs (`.idea/`, `*.iml`, `.vscode/`, `.settings/`, `.classpath`, `.project`)

---

## Verificação e Critérios de Aceite (Definition of Done)

- [x] `backend-legacy/` contém todo o código Node/Express antigo intocado
- [x] `backend/docs/` contém `CLAUDE.md`, `ARCHITECTURE.md` e `tasks/`
- [x] `./mvnw verify` executado com sucesso (`BUILD SUCCESS`) a partir de `backend/`
- [x] Commit: `chore: bootstrap spring boot 4.1 maven project`

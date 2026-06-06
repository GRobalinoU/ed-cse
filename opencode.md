# opencode.md — ED-CSE

> Reglas específicas para Kiro/OpenCode en este proyecto.
> Leer obligatoriamente al retomar el proyecto.

---

## Identidad del Proyecto
- **Codename:** ED-CSE (Event-Driven Canonical State Engine)
- **Nombre comercial:** Por definir
- **Paquete npm:** `@ed-cse/core`
- **Owner:** Gustavo Robalino (gustavo.robalino@proton.me)
- **Repositorio GitHub:** https://github.com/GRobalinoU/ed-cse
- **Licencia:** MIT

---

## Reglas de Este Proyecto

### 1. Arquitectura — No Negociable
La arquitectura es **Hexagonal (Ports & Adapters)**. Siempre:
- El `domain/` no conoce nada de `infrastructure/`
- Los `contracts/` (interfaces/ports) son el único punto de contacto entre capas
- Si algo rompe esta separación, rechazarlo y proponer alternativa

### 2. Idioma del Código
- **Código y JSDoc:** inglés exclusivamente
- **Archivos de documentación pública** (`README`, `CONTRIBUTING`, `CHANGELOG`, etc.): dos archivos — `.md` (inglés) + `.es.md` (español)
- **Steering files y opencode.md:** español

### 3. Stack — Sin Desviaciones en v0.1
| Herramienta | Versión | No reemplazar por |
|-------------|---------|-------------------|
| TypeScript | 5.x | JavaScript puro |
| pnpm | 9.x | npm / yarn |
| Vitest | 3.x | Jest |
| tsup | 8.x | webpack / rollup |
| ESLint | 9.x | — |

No agregar dependencias nuevas sin discutirlo primero. El core debe mantener **cero dependencias externas**.

### 4. Schema Evolution
- La integración es con **Apache Avro (`avsc`) + Confluent Schema Registry**
- No reimplementar versionado de schemas desde cero
- No usar protobuf ni JSON Schema para este propósito

### 5. Event Bus
- v0.1: **in-memory exclusivamente**
- Kafka/Redis Streams/NATS van en `infrastructure/adapters/` en v0.2+
- Cada adaptador implementa `IEventBus` del `contracts/`

### 6. Tests
- Todo comportamiento nuevo lleva test en Vitest
- Los tests viven junto al código: `src/domain/StateMachine.test.ts`
- Coverage mínimo objetivo: 80% en `core`

### 7. Commits y Branches
- Conventional Commits obligatorio: `feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`
- Branch principal: `main`
- Features: `feat/nombre-feature`
- Fixes: `fix/descripcion-bug`

---

## Estado Actual del Proyecto

### Completado ✅
- Estructura monorepo (pnpm workspaces)
- Scaffold `packages/core` con arquitectura hexagonal
- Configuración TypeScript, ESLint, Prettier, tsup, Vitest
- Archivos públicos del repo (README, CONTRIBUTING, CHANGELOG, LICENSE, CODE_OF_CONDUCT) en EN + ES
- GitHub Actions CI
- Steering file para memoria de sesiones
- Templates de issues y PR en GitHub

### Pendiente 🔲
- [ ] Implementar dominio: `StateMachine`, `Event`, `Transition`, `Policy`
- [ ] Implementar contratos: `IEventBus`, `IStateStore`, `ISchemaRegistry`
- [ ] Implementar casos de uso: `createMachine`, `transition`, `replay`, `subscribe`
- [ ] Implementar adaptador: `InMemoryEventBus`
- [ ] Tests unitarios del core
- [ ] Vincular repo a GitHub (cuenta: gustavo.robalino@proton.me)
- [ ] Publicar `@ed-cse/core` en npm (cuando llegue a v0.1 estable)
- [ ] Definir nombre comercial

---

## Notas de Sesión
- **2026-06-06:** Scaffolding completo. Estructura monorepo, docs bilingüe, CI configurado.
- **2026-06-06:** Repo público en https://github.com/GRobalinoU/ed-cse. Labels (14), milestones (6) e issues de tracking (8) creados vía API. Próximo paso: implementar el dominio core e instalar dependencias con pnpm.

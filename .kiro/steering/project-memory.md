---
inclusion: always
---

# ED-CSE / StateRaft — Memoria de Proyecto

## Identidad
- **Codename interno:** ED-CSE (Event-Driven Canonical State Engine)
- **Nombre comercial:** Por definir (candidatos en evaluación)
- **Paquete npm:** `@ed-cse/core` (scoped, bajo organización GitHub)
- **Repositorio:** https://github.com/GRobalinoU/ed-cse
- **Licencia:** MIT (open source)
- **Estado actual:** Scaffolding inicial — v0.1.0-alpha

## Qué es
**ED-CSE es un runtime determinístico para agregados dirigidos por eventos.**

No es un workflow engine distribuido. No gestiona sagas. No compite con Temporal, Cadence ni Camunda.

Su propuesta de valor es el paquete completo e inseparable:
FSM + Event Sourcing + Policies + Schema Evolution + Replay como sistema coherente.
Eso produce trazabilidad determinística en todos los sistemas que lo adopten.

### Definición de Aggregate (aprobada por arquitecto — 2026-06-06)
> Un **Aggregate** es la unidad máxima de consistencia transaccional gestionada por ED-CSE.
> Cada Aggregate posee una única máquina de estados y una secuencia ordenada de eventos.
> Las transiciones son atómicas dentro de un Aggregate y nunca abarcan múltiples Aggregates.

**Regla fundamental:**
> ED-CSE garantiza consistencia únicamente dentro de los límites de un Aggregate.
> Toda coordinación entre Aggregates es responsabilidad de la aplicación consumidora.

**Consecuencias directas:**
- Hoy: `Order Aggregate → Order State Machine` (1:1)
- Futuro: `Order Aggregate → [Lifecycle FSM, Fulfillment FSM]` (1:N) sin romper el modelo
- Optimistic locking ocurre sobre **Aggregate version**, no sobre machine version
- Sagas están **explícitamente fuera de scope** del core

### Pilares
1. **FSM** — transiciones de estado explícitas y validadas dentro del Aggregate
2. **Event Sourcing** — log de eventos inmutable como fuente de verdad del Aggregate
3. **Policy Engine** — validación de autorización antes de cada transición
4. **Schema Evolution** — contratos versionados con Apache Avro + Confluent Schema Registry
5. **State Replay** — reconstrucción determinística del estado en cualquier punto del tiempo
6. **SDK ergonómico** — API fluida tipo Prisma/Drizzle, no motor interno expuesto

## Stack Técnico
- **Runtime:** Node.js 20+ / TypeScript 5+
- **Monorepo:** pnpm workspaces
- **Schema Evolution:** Apache Avro (`avsc`) + Confluent Schema Registry
- **Testing:** Vitest
- **Linting:** ESLint + Prettier
- **Build:** tsup
- **CI/CD:** GitHub Actions

## Arquitectura (Hexagonal)
```
packages/
  core/           → Motor FSM + Event Sourcing (lógica pura, sin dependencias externas)
    src/
      contracts/      → Puertos (interfaces): IEventBus, IStateStore, ISchemaRegistry
      application/    → Casos de uso: createMachine, transition, replay, subscribe
      domain/         → Entidades: StateMachine, Event, Transition, Policy
      infrastructure/ → Adaptadores: InMemoryBus, AvroRegistry, KafkaAdapter (futuro)
  sdk-node/       → SDK público para Node.js (envuelve core con DX ergonómica)
  cli/            → Herramienta CLI para inspección y replay
  
apps/
  docs/           → Documentación (futuro: Docusaurus o VitePress)
  playground/     → Sandbox interactivo para demos
```

## Decisiones Técnicas Tomadas
| Decisión | Elección | Motivo |
|----------|----------|--------|
| Monorepo tool | pnpm workspaces | Ligero, rápido, sin Nx overhead en v0.1 |
| Schema evolution | Apache Avro + avsc | Mayor adopción en producción, especialmente fintech |
| Event bus v0.1 | In-memory | Cero dependencias, adaptadores enchufables después |
| Language | TypeScript | Stack del owner, validación más rápida |
| Testing | Vitest | Compatible con ESM, más rápido que Jest |
| Build | tsup | Simple, produce CJS + ESM, basado en esbuild |
| Persistencia v0.2 | PostgreSQL | ACID, JSONB, optimistic locking nativo, 90% de empresas ya lo tiene |
| Concurrencia | Optimistic locking | `WHERE version = N` sobre **Aggregate version**, no machine version |
| Kafka | Diferido a v1.0 | Sin casos de uso concretos; no vende frameworks |
| Sagas | Fuera de scope | Cambiaría la identidad del producto (Temporal territory) |
| Identidad del producto | Opinionated Runtime | No librería — el paquete completo es el diferenciador |
| API pública (SDK) | Fluida tipo Prisma | `runtime.machine('order').id(id).transition('CONFIRM')` |
| Schema de Aggregate | `aggregateType` + `machineVersion` | StateMachine describe comportamiento; AggregateInstance representa estado persistente |
| machineVersion en eventos | Persistir desde v0.2 | No se usa todavía — se guarda para habilitar replay multi-versión en el futuro |
| Replay histórico multi-versión | Deuda técnica documentada | v0.x no lo garantiza; la información se preserva para versiones futuras |
| StateMachineDefinition vs Aggregate | Conceptos separados | FSM es reutilizable; Aggregate es la unidad de consistencia |

## Roadmap (revisado con arquitecto — 2026-06-06)
- **v0.1** — ✅ Core FSM, in-memory bus, Avro schema registry, tests
- **v0.2** — Aggregate Model + PostgreSQL Store + Optimistic Locking
- **v0.3** — SDK público (`@ed-cse/sdk-node`) — API fluida tipo Prisma
- **v0.4** — Hello World en 15 min (README + ejemplos + playground)
- **v0.5** — Inspector (`runtime.inspect(aggregateId)`) + Replay UI
- **v0.6** — OpenTelemetry
- **v0.7** — Redis Streams adapter
- **v0.8** — Kafka adapter
- **v1.0** — Nombre comercial, docs públicos, API estable, lanzamiento oficial

## Convenciones de Código
- Nombrado: camelCase para variables/funciones, PascalCase para clases/interfaces/tipos
- Interfaces con prefijo `I`: `IEventBus`, `IStateStore`
- Exports explícitos (no barrel re-exports sin control)
- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`)
- Branch principal: `main`
- PRs hacia `main` vía feature branches: `feat/nombre-feature`

## Contexto de Negocio
- Owner: Gustavo Robalino
- Industria objetivo: Fintech, Logistics, SaaS complejos
- Posicionamiento: "La base estándar para estado en apps complejas"
- Diferenciador clave: Replay de estado real en producción + contratos versionados

## Notas de Sesión
- **2026-06-06:** Scaffolding inicial. Monorepo, CI, docs bilingüe. v0.1 completo.
- **2026-06-06:** Repo GitHub configurado. Labels, milestones, issues. CI badge activo.
- **2026-06-06:** Review de arquitectura. Decisiones fundamentales tomadas:
  - Identidad del producto: Opinionated Runtime (no librería)
  - Aggregate Model definido y aprobado
  - Roadmap reordenado: PostgreSQL → SDK → Hello World → Inspector → OTel → Redis → Kafka
  - Sagas explícitamente fuera de scope

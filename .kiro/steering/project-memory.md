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
Motor de estado tipo FSM + Event Sourcing para proyectos medianos, diseñado para escalar.
Resuelve el problema de estado inconsistente entre backend, frontend, IA y eventos.

### Pilares
1. **FSM + Event Sourcing** — transiciones de estado explícitas, log de eventos como fuente de verdad
2. **Event Bus intercambiable** — in-memory por defecto, adaptadores para Kafka/Redis/NATS en v0.2+
3. **Schema Evolution** — integración con Apache Avro + Confluent Schema Registry
4. **Policy Engine** — validación de transiciones (quién puede hacer qué, cuándo)
5. **State Replay** — reproducir estado en cualquier punto del tiempo (debug de producción)
6. **SDK TypeScript-first** — Python y Go en v0.2+

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

## Roadmap
- **v0.1** — Core FSM, in-memory bus, TypeScript SDK, tests unitarios
- **v0.2** — Avro schema registry, adaptador Kafka/Redis Streams
- **v0.3** — State replay, CLI de inspección
- **v0.4** — Python SDK
- **v0.5** — Go SDK
- **v1.0** — Nombre comercial, docs públicos, lanzamiento open source

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
- **2026-06-06:** Scaffolding inicial creado. Nombre comercial pendiente. Estructura monorepo lista.
- **2026-06-06:** Repo vinculado a GitHub (GRobalinoU/ed-cse). Labels, milestones e issues de tracking creados. CI badge activo. Token en .env local.

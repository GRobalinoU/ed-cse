# ED-CSE — Motor de Estado Canónico Orientado a Eventos

> **Codename:** ED-CSE · **Nombre comercial:** Próximamente · **Estado:** `v0.1.0-alpha`

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/maintained%20with-pnpm-cc00ff.svg)](https://pnpm.io/)
[![CI](https://github.com/GRobalinoU/ed-cse/actions/workflows/ci.yml/badge.svg)](https://github.com/GRobalinoU/ed-cse/actions/workflows/ci.yml)

---

**[Read in English →](./README.md)**

---

## El Problema

Los sistemas modernos tienen un problema de estado que nadie quiere reconocer:

- El frontend y el backend divergen silenciosamente
- Cada equipo inventa su propio modelo de estado inconsistente
- Los bugs de "estado imposible" son los más caros de diagnosticar
- No existe una forma estándar de reproducir lo que ocurrió en producción

En fintech, logística y SaaS complejo esto no es solo deuda técnica — es un riesgo de negocio.

## Qué hace ED-CSE

ED-CSE es un framework open source que le da a tu sistema una **única fuente de verdad de estado: consistente y auditable**.

Combina:

| Pilar | Qué resuelve |
|-------|-------------|
| **FSM (Máquina de Estado Finito)** | Transiciones de estado explícitas y validadas — sin estados imposibles |
| **Event Sourcing** | Cada cambio de estado es un evento en un log inmutable |
| **Event Bus intercambiable** | In-memory por defecto, reemplazable por Kafka / Redis Streams / NATS al escalar |
| **Schema Evolution** | Apache Avro + Confluent Schema Registry — versionado de contratos que funciona en producción |
| **Policy Engine** | Define quién puede disparar qué transición, bajo qué condiciones |
| **State Replay** | Reconstruye cualquier estado pasado desde el log de eventos — debug real en producción |

## Para quién es

- **Equipos fintech** que no pueden permitirse estado inconsistente entre servicios
- **Plataformas de logística** con transiciones de flujo complejas
- **Productos SaaS** que necesitan estado auditable para compliance
- **Cualquier equipo** cansado de debuggear "¿cómo llegamos a este estado?"

## Arquitectura

ED-CSE sigue **Arquitectura Hexagonal (Ports & Adapters)**. El motor central no tiene dependencias externas — los adaptadores se conectan en la capa de infraestructura.

```
packages/
  core/               # Motor FSM + Event Sourcing puro (sin dependencias externas)
    src/
      contracts/      # Puertos: IEventBus, IStateStore, ISchemaRegistry
      application/    # Casos de uso: createMachine, transition, replay, subscribe
      domain/         # Entidades: StateMachine, Event, Transition, Policy
      infrastructure/ # Adaptadores: InMemoryBus, AvroRegistry, KafkaAdapter (v0.2+)
  sdk-node/           # SDK Node.js ergonómico (envuelve core)
  cli/                # Herramienta CLI para inspección y replay

apps/
  docs/               # Sitio de documentación (v1.0)
  playground/         # Sandbox interactivo
```

## Inicio Rápido

> ⚠️ Este proyecto está en alpha temprana. La API no es estable aún.

```bash
# Instalación
pnpm add @ed-cse/core
```

```typescript
import { createMachine, transition } from '@ed-cse/core';

const orderMachine = createMachine({
  id: 'order',
  initial: 'pending',
  states: {
    pending:    { on: { CONFIRM: 'confirmed', CANCEL: 'cancelled' } },
    confirmed:  { on: { SHIP: 'shipped',     CANCEL: 'cancelled' } },
    shipped:    { on: { DELIVER: 'delivered' } },
    delivered:  { type: 'final' },
    cancelled:  { type: 'final' },
  },
});

const result = transition(orderMachine, 'pending', { type: 'CONFIRM' });
// → { state: 'confirmed', event: { type: 'CONFIRM', timestamp: ... } }
```

## Roadmap

| Versión | Foco |
|---------|------|
| `v0.1` | Core FSM, bus in-memory, SDK TypeScript, tests unitarios |
| `v0.2` | Schema registry Avro, adaptador Kafka / Redis Streams |
| `v0.3` | Replay de estado, inspector CLI |
| `v0.4` | SDK Python |
| `v0.5` | SDK Go |
| `v1.0` | Nombre comercial, docs públicos, API estable, lanzamiento oficial |

## Contribuir

Las contribuciones son bienvenidas. Por favor leé [CONTRIBUTING.md](./CONTRIBUTING.md) antes de abrir un PR.

Este proyecto sigue [Conventional Commits](https://www.conventionalcommits.org/) y [Semantic Versioning](https://semver.org/).

Para preguntas y discusión general, usá [GitHub Discussions](https://github.com/GRobalinoU/ed-cse/discussions).

Para bugs y feature requests, usá [GitHub Issues](https://github.com/GRobalinoU/ed-cse/issues).

## Licencia

[MIT](./LICENSE) — Gustavo Robalino y contribuidores.

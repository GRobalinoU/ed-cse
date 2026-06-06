# ED-CSE — Event-Driven Canonical State Engine

> **Codename:** ED-CSE · **Commercial name:** Coming soon · **Status:** `v0.1.0-alpha`

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/maintained%20with-pnpm-cc00ff.svg)](https://pnpm.io/)

---

**[Leer en Español →](./README.es.md)**

---

## The Problem

Modern systems have a state problem nobody wants to talk about:

- Frontend and backend diverge silently
- Each team invents its own inconsistent state model
- "Impossible state" bugs are the most expensive ones to diagnose
- There's no standard way to replay what happened in production

In fintech, logistics, and complex SaaS this isn't just technical debt — it's a business risk.

## What ED-CSE Does

ED-CSE is an open source framework that gives your system a **single, consistent, auditable source of truth for state**.

It combines:

| Pillar | What it solves |
|--------|---------------|
| **FSM (Finite State Machine)** | Explicit, validated state transitions — no impossible states |
| **Event Sourcing** | Every state change is an event in an immutable log |
| **Pluggable Event Bus** | In-memory by default, swap in Kafka / Redis Streams / NATS when you need to scale |
| **Schema Evolution** | Apache Avro + Confluent Schema Registry — contract versioning that actually works in production |
| **Policy Engine** | Define who can trigger which transition, under what conditions |
| **State Replay** | Reconstruct any past state from the event log — real production debugging |

## Who It's For

- **Fintech teams** that can't afford inconsistent state between services
- **Logistics platforms** with complex workflow transitions
- **SaaS products** that need auditable state for compliance
- **Any team** tired of debugging "how did we end up here?"

## Architecture

ED-CSE follows **Hexagonal Architecture (Ports & Adapters)**. The core engine has zero external dependencies — adapters plug in at the infrastructure layer.

```
packages/
  core/               # Pure FSM + Event Sourcing engine (no external deps)
    src/
      contracts/      # Ports: IEventBus, IStateStore, ISchemaRegistry
      application/    # Use cases: createMachine, transition, replay, subscribe
      domain/         # Entities: StateMachine, Event, Transition, Policy
      infrastructure/ # Adapters: InMemoryBus, AvroRegistry, KafkaAdapter (v0.2+)
  sdk-node/           # Ergonomic Node.js SDK (wraps core)
  cli/                # CLI tool for inspection and replay

apps/
  docs/               # Documentation site (v1.0)
  playground/         # Interactive sandbox
```

## Quick Start

> ⚠️ This project is in early alpha. API is unstable.

```bash
# Install
pnpm add @ed-cse/core

# Basic usage (TypeScript)
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

| Version | Focus |
|---------|-------|
| `v0.1` | Core FSM, in-memory bus, TypeScript SDK, unit tests |
| `v0.2` | Avro schema registry, Kafka / Redis Streams adapter |
| `v0.3` | State replay, CLI inspector |
| `v0.4` | Python SDK |
| `v0.5` | Go SDK |
| `v1.0` | Commercial name, public docs, stable API, official launch |

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a PR.

This project follows [Conventional Commits](https://www.conventionalcommits.org/) and [Semantic Versioning](https://semver.org/).

## License

[MIT](./LICENSE) — Gustavo Robalino & contributors.

/**
 * @ed-cse/core — public API
 *
 * Import from here. Internal module structure is not part of the public API
 * and may change between minor versions.
 */

// Domain
export { createMachine, validateDefinition } from './domain/StateMachine.js';
export type {
  StateMachineDefinition,
  StateDefinition,
  TransitionDefinition,
  TransitionContext,
} from './domain/StateMachine.js';

export { createEvent } from './domain/Event.js';
export type { DomainEvent } from './domain/Event.js';

export { PolicyRegistry } from './domain/Policy.js';
export type { Policy, PolicyResult } from './domain/Policy.js';

export { InvalidTransitionError, FinalStateError, PolicyViolationError } from './domain/errors.js';

// Application
export { transition } from './application/transition.js';
export type { TransitionInput, TransitionOutput } from './application/transition.js';

export { replay } from './application/replay.js';
export type { ReplayResult, ReplayOptions } from './application/replay.js';

// Contracts (ports)
export type { IEventBus, EventHandler } from './contracts/IEventBus.js';
export type { IStateStore, StateSnapshot } from './contracts/IStateStore.js';
export type { ISchemaRegistry, SchemaMetadata } from './contracts/ISchemaRegistry.js';

// Infrastructure (built-in adapters)
export { InMemoryEventBus } from './infrastructure/InMemoryEventBus.js';
export { InMemoryStateStore } from './infrastructure/InMemoryStateStore.js';
export { AvroSchemaRegistry } from './infrastructure/AvroSchemaRegistry.js';
export type { AvroSchemaRegistryOptions } from './infrastructure/AvroSchemaRegistry.js';

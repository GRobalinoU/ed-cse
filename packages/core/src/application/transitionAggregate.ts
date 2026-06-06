/**
 * transitionAggregate — core use case for v0.2+.
 *
 * Operates on an Aggregate (not directly on a StateMachine).
 * The machine is resolved from the AggregateDefinition.
 *
 * Flow:
 *   1. Load AggregateInstance (or create at initial state)
 *   2. Resolve the StateMachine from AggregateDefinition
 *   3. Evaluate policies
 *   4. Evaluate guard
 *   5. Build AggregateEvent (with machineVersion)
 *   6. Save AggregateInstance + event atomically (optimistic locking)
 *   7. Publish event to bus
 */

import { randomUUID } from 'crypto';
import type { IAggregateStore } from '../contracts/IAggregateStore.js';
import type { IEventBus } from '../contracts/IEventBus.js';
import type { AggregateDefinition, AggregateInstance } from '../domain/Aggregate.js';
import type { TransitionContext } from '../domain/StateMachine.js';
import type { PolicyRegistry } from '../domain/Policy.js';
import { createAggregateEvent } from '../domain/Event.js';
import type { AggregateEvent } from '../domain/Event.js';
import {
  FinalStateError,
  InvalidTransitionError,
  PolicyViolationError,
} from '../domain/errors.js';

export interface TransitionAggregateInput {
  /** The aggregate definition — provides both aggregateType and the machine */
  definition: AggregateDefinition;
  /** Unique identifier of the aggregate instance (e.g. orderId) */
  aggregateId: string;
  /** Event type to trigger — must match a transition in the machine */
  eventType: string;
  /** Optional domain payload */
  payload?: unknown;
  /** Optional metadata (e.g. actor, correlationId) — used by policies */
  metadata?: Record<string, unknown>;
}

export interface TransitionAggregateOutput {
  /** The event that was produced */
  event: AggregateEvent;
  /** State before the transition */
  fromState: string;
  /** State after the transition */
  toState: string;
  /** The updated AggregateInstance */
  instance: AggregateInstance;
}

export async function transitionAggregate(
  input: TransitionAggregateInput,
  deps: {
    store: IAggregateStore;
    bus: IEventBus;
    policies?: PolicyRegistry;
  },
): Promise<TransitionAggregateOutput> {
  const { definition, aggregateId, eventType, payload, metadata } = input;
  const { store, bus, policies } = deps;
  const { aggregateType, machine, machineVersion } = definition;

  // 1. Load current instance (or start at initial state)
  const existing = await store.load(aggregateType, aggregateId);
  const fromState = existing?.currentState ?? machine.initial;
  const expectedVersion = existing?.version ?? 0;
  const stateDef = machine.states[fromState];

  if (!stateDef) {
    throw new InvalidTransitionError(machine.id, aggregateId, fromState, eventType);
  }

  // 2. Reject transitions from final states
  if (stateDef.type === 'final') {
    throw new FinalStateError(machine.id, aggregateId, fromState);
  }

  // 3. Resolve transition definition
  const rawTransition = stateDef.on?.[eventType];
  if (!rawTransition) {
    throw new InvalidTransitionError(machine.id, aggregateId, fromState, eventType);
  }

  const transitionDef = typeof rawTransition === 'string'
    ? { target: rawTransition }
    : rawTransition;

  const context: TransitionContext = {
    machineId: machine.id,
    instanceId: aggregateId,
    fromState,
    eventType,
    payload,
    ...(metadata !== undefined && { metadata }),
  };

  // 4. Evaluate policies
  if (transitionDef.policies?.length && policies) {
    for (const policyId of transitionDef.policies) {
      const policy = policies.get(policyId);
      const result = await policy.evaluate(context);
      if (!result.allowed) {
        throw new PolicyViolationError(
          policyId,
          result.reason ?? 'access denied',
          { machineId: machine.id, instanceId: aggregateId, eventType },
        );
      }
    }
  }

  // 5. Evaluate guard
  if (transitionDef.guard && !transitionDef.guard(context)) {
    throw new InvalidTransitionError(machine.id, aggregateId, fromState, eventType);
  }

  const toState = transitionDef.target;
  const now = new Date().toISOString();
  const newVersion = expectedVersion + 1;

  // 6. Build AggregateEvent — machineVersion preserved for future multi-version replay
  const event = createAggregateEvent({
    id: randomUUID(),
    type: eventType,
    machineId: machine.id,
    instanceId: aggregateId,
    aggregateType,
    aggregateVersion: newVersion,
    machineVersion,
    fromState,
    toState,
    payload,
    occurredAt: now,
  });

  // 7. Build updated AggregateInstance
  const instance: AggregateInstance = {
    aggregateType,
    aggregateId,
    currentState: toState,
    version: newVersion,
    machineVersion,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  // 8. Save atomically with optimistic locking (store enforces version check)
  await store.save(instance, event, expectedVersion);

  // 9. Publish event to bus
  await bus.publish(event);

  return { event, fromState, toState, instance };
}

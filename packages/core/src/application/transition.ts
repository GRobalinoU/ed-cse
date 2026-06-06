/**
 * transition — core use case.
 *
 * Evaluates policies, runs guards, fires the transition,
 * persists the new snapshot, and publishes the resulting event.
 */

import { randomUUID } from 'crypto';
import type { IEventBus } from '../contracts/IEventBus.js';
import type { IStateStore } from '../contracts/IStateStore.js';
import type { StateMachineDefinition, TransitionContext } from '../domain/StateMachine.js';
import { createEvent } from '../domain/Event.js';
import type { PolicyRegistry } from '../domain/Policy.js';
import {
  FinalStateError,
  InvalidTransitionError,
  PolicyViolationError,
} from '../domain/errors.js';
import type { DomainEvent } from '../domain/Event.js';

export interface TransitionInput {
  machine: StateMachineDefinition;
  instanceId: string;
  eventType: string;
  payload?: unknown;
  metadata?: Record<string, unknown>;
}

export interface TransitionOutput {
  event: DomainEvent;
  fromState: string;
  toState: string;
}

export async function transition(
  input: TransitionInput,
  deps: {
    store: IStateStore;
    bus: IEventBus;
    policies?: PolicyRegistry;
  },
): Promise<TransitionOutput> {
  const { machine, instanceId, eventType, payload, metadata } = input;
  const { store, bus, policies } = deps;

  // 1. Load current state (or start at initial)
  const snapshot = await store.get(machine.id, instanceId);
  const fromState = snapshot?.currentState ?? machine.initial;
  const stateDef = machine.states[fromState];

  if (!stateDef) {
    throw new InvalidTransitionError(machine.id, instanceId, fromState, eventType);
  }

  // 2. Reject transitions from final states
  if (stateDef.type === 'final') {
    throw new FinalStateError(machine.id, instanceId, fromState);
  }

  // 3. Resolve the transition definition
  const rawTransition = stateDef.on?.[eventType];
  if (!rawTransition) {
    throw new InvalidTransitionError(machine.id, instanceId, fromState, eventType);
  }

  const transitionDef = typeof rawTransition === 'string'
    ? { target: rawTransition }
    : rawTransition;

  const context: TransitionContext = {
    machineId: machine.id,
    instanceId,
    fromState,
    eventType,
    payload,
    metadata,
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
          { machineId: machine.id, instanceId, eventType },
        );
      }
    }
  }

  // 5. Evaluate guard
  if (transitionDef.guard && !transitionDef.guard(context)) {
    throw new InvalidTransitionError(machine.id, instanceId, fromState, eventType);
  }

  const toState = transitionDef.target;
  const now = new Date().toISOString();

  // 6. Build event
  const event = createEvent({
    id: randomUUID(),
    type: eventType,
    machineId: machine.id,
    instanceId,
    fromState,
    toState,
    payload,
    occurredAt: now,
  });

  // 7. Persist snapshot and event log
  await store.save({
    machineId: machine.id,
    instanceId,
    currentState: toState,
    updatedAt: now,
    version: (snapshot?.version ?? 0) + 1,
  });
  await store.appendEvent(machine.id, instanceId, event);

  // 8. Publish to event bus
  await bus.publish(event);

  return { event, fromState, toState };
}

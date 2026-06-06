import { describe, it, expect, beforeEach } from 'vitest';
import { defineAggregate } from '../domain/Aggregate.js';
import { createMachine } from '../domain/StateMachine.js';
import { InMemoryAggregateStore } from '../infrastructure/InMemoryAggregateStore.js';
import { InMemoryEventBus } from '../infrastructure/InMemoryEventBus.js';
import { PolicyRegistry } from '../domain/Policy.js';
import { transitionAggregate } from './transitionAggregate.js';
import {
  InvalidTransitionError,
  FinalStateError,
  PolicyViolationError,
  ConcurrencyConflictError,
} from '../domain/errors.js';

const orderMachine = createMachine({
  id: 'order-lifecycle',
  initial: 'pending',
  states: {
    pending:   { on: { CONFIRM: 'confirmed', CANCEL: 'cancelled' } },
    confirmed: { on: { SHIP: 'shipped',     CANCEL: 'cancelled' } },
    shipped:   { on: { DELIVER: 'delivered' } },
    delivered: { type: 'final' },
    cancelled: { type: 'final' },
  },
});

const OrderAggregate = defineAggregate({
  aggregateType: 'order',
  machineVersion: 1,
  machine: orderMachine,
});

describe('transitionAggregate', () => {
  let store: InMemoryAggregateStore;
  let bus: InMemoryEventBus;

  beforeEach(() => {
    store = new InMemoryAggregateStore();
    bus   = new InMemoryEventBus();
  });

  it('transitions from initial state on first event', async () => {
    const result = await transitionAggregate(
      { definition: OrderAggregate, aggregateId: 'ord-1', eventType: 'CONFIRM' },
      { store, bus },
    );

    expect(result.fromState).toBe('pending');
    expect(result.toState).toBe('confirmed');
    expect(result.instance.version).toBe(1);
    expect(result.instance.aggregateType).toBe('order');
    expect(result.instance.machineVersion).toBe(1);
  });

  it('event carries machineVersion for future replay support', async () => {
    const result = await transitionAggregate(
      { definition: OrderAggregate, aggregateId: 'ord-2', eventType: 'CONFIRM' },
      { store, bus },
    );

    expect(result.event.machineVersion).toBe(1);
    expect(result.event.aggregateType).toBe('order');
    expect(result.event.aggregateVersion).toBe(1);
  });

  it('increments version on each transition', async () => {
    const deps = { store, bus };
    const id = 'ord-3';

    const r1 = await transitionAggregate({ definition: OrderAggregate, aggregateId: id, eventType: 'CONFIRM' }, deps);
    const r2 = await transitionAggregate({ definition: OrderAggregate, aggregateId: id, eventType: 'SHIP'    }, deps);
    const r3 = await transitionAggregate({ definition: OrderAggregate, aggregateId: id, eventType: 'DELIVER' }, deps);

    expect(r1.instance.version).toBe(1);
    expect(r2.instance.version).toBe(2);
    expect(r3.instance.version).toBe(3);
    expect(r3.toState).toBe('delivered');
  });

  it('optimistic locking: InMemoryAggregateStore throws ConcurrencyConflictError on version mismatch', async () => {
    const id = 'ord-4';

    // Setup: save initial instance at version 1
    const instance: import('../domain/Aggregate.js').AggregateInstance = {
      aggregateType: 'order', aggregateId: id,
      currentState: 'confirmed', version: 1, machineVersion: 1,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    const event1: import('../domain/Event.js').AggregateEvent = {
      id: 'e1', type: 'CONFIRM', machineId: 'order-lifecycle', instanceId: id,
      aggregateType: 'order', aggregateVersion: 1, machineVersion: 1,
      fromState: 'pending', toState: 'confirmed', occurredAt: new Date().toISOString(),
    };
    await store.save(instance, event1, 0); // first save, expectedVersion=0

    // Another process saves version 2
    const instance2 = { ...instance, version: 2, currentState: 'shipped' };
    const event2: import('../domain/Event.js').AggregateEvent = {
      id: 'e2', type: 'SHIP', machineId: 'order-lifecycle', instanceId: id,
      aggregateType: 'order', aggregateVersion: 2, machineVersion: 1,
      fromState: 'confirmed', toState: 'shipped', occurredAt: new Date().toISOString(),
    };
    await store.save(instance2, event2, 1); // expectedVersion=1 ✓

    // Our process tries to save with stale expectedVersion=1 — must conflict
    const staleInstance = { ...instance, version: 2, currentState: 'cancelled' };
    const staleEvent: import('../domain/Event.js').AggregateEvent = {
      id: 'e3', type: 'CANCEL', machineId: 'order-lifecycle', instanceId: id,
      aggregateType: 'order', aggregateVersion: 2, machineVersion: 1,
      fromState: 'confirmed', toState: 'cancelled', occurredAt: new Date().toISOString(),
    };

    await expect(
      store.save(staleInstance, staleEvent, 1), // wrong! store now has version 2
    ).rejects.toThrow(ConcurrencyConflictError);
  });

  it('throws InvalidTransitionError for undefined event', async () => {
    await expect(
      transitionAggregate(
        { definition: OrderAggregate, aggregateId: 'ord-5', eventType: 'SHIP' },
        { store, bus },
      ),
    ).rejects.toThrow(InvalidTransitionError);
  });

  it('throws FinalStateError when transitioning from a final state', async () => {
    const deps = { store, bus };
    const id = 'ord-6';

    await transitionAggregate({ definition: OrderAggregate, aggregateId: id, eventType: 'CANCEL' }, deps);

    await expect(
      transitionAggregate({ definition: OrderAggregate, aggregateId: id, eventType: 'CONFIRM' }, deps),
    ).rejects.toThrow(FinalStateError);
  });

  it('publishes AggregateEvent to bus', async () => {
    const received: string[] = [];
    bus.subscribe('CONFIRM', (e) => { received.push(e.instanceId); });

    await transitionAggregate(
      { definition: OrderAggregate, aggregateId: 'ord-7', eventType: 'CONFIRM' },
      { store, bus },
    );

    expect(received).toContain('ord-7');
  });

  it('enforces policies on aggregate transitions', async () => {
    const policies = new PolicyRegistry();
    policies.register({
      id: 'admin-only',
      description: 'Only admins can cancel',
      evaluate: (ctx) => ({
        allowed: ctx.metadata?.['role'] === 'admin',
        reason: 'requires admin role',
      }),
    });

    const PolicyMachine = createMachine({
      id: 'policy-machine',
      initial: 'active',
      states: {
        active:    { on: { CANCEL: { target: 'cancelled', policies: ['admin-only'] } } },
        cancelled: { type: 'final' },
      },
    });

    const PolicyAggregate = defineAggregate({
      aggregateType: 'policy-test',
      machineVersion: 1,
      machine: PolicyMachine,
    });

    await expect(
      transitionAggregate(
        { definition: PolicyAggregate, aggregateId: 'p-1', eventType: 'CANCEL', metadata: { role: 'user' } },
        { store, bus, policies },
      ),
    ).rejects.toThrow(PolicyViolationError);

    const result = await transitionAggregate(
      { definition: PolicyAggregate, aggregateId: 'p-1', eventType: 'CANCEL', metadata: { role: 'admin' } },
      { store, bus, policies },
    );
    expect(result.toState).toBe('cancelled');
  });

  it('stores createdAt on first transition and preserves it on subsequent ones', async () => {
    const deps = { store, bus };
    const id = 'ord-8';

    const r1 = await transitionAggregate({ definition: OrderAggregate, aggregateId: id, eventType: 'CONFIRM' }, deps);

    // Small delay to ensure updatedAt changes
    await new Promise((resolve) => setTimeout(resolve, 10));

    const r2 = await transitionAggregate({ definition: OrderAggregate, aggregateId: id, eventType: 'SHIP' }, deps);

    // createdAt is preserved across transitions
    expect(r1.instance.createdAt).toBe(r2.instance.createdAt);
    // updatedAt changes on each transition
    expect(r2.instance.updatedAt).not.toBe(r1.instance.updatedAt);
    // version increments
    expect(r1.instance.version).toBe(1);
    expect(r2.instance.version).toBe(2);
  });
});

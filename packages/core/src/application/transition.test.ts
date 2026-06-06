import { describe, it, expect, beforeEach } from 'vitest';
import { createMachine } from '../domain/StateMachine.js';
import { InMemoryEventBus } from '../infrastructure/InMemoryEventBus.js';
import { InMemoryStateStore } from '../infrastructure/InMemoryStateStore.js';
import { transition } from './transition.js';
import { InvalidTransitionError, FinalStateError, PolicyViolationError } from '../domain/errors.js';
import { PolicyRegistry } from '../domain/Policy.js';

const orderMachine = createMachine({
  id: 'order',
  initial: 'pending',
  states: {
    pending:   { on: { CONFIRM: 'confirmed', CANCEL: 'cancelled' } },
    confirmed: { on: { SHIP: 'shipped',     CANCEL: 'cancelled' } },
    shipped:   { on: { DELIVER: 'delivered' } },
    delivered: { type: 'final' },
    cancelled: { type: 'final' },
  },
});

describe('transition', () => {
  let store: InMemoryStateStore;
  let bus: InMemoryEventBus;

  beforeEach(() => {
    store = new InMemoryStateStore();
    bus   = new InMemoryEventBus();
  });

  it('transitions from initial state on first event', async () => {
    const result = await transition(
      { machine: orderMachine, instanceId: 'order-1', eventType: 'CONFIRM' },
      { store, bus },
    );

    expect(result.fromState).toBe('pending');
    expect(result.toState).toBe('confirmed');
    expect(result.event.type).toBe('CONFIRM');
    expect(result.event.machineId).toBe('order');
    expect(result.event.instanceId).toBe('order-1');
  });

  it('persists new snapshot after transition', async () => {
    await transition(
      { machine: orderMachine, instanceId: 'order-2', eventType: 'CONFIRM' },
      { store, bus },
    );

    const snapshot = await store.get('order', 'order-2');
    expect(snapshot?.currentState).toBe('confirmed');
    expect(snapshot?.version).toBe(1);
  });

  it('appends event to the log', async () => {
    await transition(
      { machine: orderMachine, instanceId: 'order-3', eventType: 'CONFIRM' },
      { store, bus },
    );

    const log = await store.getEventLog('order', 'order-3');
    expect(log).toHaveLength(1);
    expect(log[0]?.type).toBe('CONFIRM');
  });

  it('publishes event to the bus', async () => {
    const received: string[] = [];
    bus.subscribe('CONFIRM', (e) => { received.push(e.instanceId); });

    await transition(
      { machine: orderMachine, instanceId: 'order-4', eventType: 'CONFIRM' },
      { store, bus },
    );

    expect(received).toContain('order-4');
  });

  it('chains multiple transitions correctly', async () => {
    const deps = { store, bus };
    const id = 'order-5';

    await transition({ machine: orderMachine, instanceId: id, eventType: 'CONFIRM' }, deps);
    await transition({ machine: orderMachine, instanceId: id, eventType: 'SHIP' }, deps);
    const result = await transition({ machine: orderMachine, instanceId: id, eventType: 'DELIVER' }, deps);

    expect(result.toState).toBe('delivered');
    const log = await store.getEventLog('order', id);
    expect(log).toHaveLength(3);
  });

  it('throws InvalidTransitionError for undefined event', async () => {
    await expect(
      transition(
        { machine: orderMachine, instanceId: 'order-6', eventType: 'SHIP' },
        { store, bus },
      ),
    ).rejects.toThrow(InvalidTransitionError);
  });

  it('throws FinalStateError when trying to leave a final state', async () => {
    const deps = { store, bus };
    const id = 'order-7';

    await transition({ machine: orderMachine, instanceId: id, eventType: 'CANCEL' }, deps);

    await expect(
      transition({ machine: orderMachine, instanceId: id, eventType: 'CONFIRM' }, deps),
    ).rejects.toThrow(FinalStateError);
  });

  it('respects guard functions', async () => {
    const guardMachine = createMachine({
      id: 'guarded',
      initial: 'idle',
      states: {
        idle: {
          on: {
            START: {
              target: 'running',
              guard: (ctx) => ctx.payload === 'valid-token',
            },
          },
        },
        running: { type: 'final' },
      },
    });

    await expect(
      transition(
        { machine: guardMachine, instanceId: 'g-1', eventType: 'START', payload: 'wrong' },
        { store, bus },
      ),
    ).rejects.toThrow(InvalidTransitionError);

    const result = await transition(
      { machine: guardMachine, instanceId: 'g-1', eventType: 'START', payload: 'valid-token' },
      { store, bus },
    );
    expect(result.toState).toBe('running');
  });

  it('enforces policies', async () => {
    const policies = new PolicyRegistry();
    policies.register({
      id: 'admin-only',
      description: 'Only admins can cancel',
      evaluate: (ctx) => ({
        allowed: ctx.metadata?.['role'] === 'admin',
        reason: 'requires admin role',
      }),
    });

    const policyMachine = createMachine({
      id: 'policy-test',
      initial: 'active',
      states: {
        active: {
          on: {
            CANCEL: { target: 'cancelled', policies: ['admin-only'] },
          },
        },
        cancelled: { type: 'final' },
      },
    });

    await expect(
      transition(
        { machine: policyMachine, instanceId: 'p-1', eventType: 'CANCEL', metadata: { role: 'user' } },
        { store, bus, policies },
      ),
    ).rejects.toThrow(PolicyViolationError);

    const result = await transition(
      { machine: policyMachine, instanceId: 'p-1', eventType: 'CANCEL', metadata: { role: 'admin' } },
      { store, bus, policies },
    );
    expect(result.toState).toBe('cancelled');
  });
});

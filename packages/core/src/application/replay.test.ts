import { describe, it, expect, beforeEach } from 'vitest';
import { createMachine } from '../domain/StateMachine.js';
import { InMemoryEventBus } from '../infrastructure/InMemoryEventBus.js';
import { InMemoryStateStore } from '../infrastructure/InMemoryStateStore.js';
import { transition } from './transition.js';
import { replay } from './replay.js';

const orderMachine = createMachine({
  id: 'order',
  initial: 'pending',
  states: {
    pending:   { on: { CONFIRM: 'confirmed', CANCEL: 'cancelled' } },
    confirmed: { on: { SHIP: 'shipped' } },
    shipped:   { on: { DELIVER: 'delivered' } },
    delivered: { type: 'final' },
    cancelled: { type: 'final' },
  },
});

describe('replay', () => {
  let store: InMemoryStateStore;
  let bus: InMemoryEventBus;

  beforeEach(() => {
    store = new InMemoryStateStore();
    bus   = new InMemoryEventBus();
  });

  it('returns initial state when no events exist', async () => {
    const result = await replay(
      { machine: orderMachine, instanceId: 'r-0' },
      { store },
    );

    expect(result.state).toBe('pending');
    expect(result.eventsApplied).toBe(0);
  });

  it('reconstructs state from full event log', async () => {
    const deps = { store, bus };
    const id = 'r-1';

    await transition({ machine: orderMachine, instanceId: id, eventType: 'CONFIRM' }, deps);
    await transition({ machine: orderMachine, instanceId: id, eventType: 'SHIP' }, deps);

    const result = await replay({ machine: orderMachine, instanceId: id }, { store });

    expect(result.state).toBe('shipped');
    expect(result.eventsApplied).toBe(2);
  });

  it('replays up to a timestamp cutoff', async () => {
    const deps = { store, bus };
    const id = 'r-2';

    await transition({ machine: orderMachine, instanceId: id, eventType: 'CONFIRM' }, deps);

    const cutoff = new Date().toISOString();

    // Small delay to ensure the next event has a later timestamp
    await new Promise((resolve) => setTimeout(resolve, 10));

    await transition({ machine: orderMachine, instanceId: id, eventType: 'SHIP' }, deps);

    const result = await replay(
      { machine: orderMachine, instanceId: id, options: { beforeTimestamp: cutoff } },
      { store },
    );

    expect(result.state).toBe('confirmed');
    expect(result.eventsApplied).toBe(1);
  });

  it('replays with event count limit', async () => {
    const deps = { store, bus };
    const id = 'r-3';

    await transition({ machine: orderMachine, instanceId: id, eventType: 'CONFIRM' }, deps);
    await transition({ machine: orderMachine, instanceId: id, eventType: 'SHIP' }, deps);
    await transition({ machine: orderMachine, instanceId: id, eventType: 'DELIVER' }, deps);

    const result = await replay(
      { machine: orderMachine, instanceId: id, options: { limitEvents: 1 } },
      { store },
    );

    expect(result.state).toBe('confirmed');
    expect(result.eventsApplied).toBe(1);
  });
});

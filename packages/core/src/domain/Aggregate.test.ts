import { describe, it, expect } from 'vitest';
import { defineAggregate } from './Aggregate.js';
import { createMachine } from './StateMachine.js';

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

describe('defineAggregate', () => {
  it('creates a valid AggregateDefinition', () => {
    const def = defineAggregate({
      aggregateType: 'order',
      machineVersion: 1,
      machine: orderMachine,
    });

    expect(def.aggregateType).toBe('order');
    expect(def.machineVersion).toBe(1);
    expect(def.machine).toBe(orderMachine);
  });

  it('freezes the definition', () => {
    const def = defineAggregate({
      aggregateType: 'order',
      machineVersion: 1,
      machine: orderMachine,
    });

    expect(() => {
      // @ts-expect-error intentional mutation attempt
      def.aggregateType = 'mutated';
    }).toThrow();
  });

  it('throws when aggregateType is empty', () => {
    expect(() =>
      defineAggregate({ aggregateType: '', machineVersion: 1, machine: orderMachine }),
    ).toThrow('non-empty aggregateType');
  });

  it('throws when machineVersion is zero', () => {
    expect(() =>
      defineAggregate({ aggregateType: 'order', machineVersion: 0, machine: orderMachine }),
    ).toThrow('positive integer');
  });

  it('throws when machineVersion is negative', () => {
    expect(() =>
      defineAggregate({ aggregateType: 'order', machineVersion: -1, machine: orderMachine }),
    ).toThrow('positive integer');
  });

  it('throws when machineVersion is not an integer', () => {
    expect(() =>
      defineAggregate({ aggregateType: 'order', machineVersion: 1.5, machine: orderMachine }),
    ).toThrow('positive integer');
  });

  it('StateMachineDefinition exists independently of AggregateDefinition', () => {
    // The same machine can be used by multiple aggregate definitions
    const orderDef = defineAggregate({ aggregateType: 'order',   machineVersion: 1, machine: orderMachine });
    const draftDef = defineAggregate({ aggregateType: 'draft',   machineVersion: 1, machine: orderMachine });

    expect(orderDef.machine).toBe(draftDef.machine);
    expect(orderDef.aggregateType).not.toBe(draftDef.aggregateType);
  });
});

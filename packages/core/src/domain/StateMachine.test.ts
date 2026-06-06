import { describe, it, expect } from 'vitest';
import { createMachine, validateDefinition } from './StateMachine.js';

describe('createMachine', () => {
  it('creates a valid machine definition', () => {
    const machine = createMachine({
      id: 'order',
      initial: 'pending',
      states: {
        pending:   { on: { CONFIRM: 'confirmed', CANCEL: 'cancelled' } },
        confirmed: { on: { SHIP: 'shipped', CANCEL: 'cancelled' } },
        shipped:   { on: { DELIVER: 'delivered' } },
        delivered: { type: 'final' },
        cancelled: { type: 'final' },
      },
    });

    expect(machine.id).toBe('order');
    expect(machine.initial).toBe('pending');
  });

  it('freezes the definition to prevent mutation', () => {
    const machine = createMachine({
      id: 'test',
      initial: 'a',
      states: { a: { type: 'final' } },
    });

    expect(() => {
      // @ts-expect-error intentional mutation attempt
      machine.id = 'mutated';
    }).toThrow();
  });
});

describe('validateDefinition', () => {
  it('throws when id is empty', () => {
    expect(() =>
      validateDefinition({ id: '', initial: 'a', states: { a: { type: 'final' } } }),
    ).toThrow('non-empty id');
  });

  it('throws when initial state is not defined', () => {
    expect(() =>
      validateDefinition({ id: 'x', initial: 'missing', states: { a: { type: 'final' } } }),
    ).toThrow('"missing" is not defined');
  });

  it('throws when a transition target is unknown', () => {
    expect(() =>
      validateDefinition({
        id: 'x',
        initial: 'a',
        states: { a: { on: { GO: 'nonexistent' } } },
      }),
    ).toThrow('"nonexistent"');
  });

  it('throws when a final state has outgoing transitions', () => {
    expect(() =>
      validateDefinition({
        id: 'x',
        initial: 'a',
        states: {
          a: { type: 'final', on: { GO: 'a' } },
        },
      }),
    ).toThrow('Final state "a"');
  });
});

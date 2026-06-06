/**
 * Aggregate — the unit of transactional consistency in ED-CSE.
 *
 * KEY DESIGN DECISIONS (approved by architect, 2026-06-06):
 *
 * 1. Aggregate and StateMachine are SEPARATE concepts.
 *    - StateMachineDefinition describes BEHAVIOR (reusable, stateless)
 *    - AggregateInstance represents PERSISTENT STATE and consistency boundaries
 *    - Decisions about concurrency, versioning and persistence belong to the
 *      Aggregate, NEVER to the StateMachine.
 *
 * 2. Today the relationship is 1:1. Tomorrow an Aggregate may own multiple
 *    machines without breaking this model.
 *
 * 3. machineVersion is persisted in every event from day one.
 *    It is NOT used for multi-version replay in v0.x — that feature is deferred.
 *    The data is preserved to enable it in future versions.
 *    ED-CSE v0.x does NOT guarantee historical replay against old machine versions.
 *
 * 4. Optimistic locking occurs on AggregateInstance.version, not machine version.
 */

import type { StateMachineDefinition } from './StateMachine.js';

/**
 * AggregateDefinition — binds a domain concept to its state machine.
 *
 * AggregateType identifies the domain entity (e.g. "order", "payment").
 * MachineVersion is incremented when the FSM definition changes.
 * Both are stored in every event to enable future multi-version replay.
 */
export interface AggregateDefinition<
  TStates extends string = string,
  TEvents extends string = string,
> {
  /** Domain entity type — e.g. "order", "payment", "shipment" */
  readonly aggregateType: string;
  /**
   * Version of the state machine definition.
   * Increment this when the FSM definition changes.
   * Start at 1. Never use 0.
   */
  readonly machineVersion: number;
  /** The state machine that governs this aggregate's lifecycle */
  readonly machine: StateMachineDefinition;
}

/**
 * AggregateInstance — the live state of one aggregate.
 *
 * This is what gets persisted and what optimistic locking operates on.
 * One instance per (aggregateType, aggregateId) pair.
 */
export interface AggregateInstance {
  /** The domain entity type — matches AggregateDefinition.aggregateType */
  readonly aggregateType: string;
  /** Unique identifier within the aggregate type — e.g. orderId, paymentId */
  readonly aggregateId: string;
  /** Current FSM state name */
  readonly currentState: string;
  /**
   * Monotonically increasing version number.
   * Starts at 0 (no events applied). Incremented by 1 on each successful transition.
   * Used for optimistic locking: UPDATE ... WHERE version = :expectedVersion
   */
  readonly version: number;
  /**
   * Version of the machine definition that was active when this instance was last updated.
   * Stored for future multi-version replay support.
   */
  readonly machineVersion: number;
  /** ISO 8601 — when this instance was first created */
  readonly createdAt: string;
  /** ISO 8601 — when this instance was last updated */
  readonly updatedAt: string;
}

/**
 * Creates a new AggregateDefinition.
 * Validates that machineVersion is a positive integer.
 */
export function defineAggregate<
  TStates extends string = string,
  TEvents extends string = string,
>(def: AggregateDefinition<TStates, TEvents>): AggregateDefinition<TStates, TEvents> {
  if (!def.aggregateType?.trim()) {
    throw new Error('AggregateDefinition must have a non-empty aggregateType');
  }
  if (!Number.isInteger(def.machineVersion) || def.machineVersion < 1) {
    throw new Error('AggregateDefinition.machineVersion must be a positive integer (start at 1)');
  }
  if (!def.machine) {
    throw new Error('AggregateDefinition must have a machine');
  }
  return Object.freeze(def);
}

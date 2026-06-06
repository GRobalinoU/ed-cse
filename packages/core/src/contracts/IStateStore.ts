/**
 * IStateStore — Port definition for state persistence.
 *
 * Stores the current state snapshot and full event log for each machine instance.
 * In v0.1 the only implementation is in-memory.
 */

import type { DomainEvent } from '../domain/Event.js';

export interface StateSnapshot {
  /** Machine definition identifier */
  machineId: string;
  /** Unique instance identifier (e.g. orderId, userId) */
  instanceId: string;
  /** Current state name */
  currentState: string;
  /** ISO 8601 timestamp of the last transition */
  updatedAt: string;
  /** Incrementing version — used for optimistic concurrency */
  version: number;
}

export interface IStateStore {
  /**
   * Persist a new state snapshot for a machine instance.
   */
  save(snapshot: StateSnapshot): Promise<void>;

  /**
   * Retrieve the current snapshot for a machine instance.
   * Returns null if no snapshot exists yet.
   */
  get(machineId: string, instanceId: string): Promise<StateSnapshot | null>;

  /**
   * Append an event to the event log of a machine instance.
   */
  appendEvent(machineId: string, instanceId: string, event: DomainEvent): Promise<void>;

  /**
   * Retrieve the full ordered event log for a machine instance.
   */
  getEventLog(machineId: string, instanceId: string): Promise<DomainEvent[]>;
}

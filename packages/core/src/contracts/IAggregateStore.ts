/**
 * IAggregateStore — port for aggregate persistence.
 *
 * Replaces IStateStore as the primary persistence contract in v0.2+.
 * IStateStore remains available for backward compatibility and testing.
 *
 * The key difference from IStateStore:
 * - Operations are typed around AggregateInstance (not machineId/instanceId)
 * - save() enforces optimistic locking via expectedVersion
 * - Events carry machineVersion for future multi-version replay support
 */

import type { AggregateInstance } from '../domain/Aggregate.js';
import type { AggregateEvent } from '../domain/Event.js';

export interface IAggregateStore {
  /**
   * Load the current AggregateInstance for a given (aggregateType, aggregateId).
   * Returns null if no instance exists yet (first transition creates it).
   */
  load(aggregateType: string, aggregateId: string): Promise<AggregateInstance | null>;

  /**
   * Persist a new or updated AggregateInstance together with a new event.
   *
   * MUST enforce optimistic locking:
   * - If expectedVersion === 0: INSERT (first event — instance must not exist)
   * - If expectedVersion > 0: UPDATE WHERE version = expectedVersion
   * - If the version does not match: throw ConcurrencyConflictError
   *
   * The operation MUST be atomic: snapshot + event log update in one transaction.
   */
  save(
    instance: AggregateInstance,
    event: AggregateEvent,
    expectedVersion: number,
  ): Promise<void>;

  /**
   * Retrieve the full ordered event log for an aggregate instance.
   * Events are ordered by version ASC.
   */
  getEventLog(aggregateType: string, aggregateId: string): Promise<AggregateEvent[]>;
}

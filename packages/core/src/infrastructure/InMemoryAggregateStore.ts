/**
 * InMemoryAggregateStore — IAggregateStore adapter for testing and development.
 *
 * Implements optimistic locking: save() throws ConcurrencyConflictError
 * if the stored version doesn't match expectedVersion.
 *
 * Data is lost on process restart.
 * In production, replace with PostgresAggregateStore (v0.2).
 */

import type { IAggregateStore } from '../contracts/IAggregateStore.js';
import type { AggregateInstance } from '../domain/Aggregate.js';
import type { AggregateEvent } from '../domain/Event.js';
import { ConcurrencyConflictError } from '../domain/errors.js';

export class InMemoryAggregateStore implements IAggregateStore {
  private readonly instances = new Map<string, AggregateInstance>();
  private readonly eventLogs = new Map<string, AggregateEvent[]>();

  private key(aggregateType: string, aggregateId: string): string {
    return `${aggregateType}::${aggregateId}`;
  }

  async load(aggregateType: string, aggregateId: string): Promise<AggregateInstance | null> {
    return this.instances.get(this.key(aggregateType, aggregateId)) ?? null;
  }

  async save(
    instance: AggregateInstance,
    event: AggregateEvent,
    expectedVersion: number,
  ): Promise<void> {
    const k = this.key(instance.aggregateType, instance.aggregateId);
    const current = this.instances.get(k);
    const currentVersion = current?.version ?? 0;

    // Optimistic locking check
    if (currentVersion !== expectedVersion) {
      throw new ConcurrencyConflictError(
        instance.aggregateType,
        instance.aggregateId,
        expectedVersion,
        currentVersion,
      );
    }

    // Atomic update (in-memory — no real transaction needed)
    this.instances.set(k, instance);

    if (!this.eventLogs.has(k)) {
      this.eventLogs.set(k, []);
    }
    this.eventLogs.get(k)!.push(event);
  }

  async getEventLog(aggregateType: string, aggregateId: string): Promise<AggregateEvent[]> {
    return [...(this.eventLogs.get(this.key(aggregateType, aggregateId)) ?? [])];
  }

  /** Wipe all state — useful between tests */
  clear(): void {
    this.instances.clear();
    this.eventLogs.clear();
  }
}

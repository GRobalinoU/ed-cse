/**
 * InMemoryStateStore — default IStateStore adapter.
 *
 * Stores state and event log in memory. Data is lost on process restart.
 * Use this for testing and local development.
 * Production deployments should use a persistent adapter (Postgres, Redis, etc.).
 */

import type { IStateStore, StateSnapshot } from '../contracts/IStateStore.js';
import type { DomainEvent } from '../domain/Event.js';

export class InMemoryStateStore implements IStateStore {
  private readonly snapshots = new Map<string, StateSnapshot>();
  private readonly eventLogs = new Map<string, DomainEvent[]>();

  private key(machineId: string, instanceId: string): string {
    return `${machineId}::${instanceId}`;
  }

  async save(snapshot: StateSnapshot): Promise<void> {
    this.snapshots.set(this.key(snapshot.machineId, snapshot.instanceId), snapshot);
  }

  async get(machineId: string, instanceId: string): Promise<StateSnapshot | null> {
    return this.snapshots.get(this.key(machineId, instanceId)) ?? null;
  }

  async appendEvent(machineId: string, instanceId: string, event: DomainEvent): Promise<void> {
    const k = this.key(machineId, instanceId);
    if (!this.eventLogs.has(k)) {
      this.eventLogs.set(k, []);
    }
    this.eventLogs.get(k)!.push(event);
  }

  async getEventLog(machineId: string, instanceId: string): Promise<DomainEvent[]> {
    return [...(this.eventLogs.get(this.key(machineId, instanceId)) ?? [])];
  }

  /** Wipe everything — useful between tests */
  clear(): void {
    this.snapshots.clear();
    this.eventLogs.clear();
  }
}

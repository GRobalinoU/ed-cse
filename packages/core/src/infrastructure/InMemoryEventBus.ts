/**
 * InMemoryEventBus — default IEventBus adapter.
 *
 * Suitable for single-process use and testing.
 * Swap this for KafkaEventBus or RedisStreamsBus in v0.2+ for distributed systems.
 */

import type { IEventBus, EventHandler } from '../contracts/IEventBus.js';
import type { DomainEvent } from '../domain/Event.js';

export class InMemoryEventBus implements IEventBus {
  private readonly handlers = new Map<string, Set<EventHandler>>();

  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.type);
    if (!handlers || handlers.size === 0) return;

    const executions = [...handlers].map((handler) => handler(event));
    await Promise.all(executions);
  }

  subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    // Safe cast: the caller is responsible for the type match
    this.handlers.get(eventType)!.add(handler as EventHandler);

    return () => {
      this.handlers.get(eventType)?.delete(handler as EventHandler);
    };
  }

  clear(): void {
    this.handlers.clear();
  }
}

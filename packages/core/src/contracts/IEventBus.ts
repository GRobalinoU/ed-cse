/**
 * IEventBus — Port definition for the event bus.
 *
 * The core engine depends only on this interface.
 * Concrete implementations (InMemory, Kafka, Redis) live in infrastructure/.
 */

import type { DomainEvent } from '../domain/Event.js';

export type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => void | Promise<void>;

export interface IEventBus {
  /**
   * Publish an event to all subscribers of its type.
   */
  publish(event: DomainEvent): Promise<void>;

  /**
   * Subscribe a handler to a specific event type.
   * Returns an unsubscribe function.
   */
  subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): () => void;

  /**
   * Remove all subscribers. Useful for cleanup in tests.
   */
  clear(): void;
}

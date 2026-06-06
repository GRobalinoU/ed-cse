/**
 * DomainEvent — base type for all events in the system.
 *
 * Every state transition produces a DomainEvent that is appended to the event log.
 * The event log is the source of truth — current state is always derivable from it.
 */

export interface DomainEvent<TPayload = unknown> {
  /** Unique event identifier (UUID v4 recommended) */
  readonly id: string;
  /** Event type — must match a transition trigger in the FSM definition */
  readonly type: string;
  /** ISO 8601 timestamp when the event was created */
  readonly occurredAt: string;
  /** Machine definition identifier */
  readonly machineId: string;
  /** Unique instance identifier (e.g. orderId, userId) */
  readonly instanceId: string;
  /** State the machine was in before this event */
  readonly fromState: string;
  /** State the machine transitioned to after this event */
  readonly toState: string;
  /** Optional domain payload — use Avro schema for type safety in production */
  readonly payload?: TPayload;
  /** Schema ID from the registry, present when Avro encoding is used */
  readonly schemaId?: number;
}

/**
 * Creates a new DomainEvent with the current timestamp.
 * ID generation is delegated to the caller to keep this module pure.
 */
export function createEvent<TPayload = unknown>(
  params: Omit<DomainEvent<TPayload>, 'occurredAt'> & { occurredAt?: string },
): DomainEvent<TPayload> {
  return {
    ...params,
    occurredAt: params.occurredAt ?? new Date().toISOString(),
  };
}

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
 * AggregateEvent — event produced by an Aggregate transition (v0.2+).
 *
 * Extends DomainEvent with Aggregate-level fields.
 * machineVersion is stored for future multi-version replay support.
 * ED-CSE v0.x does NOT guarantee historical replay against old machine versions.
 */
export interface AggregateEvent<TPayload = unknown> extends DomainEvent<TPayload> {
  /** Domain entity type — matches AggregateDefinition.aggregateType */
  readonly aggregateType: string;
  /**
   * Version of the AggregateInstance AFTER this event was applied.
   * Matches AggregateInstance.version at the time of the transition.
   */
  readonly aggregateVersion: number;
  /**
   * Version of the StateMachine definition active when this event was produced.
   * Preserved for future multi-version replay. Not used in v0.x.
   */
  readonly machineVersion: number;
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

/**
 * Creates a new AggregateEvent with the current timestamp.
 */
export function createAggregateEvent<TPayload = unknown>(
  params: Omit<AggregateEvent<TPayload>, 'occurredAt'> & { occurredAt?: string },
): AggregateEvent<TPayload> {
  return {
    ...params,
    occurredAt: params.occurredAt ?? new Date().toISOString(),
  };
}

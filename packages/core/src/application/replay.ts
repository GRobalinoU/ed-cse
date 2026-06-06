/**
 * replay — reconstruct state at any point in time from the event log.
 *
 * This is one of the key differentiators of ED-CSE:
 * you can debug exactly what happened in production by replaying events.
 */

import type { IStateStore } from '../contracts/IStateStore.js';
import type { StateMachineDefinition } from '../domain/StateMachine.js';
import type { DomainEvent } from '../domain/Event.js';

export interface ReplayResult {
  /** The reconstructed state after applying all events up to the cutoff */
  state: string;
  /** Number of events applied */
  eventsApplied: number;
  /** The events that were applied, in order */
  eventLog: DomainEvent[];
}

export interface ReplayOptions {
  /** Replay only events up to this ISO 8601 timestamp */
  beforeTimestamp?: string;
  /** Replay only the first N events */
  limitEvents?: number;
}

export async function replay(
  params: {
    machine: StateMachineDefinition;
    instanceId: string;
    options?: ReplayOptions;
  },
  deps: { store: IStateStore },
): Promise<ReplayResult> {
  const { machine, instanceId, options } = params;

  let events = await deps.store.getEventLog(machine.id, instanceId);

  // Apply time filter
  if (options?.beforeTimestamp) {
    const cutoff = new Date(options.beforeTimestamp).getTime();
    events = events.filter((e) => new Date(e.occurredAt).getTime() < cutoff);
  }

  // Apply count limit
  if (options?.limitEvents !== undefined && options.limitEvents >= 0) {
    events = events.slice(0, options.limitEvents);
  }

  // Reconstruct state by replaying events
  let state = machine.initial;
  for (const event of events) {
    state = event.toState;
  }

  return {
    state,
    eventsApplied: events.length,
    eventLog: events,
  };
}

/**
 * StateMachine — core FSM definition.
 *
 * A StateMachineDefinition is a pure data structure — no side effects.
 * Runtime behavior (transitions, event sourcing) lives in application/.
 */

/** A single transition: given an event type, move to a target state */
export interface TransitionDefinition {
  /** Target state after the transition */
  target: string;
  /**
   * Optional guard predicate. If provided, the transition only fires when it returns true.
   * Keep guards pure — no side effects.
   */
  guard?: (context: TransitionContext) => boolean;
  /** Optional list of policy IDs that must pass before this transition is allowed */
  policies?: string[];
}

/** Context passed to guards and policies at transition time */
export interface TransitionContext {
  machineId: string;
  instanceId: string;
  fromState: string;
  eventType: string;
  payload?: unknown;
  metadata?: Record<string, unknown>;
}

/** Definition of a single state */
export interface StateDefinition {
  /**
   * 'final' states cannot have outgoing transitions.
   * Attempting to transition from a final state throws InvalidTransitionError.
   */
  type?: 'final';
  /**
   * Map of event type → transition definition.
   * Not present on final states.
   */
  on?: Record<string, TransitionDefinition | string>;
}

/** The complete FSM definition — serializable, no functions except guards */
export interface StateMachineDefinition {
  /** Unique identifier for this machine type */
  id: string;
  /** The state the machine starts in */
  initial: string;
  /** Map of state name → state definition */
  states: Record<string, StateDefinition>;
}

/**
 * Validates a StateMachineDefinition at creation time.
 * Throws descriptive errors rather than silently producing invalid machines.
 */
export function validateDefinition(def: StateMachineDefinition): void {
  if (!def.id?.trim()) {
    throw new Error('StateMachine must have a non-empty id');
  }
  if (!def.initial?.trim()) {
    throw new Error('StateMachine must have a non-empty initial state');
  }
  if (!def.states[def.initial]) {
    throw new Error(`Initial state "${def.initial}" is not defined in states`);
  }

  for (const [stateName, stateDef] of Object.entries(def.states)) {
    if (stateDef.type === 'final' && stateDef.on && Object.keys(stateDef.on).length > 0) {
      throw new Error(`Final state "${stateName}" cannot have outgoing transitions`);
    }

    if (stateDef.on) {
      for (const [eventType, transition] of Object.entries(stateDef.on)) {
        const target = typeof transition === 'string' ? transition : transition.target;
        if (!def.states[target]) {
          throw new Error(
            `State "${stateName}" has transition "${eventType}" pointing to unknown state "${target}"`,
          );
        }
      }
    }
  }
}

/**
 * Creates and validates a StateMachineDefinition.
 * This is the primary factory — always use this instead of raw object literals.
 */
export function createMachine(def: StateMachineDefinition): StateMachineDefinition {
  validateDefinition(def);
  return Object.freeze(def);
}

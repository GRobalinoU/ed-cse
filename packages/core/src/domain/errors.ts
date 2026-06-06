/**
 * Domain errors — typed errors for FSM violations.
 *
 * Using typed errors instead of generic Error allows consumers
 * to handle specific failure modes without string parsing.
 */

export class InvalidTransitionError extends Error {
  constructor(
    public readonly machineId: string,
    public readonly instanceId: string,
    public readonly fromState: string,
    public readonly eventType: string,
  ) {
    super(
      `Machine "${machineId}" (instance: "${instanceId}"): no transition defined from state "${fromState}" for event "${eventType}"`,
    );
    this.name = 'InvalidTransitionError';
  }
}

export class FinalStateError extends Error {
  constructor(
    public readonly machineId: string,
    public readonly instanceId: string,
    public readonly state: string,
  ) {
    super(
      `Machine "${machineId}" (instance: "${instanceId}"): cannot transition from final state "${state}"`,
    );
    this.name = 'FinalStateError';
  }
}

export class PolicyViolationError extends Error {
  constructor(
    public readonly policyId: string,
    public readonly reason: string,
    public readonly context: { machineId: string; instanceId: string; eventType: string },
  ) {
    super(
      `Policy "${policyId}" denied transition "${context.eventType}" on machine "${context.machineId}" (instance: "${context.instanceId}"): ${reason}`,
    );
    this.name = 'PolicyViolationError';
  }
}

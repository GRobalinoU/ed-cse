/**
 * Policy — authorization rules for state transitions.
 *
 * Policies answer: "is this actor allowed to trigger this transition?"
 * They are evaluated before guards and before the transition fires.
 */

import type { TransitionContext } from './StateMachine.js';

export interface PolicyResult {
  allowed: boolean;
  /** Human-readable reason, required when allowed is false */
  reason?: string;
}

export interface Policy {
  /** Unique identifier — referenced in TransitionDefinition.policies[] */
  id: string;
  /** Human-readable description */
  description: string;
  /**
   * Evaluates whether the transition is allowed.
   * Must be a pure function — no side effects.
   */
  evaluate(context: TransitionContext): PolicyResult | Promise<PolicyResult>;
}

/** Registry that holds named policies for lookup at transition time */
export class PolicyRegistry {
  private readonly policies = new Map<string, Policy>();

  register(policy: Policy): void {
    if (this.policies.has(policy.id)) {
      throw new Error(`Policy with id "${policy.id}" is already registered`);
    }
    this.policies.set(policy.id, policy);
  }

  get(id: string): Policy {
    const policy = this.policies.get(id);
    if (!policy) {
      throw new Error(`Policy "${id}" is not registered`);
    }
    return policy;
  }

  has(id: string): boolean {
    return this.policies.has(id);
  }
}

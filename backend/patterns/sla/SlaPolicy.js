// ============================================================
// STRATEGY PATTERN - SLA (Service Level Agreement) policies
// FR-N1: every ticket gets a priority, and the priority decides
// how long the support team has to resolve it.
//
// OOP principles shown here:
//  - Abstraction : SlaPolicy is an abstract base class. It defines WHAT
//                  every policy can do but cannot be created itself.
//  - Inheritance : Low/Medium/High/CriticalSla extend SlaPolicy and reuse
//                  calculateDueDate() and isBreached().
//  - Polymorphism: each subclass supplies its own responseHours and the
//                  Critical policy overrides requiresEscalation().
// ============================================================

const HOUR_MS = 60 * 60 * 1000;

class SlaPolicy {
  constructor() {
    if (new.target === SlaPolicy) {
      throw new TypeError('SlaPolicy is abstract and cannot be instantiated directly');
    }
  }

  // Abstract members - every concrete strategy must override these
  get priority() { throw new Error('priority getter must be implemented by subclass'); }
  get responseHours() { throw new Error('responseHours getter must be implemented by subclass'); }

  // Shared behaviour inherited by every strategy
  calculateDueDate(from = new Date()) {
    return new Date(new Date(from).getTime() + this.responseHours * HOUR_MS);
  }

  isBreached(ticket, now = new Date()) {
    return ticket.status !== 'Resolved' && !!ticket.dueDate && new Date(now) > new Date(ticket.dueDate);
  }

  requiresEscalation() {
    return false;
  }

  describe() {
    return `${this.priority} priority: resolve within ${this.responseHours} hours`;
  }
}

class LowSla extends SlaPolicy {
  get priority() { return 'Low'; }
  get responseHours() { return 72; }
}

class MediumSla extends SlaPolicy {
  get priority() { return 'Medium'; }
  get responseHours() { return 24; }
}

class HighSla extends SlaPolicy {
  get priority() { return 'High'; }
  get responseHours() { return 8; }
}

class CriticalSla extends SlaPolicy {
  get priority() { return 'Critical'; }
  get responseHours() { return 4; }

  // Polymorphism: only critical tickets are escalated to a team lead
  requiresEscalation() {
    return true;
  }
}

module.exports = { SlaPolicy, LowSla, MediumSla, HighSla, CriticalSla };

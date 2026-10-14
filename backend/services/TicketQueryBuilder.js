// ============================================================
// BUILDER PATTERN - builds a MongoDB filter for the agent dashboard
// FR-N3: agents can combine filters (status, team, priority, overdue)
// step by step:   new TicketQueryBuilder().withStatus('Open').withTeam('Network').build()
//
// OOP - Encapsulation: the filter object is a private field (#filter).
// Callers cannot put invalid values into it; every setter validates its
// input first, and build() returns a copy so the internal state stays safe.
// ============================================================

const STATUSES = ['Open', 'In Progress', 'Resolved'];
const TEAMS = ['Hardware', 'Software', 'Network', 'Account'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

class TicketQueryBuilder {
  #filter = {};

  static #check(value, allowed, field) {
    if (!allowed.includes(value)) {
      throw new RangeError(`Invalid ${field} "${value}". Allowed: ${allowed.join(', ')}`);
    }
  }

  withStatus(status) {
    if (!status) return this;
    TicketQueryBuilder.#check(status, STATUSES, 'status');
    this.#filter.status = status;
    return this;
  }

  withTeam(team) {
    if (!team) return this;
    TicketQueryBuilder.#check(team, TEAMS, 'team');
    this.#filter.team = team;
    return this;
  }

  withPriority(priority) {
    if (!priority) return this;
    TicketQueryBuilder.#check(priority, PRIORITIES, 'priority');
    this.#filter.priority = priority;
    return this;
  }

  onlyOverdue(flag) {
    if (flag !== true && flag !== 'true') return this;
    this.#filter.dueDate = { $lt: new Date() };
    if (!this.#filter.status) this.#filter.status = { $ne: 'Resolved' };
    return this;
  }

  build() {
    return { ...this.#filter };
  }
}

module.exports = { TicketQueryBuilder, STATUSES, TEAMS, PRIORITIES };

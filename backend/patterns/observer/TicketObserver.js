// ============================================================
// OBSERVER PATTERN - ticket lifecycle events
// FR-N2: whenever something happens to a ticket (created, assigned,
// priority changed, commented, resolved) every subscribed observer is
// notified automatically. Controllers only publish events; they do not
// need to know who is listening.
//
// OOP: TicketObserver is an abstract base class (abstraction);
// ActivityLogObserver and AuditLogObserver inherit from it and each
// implement update() differently (inheritance + polymorphism).
// ============================================================

class TicketObserver {
  constructor() {
    if (new.target === TicketObserver) {
      throw new TypeError('TicketObserver is abstract and cannot be instantiated directly');
    }
  }

  // eslint-disable-next-line no-unused-vars
  update(event) {
    throw new Error('update() must be implemented by subclass');
  }
}

// Writes a permanent, user-visible history entry onto the ticket document
class ActivityLogObserver extends TicketObserver {
  update({ ticket, action, actorId, details }) {
    if (!ticket) return;
    if (!Array.isArray(ticket.activityLog)) ticket.activityLog = [];
    ticket.activityLog.push({
      action,
      actorId: actorId || 'system',
      details: details || '',
      timestamp: new Date(),
    });
  }
}

// Writes a structured server-side audit line (visible in `pm2 logs`)
class AuditLogObserver extends TicketObserver {
  constructor(logger = console) {
    super();
    this.logger = logger;
  }

  update({ ticket, action, actorId }) {
    this.logger.log(JSON.stringify({
      audit: true,
      at: new Date().toISOString(),
      action,
      actorId: actorId || 'system',
      ticketId: ticket && ticket._id ? String(ticket._id) : null,
    }));
  }
}

module.exports = { TicketObserver, ActivityLogObserver, AuditLogObserver };

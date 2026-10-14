// Single shared event bus used by the whole app, with the default observers attached.
const TicketEventBus = require('./TicketEventBus');
const { ActivityLogObserver, AuditLogObserver } = require('./TicketObserver');

const eventBus = new TicketEventBus();
eventBus.subscribe(new ActivityLogObserver());
if (process.env.NODE_ENV !== 'test') {
  eventBus.subscribe(new AuditLogObserver());
}

const TicketEvents = Object.freeze({
  CREATED: 'TICKET_CREATED',
  ASSIGNED: 'TICKET_ASSIGNED',
  PRIORITY_CHANGED: 'PRIORITY_CHANGED',
  COMMENT_ADDED: 'COMMENT_ADDED',
  RESOLVED: 'TICKET_RESOLVED',
});

module.exports = { eventBus, TicketEvents };

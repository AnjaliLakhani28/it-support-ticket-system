const Ticket = require('../models/Ticket');
const { getSlaPolicy } = require('../patterns/sla/slaStrategies');
const { eventBus, TicketEvents } = require('../patterns/observer/eventBus');

const createTicket = async (req, res) => {
  const { title, description, category, userId, priority = 'Medium' } = req.body;
  try {
    // FR-N1: pick the SLA strategy for this priority (Strategy pattern)
    let sla;
    try {
      sla = getSlaPolicy(priority);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    const ticketData = {
      title,
      description,
      category,
      team: category,
      userId,
      status: "Open",
      priority: sla.priority,
      dueDate: sla.calculateDueDate(new Date()),
      activityLog: []
    };
    // FR-N2: observers record the creation before it is saved
    eventBus.notify({ ticket: ticketData, action: TicketEvents.CREATED, actorId: userId, details: `Priority ${sla.priority}` });

    const ticket = await Ticket.create(ticketData);
    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ userId: req.params.userId });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const resolveTicket = async (req, res) => {
  const { resolutionNotes, agentId } = req.body;
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (ticket.status !== "In Progress") {
      return res.status(400).json({ message: "Only tickets In Progress can be resolved" });
    }

    if (ticket.assignedAgentId !== agentId) {
      return res.status(403).json({ message: "Ticket is not assigned to this agent" });
    }

    if (!resolutionNotes) {
      return res.status(400).json({ message: "Resolution notes are required" });
    }

    ticket.status = "Resolved";
    ticket.resolutionNotes = resolutionNotes;
    eventBus.notify({ ticket, action: TicketEvents.RESOLVED, actorId: agentId, details: resolutionNotes });
    await ticket.save();

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const assignTicket = async (req, res) => {
  const { agentId } = req.body;
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (ticket.status !== "Open") {
      return res.status(400).json({ message: "Only Open tickets can be assigned" });
    }

    ticket.status = "In Progress";
    ticket.assignedAgentId = agentId;
    eventBus.notify({ ticket, action: TicketEvents.ASSIGNED, actorId: agentId, details: 'Status Open -> In Progress' });
    await ticket.save();

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// FR-N1: agent changes a ticket's priority -> SLA due date is recalculated
const updatePriority = async (req, res) => {
  const { priority, agentId } = req.body;
  try {
    let sla;
    try {
      sla = getSlaPolicy(priority);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    if (ticket.status === "Resolved") {
      return res.status(400).json({ message: "Cannot change priority of a resolved ticket" });
    }

    const oldPriority = ticket.priority;
    ticket.priority = sla.priority;
    // SLA clock starts when the ticket was created, not when priority changed
    ticket.dueDate = sla.calculateDueDate(ticket.createdAt || new Date());
    eventBus.notify({ ticket, action: TicketEvents.PRIORITY_CHANGED, actorId: agentId, details: `${oldPriority} -> ${sla.priority}` });
    await ticket.save();

    res.json({ ticket, sla: sla.describe(), escalate: sla.requiresEscalation(), changedBy: agentId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// FR-N1: list every unresolved ticket that is past its SLA due date
const getOverdueTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({
      status: { $ne: "Resolved" },
      dueDate: { $lt: new Date() }
    }).sort({ dueDate: 1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// FR-N2: user or agent adds a comment to a ticket
const MAX_COMMENT_LENGTH = 1000;
const addComment = async (req, res) => {
  const { text, authorId } = req.body;
  try {
    if (!text || !String(text).trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }
    if (String(text).length > MAX_COMMENT_LENGTH) {
      return res.status(400).json({ message: `Comment must be ${MAX_COMMENT_LENGTH} characters or fewer` });
    }
    if (!authorId) {
      return res.status(400).json({ message: "authorId is required" });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    ticket.comments.push({ text: String(text).trim(), authorId, timestamp: new Date() });
    eventBus.notify({ ticket, action: TicketEvents.COMMENT_ADDED, actorId: authorId, details: 'Comment added' });
    await ticket.save();

    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// FR-N2: full timeline for a ticket (comments + automatic activity log)
const getActivity = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    res.json({
      ticketId: ticket._id,
      title: ticket.title,
      status: ticket.status,
      comments: ticket.comments,
      activityLog: ticket.activityLog
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTicket, getTickets, resolveTicket, assignTicket,
  updatePriority, getOverdueTickets, addComment, getActivity
};
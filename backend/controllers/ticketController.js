const Ticket = require('../models/Ticket');
const { getSlaPolicy } = require('../patterns/sla/slaStrategies');

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

    const ticket = await Ticket.create({
      title,
      description,
      category,
      team: category,
      userId,
      status: "Open",
      priority: sla.priority,
      dueDate: sla.calculateDueDate(new Date())
    });
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

    ticket.priority = sla.priority;
    // SLA clock starts when the ticket was created, not when priority changed
    ticket.dueDate = sla.calculateDueDate(ticket.createdAt || new Date());
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

module.exports = { createTicket, getTickets, resolveTicket, assignTicket, updatePriority, getOverdueTickets };
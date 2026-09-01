const Ticket = require('../models/Ticket');

const createTicket = async (req, res) => {
  const { title, description, category, userId } = req.body;
  try {
    const ticket = await Ticket.create({
      title,
      description,
      category,
      team: category,
      userId,
      status: "Open"
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

module.exports = { createTicket, getTickets, resolveTicket, assignTicket };
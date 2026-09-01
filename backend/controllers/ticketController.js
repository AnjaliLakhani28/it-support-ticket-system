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

module.exports = { createTicket, getTickets };
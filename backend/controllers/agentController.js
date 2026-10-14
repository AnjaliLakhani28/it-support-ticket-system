// FR-N3: Agent dashboard - filtered ticket list and summary statistics
const Ticket = require('../models/Ticket');
const { TicketQueryBuilder } = require('../services/TicketQueryBuilder');

// GET /api/agent/tickets?status=Open&team=Network&priority=High&overdue=true
const getDashboardTickets = async (req, res) => {
  const { status, team, priority, overdue } = req.query;
  let filter;
  try {
    filter = new TicketQueryBuilder()
      .withStatus(status)
      .withTeam(team)
      .withPriority(priority)
      .onlyOverdue(overdue)
      .build();
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }

  try {
    const tickets = await Ticket.find(filter).sort({ dueDate: 1 }).limit(200);
    res.json({ count: tickets.length, filter, tickets });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/agent/stats - counts by status and priority + overdue total
const getDashboardStats = async (req, res) => {
  try {
    const [result] = await Ticket.aggregate([
      {
        $facet: {
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          byPriority: [{ $group: { _id: '$priority', count: { $sum: 1 } } }],
          overdue: [
            { $match: { status: { $ne: 'Resolved' }, dueDate: { $lt: new Date() } } },
            { $count: 'count' },
          ],
          total: [{ $count: 'count' }],
        },
      },
    ]);

    const toMap = (rows) => Object.fromEntries((rows || []).map((r) => [r._id || 'Unset', r.count]));
    res.json({
      total: result && result.total[0] ? result.total[0].count : 0,
      byStatus: toMap(result && result.byStatus),
      byPriority: toMap(result && result.byPriority),
      overdue: result && result.overdue[0] ? result.overdue[0].count : 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardTickets, getDashboardStats };

const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true, enum: ["Hardware", "Software", "Network", "Account"] },
  status: { type: String, default: "Open" },
  team: { type: String },
  userId: { type: String },
  assignedAgentId: { type: String },
  resolutionNotes: { type: String },
  comments: [{ text: String, authorId: String, timestamp: { type: Date, default: Date.now } }]
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);
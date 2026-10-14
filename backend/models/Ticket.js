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
  // FR-N1: priority drives the SLA due date (see patterns/sla)
  priority: { type: String, enum: ["Low", "Medium", "High", "Critical"], default: "Medium" },
  dueDate: { type: Date },
  comments: [{ text: String, authorId: String, timestamp: { type: Date, default: Date.now } }],
  // FR-N2: automatic history written by ActivityLogObserver (patterns/observer)
  activityLog: [{ action: String, actorId: String, details: String, timestamp: { type: Date, default: Date.now } }]
}, { timestamps: true, toJSON: { virtuals: true } });

// FR-N1: computed flag so the UI can highlight tickets that missed their SLA
ticketSchema.virtual('isOverdue').get(function () {
  return this.status !== 'Resolved' && !!this.dueDate && this.dueDate < new Date();
});

module.exports = mongoose.model('Ticket', ticketSchema);

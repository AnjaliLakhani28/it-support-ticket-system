// Unit tests for the ticket controller (Mocha + Chai + Sinon).
// Sinon stubs the Mongoose model so no real database is needed.
const { expect } = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const { createTicket, getTickets, assignTicket, resolveTicket } = require('../controllers/ticketController');

// Helper: fake Express response object
const mockRes = () => ({ status: sinon.stub().returnsThis(), json: sinon.spy() });

describe('Ticket Controller - existing functions (Assessment 1 baseline)', () => {
  afterEach(() => sinon.restore());

  describe('createTicket', () => {
    it('should create a ticket and return 201', async () => {
      const req = { body: { title: 'VPN down', description: 'Cannot connect', category: 'Network', userId: 'emp2024' } };
      const created = { _id: new mongoose.Types.ObjectId(), ...req.body, status: 'Open', team: 'Network' };
      const createStub = sinon.stub(Ticket, 'create').resolves(created);
      const res = mockRes();

      await createTicket(req, res);

      expect(createStub.calledOnce).to.be.true;
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledWith(created)).to.be.true;
    });

    it('should return 500 if the database fails', async () => {
      sinon.stub(Ticket, 'create').rejects(new Error('DB Error'));
      const req = { body: { title: 'T', description: 'D', category: 'Network', userId: 'emp2024' } };
      const res = mockRes();

      await createTicket(req, res);

      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWithMatch({ message: 'DB Error' })).to.be.true;
    });
  });

  describe('getTickets', () => {
    it('should return tickets for a user', async () => {
      const tickets = [{ title: 'A' }, { title: 'B' }];
      sinon.stub(Ticket, 'find').resolves(tickets);
      const res = mockRes();

      await getTickets({ params: { userId: 'emp2024' } }, res);

      expect(res.json.calledWith(tickets)).to.be.true;
    });
  });

  describe('assignTicket', () => {
    it('should move an Open ticket to In Progress', async () => {
      const ticket = { status: 'Open', save: sinon.stub().resolvesThis() };
      sinon.stub(Ticket, 'findById').resolves(ticket);
      const res = mockRes();

      await assignTicket({ params: { id: 'x' }, body: { agentId: 'agent007' } }, res);

      expect(ticket.status).to.equal('In Progress');
      expect(ticket.assignedAgentId).to.equal('agent007');
    });

    it('should return 404 if ticket does not exist', async () => {
      sinon.stub(Ticket, 'findById').resolves(null);
      const res = mockRes();

      await assignTicket({ params: { id: 'x' }, body: { agentId: 'agent007' } }, res);

      expect(res.status.calledWith(404)).to.be.true;
    });
  });

  describe('resolveTicket', () => {
    it('should resolve an In Progress ticket assigned to the agent', async () => {
      const ticket = { status: 'In Progress', assignedAgentId: 'agent007', save: sinon.stub().resolvesThis() };
      sinon.stub(Ticket, 'findById').resolves(ticket);
      const res = mockRes();

      await resolveTicket({ params: { id: 'x' }, body: { agentId: 'agent007', resolutionNotes: 'Reset VPN profile' } }, res);

      expect(ticket.status).to.equal('Resolved');
    });

    it('should return 403 if a different agent tries to resolve', async () => {
      sinon.stub(Ticket, 'findById').resolves({ status: 'In Progress', assignedAgentId: 'agent007' });
      const res = mockRes();

      await resolveTicket({ params: { id: 'x' }, body: { agentId: 'agent999', resolutionNotes: 'x' } }, res);

      expect(res.status.calledWith(403)).to.be.true;
    });
  });
});

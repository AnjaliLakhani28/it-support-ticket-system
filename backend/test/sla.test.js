// FR-N1 tests: SLA Strategy pattern + priority endpoints
const { expect } = require('chai');
const sinon = require('sinon');
const Ticket = require('../models/Ticket');
const { SlaPolicy, CriticalSla, LowSla } = require('../patterns/sla/SlaPolicy');
const { getSlaPolicy } = require('../patterns/sla/slaStrategies');
const { createTicket, updatePriority, getOverdueTickets } = require('../controllers/ticketController');

const mockRes = () => ({ status: sinon.stub().returnsThis(), json: sinon.spy() });
const HOUR = 3600 * 1000;

describe('FR-N1 SLA Strategy pattern', () => {
  it('should not allow the abstract SlaPolicy to be instantiated', () => {
    expect(() => new SlaPolicy()).to.throw(TypeError);
  });

  it('should calculate different due dates per priority (polymorphism)', () => {
    const start = new Date('2026-10-14T09:00:00Z');
    expect(getSlaPolicy('Critical').calculateDueDate(start).getTime() - start.getTime()).to.equal(4 * HOUR);
    expect(getSlaPolicy('High').calculateDueDate(start).getTime() - start.getTime()).to.equal(8 * HOUR);
    expect(getSlaPolicy('Medium').calculateDueDate(start).getTime() - start.getTime()).to.equal(24 * HOUR);
    expect(getSlaPolicy('Low').calculateDueDate(start).getTime() - start.getTime()).to.equal(72 * HOUR);
  });

  it('should only escalate Critical tickets', () => {
    expect(new CriticalSla().requiresEscalation()).to.be.true;
    expect(new LowSla().requiresEscalation()).to.be.false;
  });

  it('should detect a breached SLA only for unresolved tickets', () => {
    const past = new Date(Date.now() - HOUR);
    expect(new LowSla().isBreached({ status: 'Open', dueDate: past })).to.be.true;
    expect(new LowSla().isBreached({ status: 'Resolved', dueDate: past })).to.be.false;
  });

  it('should throw for an unknown priority', () => {
    expect(() => getSlaPolicy('Urgent')).to.throw(/Invalid priority/);
  });
});

describe('FR-N1 Priority endpoints', () => {
  afterEach(() => sinon.restore());

  it('createTicket should set priority and SLA due date', async () => {
    const createStub = sinon.stub(Ticket, 'create').callsFake(async (doc) => doc);
    const res = mockRes();
    await createTicket({ body: { title: 'Server down', description: 'Prod outage', category: 'Network', userId: 'emp2024', priority: 'Critical' } }, res);

    const saved = createStub.firstCall.args[0];
    expect(res.status.calledWith(201)).to.be.true;
    expect(saved.priority).to.equal('Critical');
    expect(saved.dueDate).to.be.instanceOf(Date);
  });

  it('createTicket should default to Medium priority', async () => {
    const createStub = sinon.stub(Ticket, 'create').callsFake(async (doc) => doc);
    await createTicket({ body: { title: 'T', description: 'D', category: 'Software', userId: 'emp2024' } }, mockRes());
    expect(createStub.firstCall.args[0].priority).to.equal('Medium');
  });

  it('createTicket should return 400 for an invalid priority', async () => {
    const res = mockRes();
    await createTicket({ body: { title: 'T', description: 'D', category: 'Software', userId: 'u', priority: 'Urgent' } }, res);
    expect(res.status.calledWith(400)).to.be.true;
  });

  it('updatePriority should recalculate the due date from creation time', async () => {
    const createdAt = new Date('2026-10-14T09:00:00Z');
    const ticket = { status: 'Open', createdAt, save: sinon.stub().resolvesThis() };
    sinon.stub(Ticket, 'findById').resolves(ticket);
    const res = mockRes();

    await updatePriority({ params: { id: 'x' }, body: { priority: 'High', agentId: 'agent007' } }, res);

    expect(ticket.priority).to.equal('High');
    expect(ticket.dueDate.getTime() - createdAt.getTime()).to.equal(8 * HOUR);
    expect(res.json.firstCall.args[0].escalate).to.be.false;
  });

  it('updatePriority should return 400 for a resolved ticket', async () => {
    sinon.stub(Ticket, 'findById').resolves({ status: 'Resolved' });
    const res = mockRes();
    await updatePriority({ params: { id: 'x' }, body: { priority: 'High' } }, res);
    expect(res.status.calledWith(400)).to.be.true;
  });

  it('updatePriority should return 404 if ticket not found', async () => {
    sinon.stub(Ticket, 'findById').resolves(null);
    const res = mockRes();
    await updatePriority({ params: { id: 'x' }, body: { priority: 'High' } }, res);
    expect(res.status.calledWith(404)).to.be.true;
  });

  it('getOverdueTickets should query unresolved tickets past due date', async () => {
    const sortStub = sinon.stub().resolves([{ title: 'late' }]);
    const findStub = sinon.stub(Ticket, 'find').returns({ sort: sortStub });
    const res = mockRes();

    await getOverdueTickets({}, res);

    const query = findStub.firstCall.args[0];
    expect(query.status).to.deep.equal({ $ne: 'Resolved' });
    expect(query.dueDate.$lt).to.be.instanceOf(Date);
    expect(res.json.calledWith([{ title: 'late' }])).to.be.true;
  });
});

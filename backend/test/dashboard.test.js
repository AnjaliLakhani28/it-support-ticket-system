// FR-N3 tests: Builder pattern + agent dashboard endpoints
const { expect } = require('chai');
const sinon = require('sinon');
const Ticket = require('../models/Ticket');
const { TicketQueryBuilder } = require('../services/TicketQueryBuilder');
const { getDashboardTickets, getDashboardStats } = require('../controllers/agentController');

const mockRes = () => ({ status: sinon.stub().returnsThis(), json: sinon.spy() });

describe('FR-N3 TicketQueryBuilder (Builder pattern + encapsulation)', () => {
  it('should build an empty filter when no options are given', () => {
    expect(new TicketQueryBuilder().build()).to.deep.equal({});
  });

  it('should combine status, team and priority filters', () => {
    const f = new TicketQueryBuilder().withStatus('Open').withTeam('Network').withPriority('High').build();
    expect(f).to.deep.equal({ status: 'Open', team: 'Network', priority: 'High' });
  });

  it('should add overdue conditions', () => {
    const f = new TicketQueryBuilder().onlyOverdue('true').build();
    expect(f.status).to.deep.equal({ $ne: 'Resolved' });
    expect(f.dueDate.$lt).to.be.instanceOf(Date);
  });

  it('should reject invalid filter values', () => {
    expect(() => new TicketQueryBuilder().withStatus('Closed')).to.throw(RangeError);
  });

  it('should not expose its internal filter (build returns a copy)', () => {
    const b = new TicketQueryBuilder().withTeam('Hardware');
    b.build().team = 'Hacked';
    expect(b.build().team).to.equal('Hardware');
    expect(b.filter).to.be.undefined;
  });
});

describe('FR-N3 Agent dashboard endpoints', () => {
  afterEach(() => sinon.restore());

  it('getDashboardTickets should return filtered tickets', async () => {
    const limitStub = sinon.stub().resolves([{ title: 'A' }]);
    const findStub = sinon.stub(Ticket, 'find').returns({ sort: () => ({ limit: limitStub }) });
    const res = mockRes();

    await getDashboardTickets({ query: { status: 'Open', team: 'Network' } }, res);

    expect(findStub.firstCall.args[0]).to.deep.equal({ status: 'Open', team: 'Network' });
    expect(res.json.firstCall.args[0].count).to.equal(1);
  });

  it('getDashboardTickets should return 400 for an invalid filter', async () => {
    const res = mockRes();
    await getDashboardTickets({ query: { priority: 'Urgent' } }, res);
    expect(res.status.calledWith(400)).to.be.true;
  });

  it('getDashboardStats should summarise counts', async () => {
    sinon.stub(Ticket, 'aggregate').resolves([{
      byStatus: [{ _id: 'Open', count: 3 }, { _id: 'Resolved', count: 2 }],
      byPriority: [{ _id: 'High', count: 1 }],
      overdue: [{ count: 1 }],
      total: [{ count: 5 }],
    }]);
    const res = mockRes();

    await getDashboardStats({}, res);

    expect(res.json.firstCall.args[0]).to.deep.equal({
      total: 5, byStatus: { Open: 3, Resolved: 2 }, byPriority: { High: 1 }, overdue: 1,
    });
  });

  it('getDashboardStats should return 500 on database error', async () => {
    sinon.stub(Ticket, 'aggregate').rejects(new Error('DB Error'));
    const res = mockRes();
    await getDashboardStats({}, res);
    expect(res.status.calledWith(500)).to.be.true;
  });
});

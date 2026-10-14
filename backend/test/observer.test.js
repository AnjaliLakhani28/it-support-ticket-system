// FR-N2 tests: Observer pattern + comments / activity endpoints
const { expect } = require('chai');
const sinon = require('sinon');
const Ticket = require('../models/Ticket');
const TicketEventBus = require('../patterns/observer/TicketEventBus');
const { TicketObserver, ActivityLogObserver, AuditLogObserver } = require('../patterns/observer/TicketObserver');
const { assignTicket, addComment, getActivity } = require('../controllers/ticketController');

const mockRes = () => ({ status: sinon.stub().returnsThis(), json: sinon.spy() });

describe('FR-N2 Observer pattern', () => {
  it('should not allow the abstract TicketObserver to be instantiated', () => {
    expect(() => new TicketObserver()).to.throw(TypeError);
  });

  it('should notify every subscribed observer', () => {
    const bus = new TicketEventBus();
    const logger = { log: sinon.spy() };
    bus.subscribe(new ActivityLogObserver());
    bus.subscribe(new AuditLogObserver(logger));
    const ticket = { _id: 'abc', activityLog: [] };

    bus.notify({ ticket, action: 'TICKET_ASSIGNED', actorId: 'agent007' });

    expect(ticket.activityLog).to.have.length(1);
    expect(ticket.activityLog[0].action).to.equal('TICKET_ASSIGNED');
    expect(logger.log.calledOnce).to.be.true;
  });

  it('should stop notifying an unsubscribed observer', () => {
    const bus = new TicketEventBus();
    const obs = new ActivityLogObserver();
    bus.subscribe(obs);
    bus.unsubscribe(obs);
    expect(bus.observerCount).to.equal(0);
  });

  it('should reject objects that are not TicketObservers', () => {
    expect(() => new TicketEventBus().subscribe({ update() {} })).to.throw(TypeError);
  });
});

describe('FR-N2 Comments and activity endpoints', () => {
  afterEach(() => sinon.restore());

  it('assignTicket should record an activity log entry automatically', async () => {
    const ticket = { status: 'Open', activityLog: [], save: sinon.stub().resolvesThis() };
    sinon.stub(Ticket, 'findById').resolves(ticket);

    await assignTicket({ params: { id: 'x' }, body: { agentId: 'agent007' } }, mockRes());

    expect(ticket.activityLog[0].action).to.equal('TICKET_ASSIGNED');
    expect(ticket.activityLog[0].actorId).to.equal('agent007');
  });

  it('addComment should add a comment and return 201', async () => {
    const ticket = { comments: [], activityLog: [], save: sinon.stub().resolvesThis() };
    sinon.stub(Ticket, 'findById').resolves(ticket);
    const res = mockRes();

    await addComment({ params: { id: 'x' }, body: { text: 'Restarted router, still failing', authorId: 'emp2024' } }, res);

    expect(res.status.calledWith(201)).to.be.true;
    expect(ticket.comments[0].text).to.equal('Restarted router, still failing');
    expect(ticket.activityLog[0].action).to.equal('COMMENT_ADDED');
  });

  it('addComment should return 400 for empty text', async () => {
    const res = mockRes();
    await addComment({ params: { id: 'x' }, body: { text: '   ', authorId: 'emp2024' } }, res);
    expect(res.status.calledWith(400)).to.be.true;
  });

  it('addComment should return 400 for text over 1000 characters', async () => {
    const res = mockRes();
    await addComment({ params: { id: 'x' }, body: { text: 'a'.repeat(1001), authorId: 'emp2024' } }, res);
    expect(res.status.calledWith(400)).to.be.true;
  });

  it('addComment should return 404 if ticket not found', async () => {
    sinon.stub(Ticket, 'findById').resolves(null);
    const res = mockRes();
    await addComment({ params: { id: 'x' }, body: { text: 'hi', authorId: 'emp2024' } }, res);
    expect(res.status.calledWith(404)).to.be.true;
  });

  it('getActivity should return comments and activity log', async () => {
    sinon.stub(Ticket, 'findById').resolves({ _id: 'x', title: 'VPN', status: 'Open', comments: [{ text: 'c' }], activityLog: [{ action: 'TICKET_CREATED' }] });
    const res = mockRes();
    await getActivity({ params: { id: 'x' } }, res);
    const body = res.json.firstCall.args[0];
    expect(body.comments).to.have.length(1);
    expect(body.activityLog[0].action).to.equal('TICKET_CREATED');
  });
});

// NFR tests: run the real Express app over HTTP (database stubbed with Sinon)
const { expect } = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const app = require('../app');
const { dbStatus } = require('../controllers/healthController');

let server;
let base;

before((done) => {
  server = app.listen(0, () => {
    base = `http://127.0.0.1:${server.address().port}`;
    done();
  });
});
after((done) => server.close(done));
afterEach(() => sinon.restore());

const post = (path, body, raw) => fetch(base + path, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: raw !== undefined ? raw : JSON.stringify(body),
});

describe('NFR-N4 Availability - health check', () => {
  it('should return 200 and the instance name when the database is connected', async () => {
    sinon.stub(dbStatus, 'isConnected').returns(true);
    const res = await fetch(`${base}/api/health`);
    const body = await res.json();
    expect(res.status).to.equal(200);
    expect(body.status).to.equal('ok');
    expect(body.instance).to.be.a('string');
  });

  it('should return 503 when the database is disconnected', async () => {
    sinon.stub(dbStatus, 'isConnected').returns(false);
    const res = await fetch(`${base}/api/health`);
    expect(res.status).to.equal(503);
  });
});

describe('NFR-N1 Security', () => {
  it('should send security headers and hide the X-Powered-By header', async () => {
    const res = await fetch(`${base}/api/health`);
    expect(res.headers.get('x-content-type-options')).to.equal('nosniff');
    expect(res.headers.get('x-frame-options')).to.equal('SAMEORIGIN');
    expect(res.headers.get('content-security-policy')).to.include("default-src 'self'");
    expect(res.headers.get('x-powered-by')).to.be.null;
  });

  it('should reject request bodies larger than 10kb with 413', async () => {
    const res = await post('/api/tickets', { title: 'x', description: 'a'.repeat(20000) });
    expect(res.status).to.equal(413);
  });
});

describe('NFR-N2 Input validation and error handling', () => {
  it('should return 400 with all validation errors for an invalid ticket', async () => {
    const res = await post('/api/tickets', { title: '', category: 'Printer' });
    const body = await res.json();
    expect(res.status).to.equal(400);
    expect(body.errors).to.include('title is required');
    expect(body.errors).to.include('userId is required');
  });

  it('should return 400 for a malformed ticket ID instead of 500', async () => {
    const res = await fetch(`${base}/api/tickets/not-an-id/activity`);
    expect(res.status).to.equal(400);
  });

  it('should return 400 for malformed JSON', async () => {
    const res = await post('/api/tickets', null, '{"title": ');
    expect(res.status).to.equal(400);
  });

  it('should return 404 for an unknown API route', async () => {
    const res = await fetch(`${base}/api/does-not-exist`);
    expect(res.status).to.equal(404);
  });

  it('should create a valid ticket end-to-end through the API (201)', async () => {
    sinon.stub(Ticket, 'create').callsFake(async (doc) => ({ _id: new mongoose.Types.ObjectId(), ...doc }));
    const res = await post('/api/tickets', { title: 'VPN down', description: 'Cannot connect', category: 'Network', userId: 'emp2024', priority: 'High' });
    const body = await res.json();
    expect(res.status).to.equal(201);
    expect(body.priority).to.equal('High');
  });
});

describe('NFR-N1 Rate limiting', () => {
  it('should return 429 after too many write requests from one IP', async function () {
    this.timeout(20000);
    let last;
    for (let i = 0; i < 205; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      last = await post('/api/tickets', {});
    }
    expect(last.status).to.equal(429);
  });
});

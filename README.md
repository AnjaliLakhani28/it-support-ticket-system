# IT Support Ticket System

A full-stack IT help-desk application (IFN636 Assessment 2) built with Node.js, Express, MongoDB Atlas and a plain HTML/JS frontend, deployed on AWS EC2 behind an Application Load Balancer.

## Features
- Submit, view, assign and resolve support tickets (Assessment 1)
- **FR-N1** Ticket priority with SLA due dates and overdue tracking (Strategy pattern)
- **FR-N2** Comments and automatic activity timeline (Observer pattern)
- **FR-N3** Agent dashboard with filters and summary statistics (Builder pattern)
- **NFRs** Security headers, rate limiting, input validation, XSS protection, health check

## Running locally
1. `cd backend && npm install`
2. Create `backend/.env` containing `MONGO_URI=<your Atlas URI>` and `PORT=5001`
3. `npm start` and open http://localhost:5001

## Testing
```bash
cd backend
npm install
npm test
```

## Deployment
Not documented yet.

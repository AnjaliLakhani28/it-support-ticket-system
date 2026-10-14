# IT Support Ticket System

A full-stack IT help-desk application (IFN636 Assessment 2) built with Node.js, Express, MongoDB Atlas and a plain HTML/JS frontend, deployed on AWS EC2 behind an Application Load Balancer.

## Features
- Submit, view, assign and resolve support tickets (Assessment 1)
- **FR-N1** Ticket priority with SLA due dates and overdue tracking (Strategy pattern)
- **FR-N2** Comments and automatic activity timeline (Observer pattern)
- **FR-N3** Agent dashboard with filters and summary statistics (Builder pattern)
- **NFRs** Security headers, rate limiting, input validation, XSS protection, health check

## Running locally
Run `node server.js` from the backend folder after adding a `.env` file (see Deployment).

## Testing
```bash
cd backend
npm install
npm test
```

## Deployment
- Every push to `main` runs the GitHub Actions workflow (`.github/workflows/ci.yml`): tests run first, then the self-hosted runner on EC2 restarts the app with pm2 (`ecosystem.config.js`).
- The app runs on two EC2 instances behind an AWS Application Load Balancer; the target group health check uses `GET /api/health` on port 5001.

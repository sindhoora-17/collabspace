# CollabSpace

CollabSpace is a full-stack real-time team collaboration platform built with React, NestJS, PostgreSQL, Prisma, WebSockets, and AWS.

It supports workspace-based collaboration, project management, Kanban-style task tracking, comments, activity history, team invitations, and real-time updates.

The application is designed around a production-style cloud architecture using AWS services including ECS/Fargate, ECR, RDS, Systems Manager Parameter Store, CloudWatch, S3, and CloudFront.

## Features

- User registration and JWT-based authentication
- Workspace creation and team membership
- Role-based workspace access for owners, admins, and members
- Workspace invitations with token-based acceptance
- Project creation and management
- Kanban-style task board with drag-and-drop
- Task statuses, priorities, due dates, and assignees
- Task comments and collaboration
- Real-time task updates using Socket.IO
- Project activity history
- Persistent relational data with PostgreSQL and Prisma
- Dockerized backend deployment
- AWS-hosted backend and database infrastructure
- Centralized environment configuration through AWS Systems Manager Parameter Store
- Application logging and monitoring through Amazon CloudWatch

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- TanStack React Query
- Zustand
- React Router
- dnd-kit
- Axios
- Socket.IO Client

### Backend

- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT
- Passport
- bcrypt
- Socket.IO
- Vitest

### Cloud & Infrastructure

- Amazon ECS
- AWS Fargate
- Amazon ECR
- Amazon RDS for PostgreSQL
- AWS Systems Manager Parameter Store
- Amazon CloudWatch
- Amazon S3
- Amazon CloudFront
- Docker
- Docker Compose

## AWS Architecture

CollabSpace separates static frontend hosting from backend compute, database, configuration, and logging.

```text
Users
  │
  │ HTTPS
  ▼
CloudFront
  │
  ▼
Private S3 bucket
React / Vite frontend


Docker build
  │
  ▼
Amazon ECR
  │
  ▼
ECS / Fargate
NestJS API
  │
  ▼
Amazon RDS
PostgreSQL

Parameter Store ──► ECS runtime configuration
CloudWatch Logs ◄── ECS application/container logs
```

The frontend is currently deployed through **S3 + CloudFront**. The ECS/Fargate backend and RDS database are operated on demand to control portfolio-project cost.

A permanently running Application Load Balancer is intentionally not part of the current always-on environment. A temporary or permanent ALB can be added when a stable public HTTPS API/WebSocket endpoint is needed.

For the complete AWS setup, deployment flow, resource responsibilities, security notes, and cost-conscious operating model, see **[AWS Deployment](docs/aws-deployment.md)**.

## Backend Deployment

The NestJS backend is containerized using Docker.

Application images are built and stored in a private Amazon ECR repository. ECS runs the backend using AWS Fargate, allowing the application to run without managing EC2 instances directly.

The deployed backend connects to PostgreSQL running on Amazon RDS.

Environment-specific configuration and sensitive values are kept outside the application source code using AWS Systems Manager Parameter Store.

CloudWatch is used for application and container logging.

## Database

CollabSpace uses PostgreSQL with Prisma ORM.

The application data model includes:

- Users
- Workspaces
- Workspace memberships
- Invitations
- Projects
- Tasks
- Comments
- Activity history

Prisma migrations are used to version and deploy database schema changes.

The production-style AWS environment uses Amazon RDS for PostgreSQL.

## Data Model

### User

Stores account and profile information.

Users can:

- Belong to multiple workspaces
- Receive task assignments
- Create comments
- Perform tracked project activity

### Workspace

Represents a shared collaboration space for a team.

Each workspace can contain:

- Members
- Invitations
- Projects

### Workspace Membership

Workspace membership connects users to workspaces and stores their role.

Supported roles:

```text
OWNER
ADMIN
MEMBER
```

### Invitation

Workspace invitations are stored with:

- Invitee email
- Secure invitation token
- Expiration time
- Acceptance status
- Inviting user
- Target workspace

### Project

Projects belong to workspaces and contain tasks and project activity.

### Task

Tasks support:

- Title
- Description
- Status
- Priority
- Due date
- Assignee
- Kanban position
- Comments
- Activity tracking

Task workflow:

```text
TODO → IN_PROGRESS → REVIEW → DONE
```

Task priorities:

```text
LOW | MEDIUM | HIGH | URGENT
```

### Comment

Users can add comments to tasks to support collaboration and discussion.

### Activity

CollabSpace records important project events including:

```text
TASK_CREATED
TASK_UPDATED
TASK_MOVED
TASK_DELETED
COMMENT_ADDED
```

Activity records include the user performing the action, project context, optional task context, timestamp, and supporting metadata.

## Real-Time Collaboration

CollabSpace uses Socket.IO for real-time collaboration.

When task or project data changes, connected clients can receive updates without relying only on manual refreshes.

The backend combines traditional REST APIs with WebSocket-based events to support:

- Task creation updates
- Task modifications
- Kanban task movement
- Task deletion
- Comments
- Project activity updates

## Authentication & Authorization

Authentication is implemented using JWT and Passport.

Passwords are hashed using bcrypt before storage.

Protected backend routes validate the user's authentication state before allowing access.

Workspace membership and roles are used to restrict access to workspace resources.

## Frontend

The frontend is built with React and TypeScript using Vite.

TanStack React Query handles server state and API data fetching, while Zustand is used for lightweight client-side state management.

The Kanban interface uses dnd-kit for drag-and-drop task movement.

Socket.IO Client connects the frontend to the backend's real-time event layer.

## Project Structure

```text
collabspace/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   ├── src/
│   ├── test/
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

## Running Locally

### Prerequisites

Make sure you have:

- Node.js
- npm
- Docker
- Docker Compose

## 1. Clone the Repository

```bash
git clone https://github.com/sindhoora-17/collabspace.git
cd collabspace
```

## 2. Start PostgreSQL

The repository includes a Docker Compose configuration for PostgreSQL.

```bash
docker compose up -d
```

This starts a local PostgreSQL instance for development.

## 3. Configure the Backend

Move into the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a local `.env` file.

Example:

```env
DATABASE_URL="postgresql://collabspace:collabspace@localhost:5432/collabspace"
JWT_SECRET="replace-with-a-local-secret"
```

Do not commit real credentials or production secrets.

Apply the database migrations for your environment, then start the API:

```bash
npm run start:dev
```

## 4. Start the Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite will start the frontend development server.

## Testing

Backend tests use Vitest.

Run the test suite with:

```bash
cd backend
npm test
```

For coverage:

```bash
npm run test:cov
```

## Docker

The backend includes a Dockerfile for building the NestJS application into a deployable container image.

In the AWS deployment workflow, the image is pushed to Amazon ECR and used by ECS/Fargate.

## Deployment Flow

### Backend

```text
Source Code
    ↓
Docker Build
    ↓
Amazon ECR
    ↓
Amazon ECS / Fargate
    ↓
NestJS Application
    ↓
Amazon RDS PostgreSQL
```

Application configuration is provided through AWS Systems Manager Parameter Store, and runtime logs are available through CloudWatch.

### Frontend

```text
React / TypeScript
    ↓
Vite Production Build
    ↓
Private Amazon S3 Bucket
    ↓
Amazon CloudFront
    ↓
HTTPS Frontend
```

CloudFront uses the S3 bucket as a private origin, serves `index.html` as the default root object, and maps 403/404 responses back to `index.html` so React Router routes can be refreshed directly.

See **[docs/aws-deployment.md](docs/aws-deployment.md)** for the detailed deployment architecture and operating notes.

## Current Status

Implemented and verified:

- Authentication
- Workspace creation and membership
- OWNER / ADMIN / MEMBER authorization
- Token-based invitations
- Projects
- Kanban task management
- Task assignment
- Task priorities and due dates
- Comments
- Activity tracking
- Real-time Socket.IO updates
- JWT-authenticated project-room subscriptions
- Protection against realtime updates overwriting unsaved task edits
- PostgreSQL persistence with Prisma migrations
- Dockerized NestJS backend
- Amazon ECR image storage
- ECS/Fargate backend deployment
- Amazon RDS PostgreSQL integration
- Systems Manager Parameter Store configuration
- CloudWatch logging
- Private S3 frontend hosting
- CloudFront HTTPS delivery and SPA route fallback

### Current hosting model

The static frontend remains available through S3 + CloudFront.

The backend and RDS database are intentionally run on demand to control cost. The current environment does not keep an Application Load Balancer running continuously, so the CloudFront-hosted frontend is not presented as a permanently wired public full-stack demo.

For a recorded demo or a continuously available deployment, the next infrastructure step is to place a stable HTTPS endpoint such as an ALB in front of ECS and build the frontend with the corresponding production API and Socket.IO URLs.

### Future improvements

- CI/CD automation for frontend and backend deployments
- Stable public HTTPS API/WebSocket endpoint for an always-on demo
- Expanded automated test coverage
- Notification support
- Additional workspace administration controls
- More advanced project analytics

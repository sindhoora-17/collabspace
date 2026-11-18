# AWS Deployment

This document describes the AWS infrastructure used to deploy CollabSpace and the deployment decisions behind it.

The goal of the AWS setup is to demonstrate a production-style split between frontend hosting, containerized backend compute, managed PostgreSQL, secret/configuration management, and centralized logs without keeping unnecessary paid resources running continuously.

## Region

The backend infrastructure is deployed in **US East (Ohio), us-east-2**.

CloudFront is a global service and sits in front of the static frontend.

## Current Deployment State

The project currently uses:

- **Amazon S3 + CloudFront** for the React frontend
- **Amazon ECR** for the backend container image
- **Amazon ECS on AWS Fargate** for the NestJS API
- **Amazon RDS for PostgreSQL** for persistent application data
- **AWS Systems Manager Parameter Store** for backend secrets/configuration
- **Amazon CloudWatch Logs** for ECS application/container logs

The frontend is deployed and served over HTTPS through CloudFront.

The backend and RDS database are intentionally operated **on demand** to control portfolio-project cost. The ECS service can be scaled down when not being demonstrated, and the RDS instance can be stopped when not needed.

A permanently running Application Load Balancer is not currently used. For a recorded demo or a permanently live public environment, an ALB (or another stable HTTPS API endpoint) can be added in front of ECS and then wired to the production frontend.

## Architecture

```text
                                  ┌──────────────────────┐
                                  │        Users         │
                                  └──────────┬───────────┘
                                             │
                                           HTTPS
                                             │
                                             ▼
                                  ┌──────────────────────┐
                                  │     CloudFront       │
                                  │  collabspace-frontend│
                                  └──────────┬───────────┘
                                             │
                                             ▼
                                  ┌──────────────────────┐
                                  │      Amazon S3       │
                                  │   React/Vite build   │
                                  └──────────────────────┘


        Docker build
             │
             ▼
    ┌───────────────────┐
    │    Amazon ECR     │
    │ collabspace-backend│
    └─────────┬─────────┘
              │ image pull
              ▼
    ┌───────────────────┐
    │   ECS / Fargate   │
    │   NestJS API      │
    └─────────┬─────────┘
              │
              ▼
    ┌───────────────────┐
    │    Amazon RDS     │
    │    PostgreSQL     │
    └───────────────────┘

    Parameter Store ───────► ECS task configuration
    CloudWatch Logs ◄─────── ECS application/container logs
```

## Frontend: S3 + CloudFront

The production frontend is built with Vite and uploaded to a private S3 bucket.

### S3

Bucket:

```text
collabspace-frontend-sindhoora
```

The bucket is not public. CloudFront is granted access to the bucket using private origin access.

The uploaded build has the following shape:

```text
index.html
assets/
  index-*.js
  index-*.css
```

S3 static website hosting is not required because CloudFront uses the regular S3 origin.

### CloudFront

Distribution name:

```text
collabspace-frontend
```

Important settings:

- Private S3 origin access
- HTTPS viewer access
- Default root object: `index.html`
- Custom 403 response: `/index.html` with HTTP 200
- Custom 404 response: `/index.html` with HTTP 200

The 403/404 responses provide SPA fallback behavior so React Router routes can be refreshed directly without returning an S3 error.

## Backend: Docker + ECR + ECS/Fargate

The NestJS API is packaged with the backend `Dockerfile`.

The image is built locally and pushed to the private ECR repository:

```text
collabspace-backend
```

The production image includes:

- Compiled NestJS application
- Prisma client
- PostgreSQL TLS support
- AWS RDS global CA bundle

The database connection uses certificate verification rather than disabling TLS verification.

### ECS

Cluster:

```text
collabspace-cluster
```

Service:

```text
collabspace-backend-service
```

The service runs on AWS Fargate using the container image stored in ECR.

The task exposes the NestJS application on port `3000` and provides a `/health` endpoint for deployment verification.

The service can be scaled to zero tasks when the project is not being used. When a new backend image is pushed to ECR, a new ECS deployment pulls the updated image.

## Database: Amazon RDS for PostgreSQL

The deployed backend connects to PostgreSQL running on Amazon RDS.

Application data stored in RDS includes:

- Users
- Workspaces
- Workspace memberships
- Invitations
- Projects
- Tasks
- Comments
- Activity history

Prisma migrations version the schema and are kept in the repository under:

```text
backend/prisma/migrations/
```

The RDS instance can be stopped while the project is idle to reduce compute cost. Database storage remains persistent while the instance is stopped.

## Configuration and Secrets

Production secrets are not committed to the repository.

The ECS task reads configuration from AWS Systems Manager Parameter Store, including:

```text
/collabspace/backend/DATABASE_URL
/collabspace/backend/JWT_SECRET
```

The ECS task execution role has permission to read the required parameters at startup.

Local development uses a separate `.env` file that is excluded from version control.

## Logging and Monitoring

ECS sends backend logs to CloudWatch Logs.

The configured log group is:

```text
/ecs/collabspace-backend
```

This captures NestJS startup output, request/runtime errors, and container logs without requiring SSH access to the running task.

## Networking and Access

The current portfolio environment intentionally avoids a permanently running Application Load Balancer.

During development or deployment verification:

- the ECS task runs with public networking enabled
- backend access is restricted through security-group rules
- RDS accepts PostgreSQL traffic from the backend security group
- developer database access is limited separately

For a permanently public deployment, the intended next step is:

```text
CloudFront / HTTPS
        │
        ▼
Application Load Balancer
        │
        ▼
ECS / Fargate
        │
        ▼
RDS PostgreSQL
```

This would provide a stable HTTPS API/WebSocket endpoint. It is intentionally not left running today because an ALB incurs an hourly charge even when the application receives no traffic.

## Backend Deployment Flow

```text
Source code
    │
    ▼
docker build
    │
    ▼
Amazon ECR
    │
    ▼
ECS / Fargate deployment
    │
    ▼
/health verification
    │
    ▼
NestJS API
    │
    ▼
Amazon RDS PostgreSQL
```

A typical image deployment is:

```bash
docker build -t collabspace-backend .

docker tag collabspace-backend:latest \
  <account>.dkr.ecr.us-east-2.amazonaws.com/collabspace-backend:latest

aws ecr get-login-password --region us-east-2 \
  | docker login --username AWS --password-stdin \
    <account>.dkr.ecr.us-east-2.amazonaws.com

docker push \
  <account>.dkr.ecr.us-east-2.amazonaws.com/collabspace-backend:latest
```

The account identifier is intentionally omitted from the documentation.

## Frontend Deployment Flow

```text
React / TypeScript source
        │
        ▼
npm run build
        │
        ▼
frontend/dist
        │
        ▼
private S3 bucket
        │
        ▼
CloudFront
        │
        ▼
HTTPS frontend
```

After a new frontend build is uploaded, a CloudFront invalidation can be used when an immediate cache refresh is required.

## Cost-Conscious Operation

This is a portfolio project rather than a continuously used production service, so the infrastructure is deliberately operated with cost in mind.

When the application is not being demonstrated:

- ECS desired task count can be set to `0`
- the RDS instance can be stopped
- S3 and CloudFront remain available for the static frontend
- no always-on ALB is maintained

This preserves the deployed AWS architecture while avoiding unnecessary compute and load-balancer charges.

## Security Notes

- Production secrets are stored outside source control.
- Passwords are hashed with bcrypt.
- REST routes use JWT authentication and workspace authorization.
- Socket.IO project subscriptions validate JWTs and workspace membership.
- The S3 frontend bucket remains private behind CloudFront.
- RDS TLS certificate verification is enabled.
- Security-group rules restrict backend and database access.

## What Is Demonstrated

The AWS deployment demonstrates practical experience with:

- containerizing a backend service
- publishing images to ECR
- running containers on ECS/Fargate
- connecting a containerized service to RDS PostgreSQL
- managing runtime secrets with Parameter Store
- centralizing application logs in CloudWatch
- hosting a private static frontend through S3 + CloudFront
- configuring SPA routing behavior at the CDN layer
- balancing deployment architecture with cloud operating cost

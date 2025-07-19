# IAM Backend Service

This is an Identity and Access Management (IAM) RESTful API built with Node.js, TypeScript, Express, and TypeORM.

## Table of Contents

- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Service](#running-the-service)
- [Database Migrations](#database-migrations)
- [Running Tests](#running-tests)
- [API Testing](#api-testing)

## Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v18 or higher)
- npm or Yarn
- PostgreSQL (or your preferred database, configured in `src/config/database.ts`)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Dev-folabi/iam-backend-service
    cd iam-backend-service
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root directory of the project and add the necessary environment variables. You can use `.env.example` as a reference.

    ```
    PORT=3000
    DATABASE_URL="postgresql://user:password@localhost:5432/iam_database"
    JWT_SECRET="your_jwt_secret_key"
    JWT_REFRESH_SECRET="your_jwt_refresh_secret_key"
    ACCESS_TOKEN_EXPIRATION="1h"
    REFRESH_TOKEN_EXPIRATION="7d"
    ```

### Running the Service

You can run the service in development mode or production mode.

-   **Development Mode (with hot-reloading):**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    The API will be accessible at `http://localhost:3000` (or the port specified in your `.env` file).

-   **Production Mode:**
    First, build the project:
    ```bash
    npm run build
    # or
    yarn build
    ```
    Then, start the service:
    ```bash
    npm start
    # or
    yarn start
    ```

## Database Migrations

This project uses TypeORM for database migrations.

-   **Run all pending migrations:**
    ```bash
    npm run migrate
    # or
    yarn migrate
    ```

-   **Rollback the last migration:**
    ```bash
    npm run migrate:rollback
    # or
    yarn migrate:rollback
    ```

-   **Seed the database with initial data:**
    ```bash
    npm run seed
    # or
    yarn seed
    ```

-   **Clear seeded data:**
    ```bash
    npm run seed:clear
    # or
    yarn seed:clear
    ```

-   **Reseed the database (clear and then seed):**
    ```bash
    npm run seed:reseed
    # or
    yarn seed:reseed
    ```

## Running Tests

The project uses Jest for unit and integration testing.

-   **Run all tests:**
    ```bash
    npm test
    # or
    yarn test
    ```

-   **Run tests in watch mode:**
    ```bash
    npm run test:watch
    # or
    yarn test:watch
    ```

-   **Run tests with coverage report:**
    ```bash
    npm run test:coverage
    # or
    yarn test:coverage
    ```
## API Testing

You can test the API endpoints using this Postman collection:

 [IAM Backend Postman Collection](https://www.postman.com/ayomide-odewale/iam-backend/collection/u4ud1fx/iam-backend-service?action=share&source=copy-link&creator=37738967)

Make sure to:
1. Set `{{baseUrl}}` to `http://localhost:5000`
2. Replace tokens (if required) after logging in

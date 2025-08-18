## NutriSaas: Technical Assessment Backend

### Description
This backend is a Node.js application that serves as the core of the NutriSaas platform. It handles user authentication, data persistence, and API logic. It exposes a GraphQL API to the frontend and integrates with a Python NLP service for chatbot functionality.

***

### Tech Stack
* **Node.js:** The runtime environment for the application.
* **Express.js:** A web framework used to handle middleware and routing.
* **Apollo Server:** The GraphQL server implementation that defines the API schema and resolvers.
8 **PostgreSQL:** The database used for storing user and chatbot data.
* **`pg`:** A Node.js driver for PostgreSQL.
* **`bcrypt`:** Used for password hashing to ensure secure user authentication.
* **`jsonwebtoken`:** Used for generating and verifying JSON Web Tokens for authentication.
* **`express-rate-limit`:** Middleware to limit repeated requests to public APIs, enhancing security.

***

### Prerequisites
To run the backend, you need the following installed:
* Node.js (v18 or higher).
* Local PostgreSQL instance.
* npm or yarn

***

### Setup and Installation
Follow these steps to set up and run the backend service:

1.  **Database Setup**
    The backend uses a PostgreSQL database. You can use the provided `initialSchema.sql` to set up the tables.
    * Create a PostgreSQL database.
    * Run the schema to create the necessary tables:
        ```bash
        psql -h <your_host> -U <your_user> -d <your_database> -f backend/database/initialSchema.sql
        ```

2.  **Backend Setup**
    * Navigate to the `backend` directory:
        ```bash
        cd backend
        ```
    * Install dependencies:
        ```bash
        npm install
        ```
    * Create a `.env` file with the following variables:
        ```
        PORT=4000
        DB_USER=your_username
        DB_HOST=localhost
        DB_DATABASE=your_database
        DB_PASSWORD=your_password
        DB_PORT=5432
        JWT_SECRET=your_super_secret_jwt_key
        ```
    * Start the server:
        ```bash
        node server.js
        ```
    The GraphQL server will be running at `http://localhost:4000/graphql`.

***

### API Endpoints
The backend exposes a single GraphQL endpoint: `http://localhost:4000/graphql`. All data fetching and modifications (queries and mutations) are handled through this single endpoint. The schema, defined in `server.js`, includes operations for:
* User authentication (`signup`, `login`, `logout`).
* Password management (`requestPasswordReset`, `resetPassword`).
* Chatbot interaction (`chatbot`, `adminChatbot`).
* User data management (`userInfo`, `saveInitialInfo`, `updateUserInfo`).
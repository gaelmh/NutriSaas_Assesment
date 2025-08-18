## NutriSaas: Technical Assessment

### Project Description
This project is a full-stack application built as a technical assessment for Grupo Bitsper. It features a nutritional chatbot designed to interact with users, providing a personalized and administrative experience.

***

### Key Features
* **Main Interface:** The application provides a main interface where the user can decide whether to sing up, log in, or continue as a guest.
* **Public Chatbot Interface:** The chatbot offers provides information about the service without requiring an account. 
* **Private Chatbot Interface:** The chatbot offers a personalized experience for logged-in users, allowing them to interact with the chatbot and store their personal data.
* **Admin Chatbot Interface:** A dedicated interface for administrative users to interact with the chatbot.

***

### Tech Stack
The project is composed of three main services:
* **Frontend**: Built with Next.js, React, and Tailwind CSS. It uses Apollo Client for GraphQL operations.
* **Backend**: A Node.js application using Express and Apollo Server. It connects to a PostgreSQL database and uses `bcrypt` for password hashing, `jsonwebtoken` for authentication, and `express-rate-limit` for security.
* **NLP Service**: A Python service built with FastAPI and the spaCy library (`en_core_web_sm` model) for processing chatbot messages.

***

### Prerequisites
To run this project, you need to have the following installed:
* Node.js (v18 or higher)
* Python (v3.12 or higher)
* Local PostgreSQL instance
* npm or yarn

***

### Setup and Installation
Follow these steps to set up and run each part of the project.

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

3.  **NLP Service Setup**
    * Navigate to the `python_nlp` directory:
        ```bash
        cd python_nlp
        ```
    * (Optional but recommended) Create and activate a Python virtual environment:
        ```bash
        python -m venv venv
        # On Windows: venv\Scripts\activate
        # On macOS/Linux: source venv/bin/activate
        ```
    * Install the required Python packages:
        ```bash
        pip install -r requirements.txt
        ```
    * Start the FastAPI server:
        ```bash
        uvicorn main:app --reload
        ```
    The NLP service will be available at `http://127.0.0.1:8000`.

4.  **Frontend Setup**
    * Navigate to the `frontend` directory:
        ```bash
        cd frontend
        ```
    * Install dependencies:
        ```bash
        npm install
        ```
    * Start the Next.js development server:
        ```bash
        npm run dev
        ```
    The frontend will be available at `http://localhost:3000`.

***

### Usage
* Open your browser and navigate to `http://localhost:3000`.
* You can interact with the public chatbot, or you can register a new account to experience the personalized flow.
* When a new user logs in for the first time, the chatbot will guide them through a series of questions to collect their personal information.
* An "AdminUser" account is used for the administrative chatbot functionality.
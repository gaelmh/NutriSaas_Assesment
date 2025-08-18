## NutriSaas: Technical Assessment Frontend

### Description
This frontend application is the user-facing part of the NutriSaas platform. Built with Next.js, it provides an interactive interface for a nutritional chatbot. The application supports multiple user flows, including public access for guests, a personalized experience for logged-in users, and a dedicated interface for an administrative user.

***

### Tech Stack
* **Next.js:** A React framework for building server-rendered and static web applications. It handles routing and provides a performant foundation.
* **React:** A JavaScript library for building user interfaces.
* **Tailwind CSS:** A utility-first CSS framework for rapid and customizable styling.
* **Apollo Client:** A comprehensive GraphQL client for managing data and state in the application, connecting to the backend's GraphQL API.
* **Geist Font Family:** A Vercel-developed font used for a clean and modern aesthetic.

***

### Prerequisites
To run the frontend, you need the following installed:
* Node.js (v18 or higher)
* npm or yarn

***

### Setup and Installation
Follow these steps to set up and run the frontend service:
1.  **Frontend Setup**
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
*Open your browser and navigate to `http://localhost:3000`.
*The homepage provides options to log in, sign up, or proceed as a guest.
* The chatbot's functionality adapts based on the user's authentication status:
    * Public Chatbot: Accessible to guests, providing general information about NutriSaas and its plans.
    * Private Chatbot: For logged-in users, it offers a personalized experience and collects initial user data like sex, age, height, weight, and allergies.
    * Admin Chatbot: A special interface for the `AdminUser` account with unique administrative capabilities.
* All API calls to the backend's GraphQL endpoint are handled by Apollo Client, which is configured in `lib/apollo-client.ts` to include cookies for authentication.
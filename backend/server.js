import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import pool from './db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors'; // Import the cors middleware

const typeDefs = `#graphql
  type User {
    id: ID!
    username: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    hello: String
    testMessage: TestMessage
    me: User
  }

  type Mutation {
    signup(username: String!, password: String!): AuthPayload
    login(username: String!, password: String!): AuthPayload
    chatbot(message: String!): ChatResponse
  }

  type TestMessage {
    id: ID!
    message: String
  }

  type ChatResponse {
    response: String!
  }
`;

const resolvers = {
  Query: {
    hello: () => 'Hello, world!',
    testMessage: async (parent, args, { db }) => {
      const { rows } = await db.query('SELECT * FROM test_table WHERE id = 1');
      return rows[0];
    },
    me: async (parent, args, { db, user }) => {
      // Check if user is authenticated (user object will be populated from context)
      if (!user) {
        throw new Error('Not authenticated');
      }
      // Fetch user from DB if needed, or simply return the user object from context
      const { rows } = await db.query('SELECT id, username FROM users WHERE id = $1', [user.id]);
      return rows[0];
    },
  },

  Mutation: {
    signup: async (parent, { username, password }, { db }) => {
      // 1. Hash the password
      const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

      // 2. Save the user to the database
      const { rows } = await db.query(
        'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
        [username, hashedPassword]
      );
      const user = rows[0];

      // 3. Generate a JWT
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

      return {
        token,
        user,
      };
    },

    login: async (parent, { username, password }, { db }) => {
      // 1. Find the user by username
      const { rows } = await db.query('SELECT id, username, password FROM users WHERE username = $1', [username]);
      const user = rows[0];

      if (!user) {
        throw new Error('User not found');
      }

      // 2. Compare the provided password with the hashed password in the database
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        throw new Error('Invalid password');
      }

      // 3. Generate a JWT
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

      return {
        token,
        user: { id: user.id, username: user.username }, // Return user without password
      };
    },

    chatbot: async (parent, { message }) => {
      try {
        const response = await fetch('http://127.0.0.1:8000/chatbot' , {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message }),
        });
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error calling Python chatbot API:", error);
        throw new Error("Failed to get response from Python chatbot API");
      }
    },
  },
};

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();

  // Enable CORS for all origins (for development)
  app.use(cors()); // Add this line

  app.use('/graphql', express.json(), expressMiddleware(server, {
    context: async ({ req }) => {
      const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : '';
      let user = null;
      if (token) {
        try {
          const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
          user = { id: decodedToken.userId }; // Store just the user ID for context
        } catch (err) {
          // Token is invalid or expired
          console.error('Invalid or expired token:', err.message);
        }
      }
      return {
        db: pool,
        user, // The authenticated user's data
        req,
      };
    },
  }));

  const PORT = process.env.PORT || 4000;
  await new Promise((resolve) => httpServer.listen({ port: PORT }, resolve));

  console.log(`Server ready at http://localhost:${PORT}/graphql`);
}

startServer();
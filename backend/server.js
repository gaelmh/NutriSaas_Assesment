import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import pool from './db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

const typeDefs = `#graphql
  type User {
    id: ID!
    username: String!
    email: String!
    fullname: String!
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
    signup(username: String!, password: String!, email: String!, fullname: String!): AuthPayload
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
      const { rows } = await db.query('SELECT id, username, email, "fullname" FROM users WHERE id = $1', [user.id]);
      return rows[0];
    },
  },

  Mutation: {
    signup: async (parent, { username, password, email, fullname }, { db, res }) => {
      // Basic validation for new fields
      if (!email || !fullname){
        throw new Error('Email and full name required.')
      }

      // Password validation:
        // Minimum 8 characters containing at least
          // One number
          // One letter
          // One special character
      const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
      if (!passwordRegex.test(password)) {
        throw new Error('Password must be at least 8 characters long and must include at least one number, one letter, and one special character')
      }
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

      // Save the user to the database
      const { rows } = await db.query(
        'INSERT INTO users (username, password, email, fullname) VALUES ($1, $2, $3, $4) RETURNING id, username, email, fullname',
        [username, hashedPassword, email, fullname]
      );
      const user = rows[0];

      // Generate a JWT
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

      // Set JWT as httpOnly cookie
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60,
      });

      return {
        token,
        user,
      };
    },

    login: async (parent, { username, password }, { db, res, req }) => {
      // Find the user by username
      const { rows } = await db.query('SELECT id, username, password FROM users WHERE username = $1', [username]);
      const user = rows[0];

      if (!user) {
        throw new Error('User not found');
      }

      // Compare the provided password with the hashed password in the database
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        throw new Error('Invalid password');
      }

      // Generate a JWT
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

      // Set the JWT as an httpOnly cookie
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60,
      });

      return {
        token,
        user: { id: user.id, username: user.username },
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

// Start Server
async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();

  // Configure CORS
  app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
  }));

  // Rate limiting for the login mutation
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Max 5 login attempts per IP per 15 minutes
    message: 'Too many login attempts, please try again later after 15 minutes.',
  });

  // IMPORTANT: Apply express.json() BEFORE the rate limiter if the rate limiter needs to read req.body
  app.use('/graphql', express.json(), (req, res, next) => {
    // Only apply the rate limiter if the request is a `login` mutation
    if (req.body.query && req.body.query.includes('mutation Login')) {
      return loginLimiter(req, res, next);
    }
    return next();
  }, expressMiddleware(server, {
    context: async ({ req, res }) => {
      const token = req.cookies?.authToken;
      let user = null;
      if (token) {
        try {
          const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
          user = { id: decodedToken.userId };
        } catch (err) {
          console.error('Invalid or expired token:', err.message);
        }
      }
      return {
        db: pool,
        user,
        req,
        res,
      };
    },
  }));

  const PORT = process.env.PORT || 4000;
  await new Promise((resolve) => httpServer.listen({ port: PORT }, resolve));

  console.log(`Server ready at http://localhost:${PORT}/graphql`);
}

startServer();
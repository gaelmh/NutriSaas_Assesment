import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import pool, { getUserInfo, saveInitialUserInfo } from './db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import 'dotenv/config';
import cookieParser from 'cookie-parser';

// --- DEBUGGING: Log JWT_SECRET at server start ---
// console.log('Server Start: process.env.JWT_SECRET (from top of file):', process.env.JWT_SECRET);
// --- END DEBUGGING ---

const typeDefs = `#graphql
  type User {
    id: ID!
    username: String!
    email: String!
    fullname: String!
  }

  type UserInfo {
    initialInfoCollected: Boolean!
    height_cm: Int
    weight_kg: Int
    allergies: [String]
    sex: String # Added sex field
    age: Int # Added age field
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    hello: String
    testMessage: TestMessage
    me: User
    userInfo(userId: String!): UserInfo
  }

  type Mutation {
    signup(username: String!, password: String!, email: String!, fullname: String!): AuthPayload
    login(username: String!, password: String!): AuthPayload
    logout: String! # Added logout mutation
    chatbot(message: String!): ChatResponse
    requestPasswordReset(email: String!): String!
    resetPassword(token: String!, newPassword: String!): String!
    saveInitialInfo(
      userId: String!,
      username: String!,
      height_cm: Int,
      weight_kg: Int,
      allergies: [String!],
      sex: String, # Added sex to mutation input
      age: Int # Added age to mutation input
    ): UserInfo!
    updateUserInfo(
      userId: String!,
      height_cm: Int,
      weight_kg: Int,
      allergies: [String!],
      sex: String, # Added sex to mutation input
      age: Int # Added age to mutation input
    ): UserInfo!
    adminChatbot(message: String!): ChatResponse # New admin chatbot mutation
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
      if (!user) {
        throw new Error('Not authenticated');
      }
      const { rows } = await db.query('SELECT id, username, email, "fullname" FROM users WHERE id = $1', [user.id]);
      return rows[0];
    },
    userInfo: async (parent, { userId }, { user }) => {
      if (!user || String(user.id) !== userId) {
        throw new Error('Unauthorized access to user information.');
      }
      try {
        const info = await getUserInfo(userId);
        return info || { initialInfoCollected: false, height_cm: null, weight_kg: null, allergies: [], sex: null, age: null }; // Added sex and age default
      } catch (error) {
        console.error('Resolver Error in userInfo:', error.message, error.stack);
        throw new Error('Failed to retrieve user information.');
      }
    },
  },

  Mutation: {
    signup: async (parent, { username, password, email, fullname }, { db, res }) => {
      if (!email || !fullname){
        throw new Error('Email and full name required.')
      }

      const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
      if (!passwordRegex.test(password)) {
        throw new Error('Password must be at least 8 characters long and must include at least one number, one letter, and one special character')
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);

      const { rows } = await db.query(
        'INSERT INTO users (username, password, email, fullname) VALUES ($1, $2, $3, $4) RETURNING id, username, email, fullname',
        [username, hashedPassword, email, fullname]
      );
      const user = rows[0];

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 7,
      });

      return {
        token,
        user,
      };
    },

    login: async (parent, { username, password }, { db, res, req }) => {
      const { rows } = await db.query('SELECT id, username, password FROM users WHERE username = $1', [username]);
      const user = rows[0];

      if (!user) {
        throw new Error('User not found');
      }

      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        throw new Error('Invalid password');
      }

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 7,
      });

      return {
        token,
        user: { id: user.id, username: user.username },
      };
    },

    // New logout mutation to clear the httpOnly cookie from the server
    logout: async (parent, args, { res }) => {
      res.clearCookie('authToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });
      return 'Logged out successfully.';
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

    // New resolver for admin chatbot
    adminChatbot: async (parent, { message }, { user, db }) => {
      if (!user) {
        throw new Error('Not authenticated.');
      }
      const { rows } = await db.query('SELECT username FROM users WHERE id = $1', [user.id]);
      const loggedInUser = rows[0];
      if (loggedInUser.username !== 'AdminUser') {
        throw new Error('Unauthorized access.');
      }

      // Placeholder for future NLP logic
      const response = await fetch('http://127.0.0.1:8000/chatbot' , {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();
      return data;
    },

    requestPasswordReset: async (parent, { email }, { db }) => {
      const { rows } = await db.query('SELECT id FROM users WHERE email = $1', [email]);
      const user = rows[0];

      if (!user) {
        return 'If an account with that email exists, a password reset link has been sent.';
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 3600000);

      await db.query(
        'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3',
        [resetToken, resetExpires, user.id]
      );

      const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
      console.log(`Password Reset Link for ${email}: ${resetLink}`);

      return 'If an account with that email exists, a password reset link has been sent.';
    },

    resetPassword: async (parent, { token, newPassword }, { db }) => {
      const { rows } = await db.query(
        'SELECT id FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()',
        [token]
      );
      const user = rows[0];

      if (!user) {
        throw new Error('Invalid or expired password reset token.');
      }

      const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
      if (!passwordRegex.test(newPassword)) {
        throw new Error('New password must be at least 8 characters long and must include at least one number, one letter, and one special character.');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await db.query(
        'UPDATE users SET password = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2',
        [hashedPassword, user.id]
      );

      return 'Password has been successfully reset.';
    },

    saveInitialInfo: async (parent, { userId, username, height_cm, weight_kg, allergies, sex, age }, { user }) => {
      if (!user || String(user.id) !== userId) {
        throw new Error('Unauthorized attempt to save user information.');
      }
      try {
        const savedInfo = await saveInitialUserInfo(userId, username, height_cm, weight_kg, allergies, sex, age);
        return savedInfo;
      } catch (error) {
        console.error('Resolver Error in saveInitialInfo:', error.message, error.stack);
        throw new Error('Failed to save user information.');
      }
    },

    updateUserInfo: async (parent, { userId, height_cm, weight_kg, allergies, sex, age }, { user }) => {
      if (!user || String(user.id) !== userId) {
        throw new Error('Unauthorized attempt to update user information.');
      }
      try {
        const updatedInfo = await saveInitialUserInfo(userId, user.username, height_cm, weight_kg, allergies, sex, age);
        return updatedInfo;
      } catch (error) {
        console.error('Resolver Error in updateUserInfo:', error.message, error.stack);
        throw new Error('Failed to update user information.');
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

  app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
  }));

  app.use(cookieParser());

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many login attempts, please try again later after 15 minutes.',
  });

  app.use('/graphql', express.json(), (req, res, next) => {
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
          console.error('Context: JWT verification failed:', err.message);
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
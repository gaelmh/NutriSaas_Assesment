// Import necessary modules for the Apollo Server and Express
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';

// Import local database functions and other utilities
import pool, { getUserInfo, saveInitialUserInfo } from './db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import 'dotenv/config';
import cookieParser from 'cookie-parser';

// Enhanced NLP service integration function
async function callNLPService(message, userId = null, isAdmin = false) {
  try {
    const response = await fetch('http://127.0.0.1:8000/chatbot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message,
        userId,
        isAdmin 
      }),
    });

    if (!response.ok) {
      throw new Error(`NLP Service responded with status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error calling Python NLP service:", error);
    
    // Fallback response if NLP service is down
    return {
      response: "Lo siento, el servicio de chat no está disponible en este momento. Por favor, inténtalo más tarde.",
      intent: "fallback",
      confidence: 0.0
    };
  }
}

// Helper function for admin height queries
async function handleAdminHeightQuery(db) {
  try {
    const { rows } = await db.query(`
      SELECT 
        height_cm,
        COUNT(*) as user_count,
        ROUND(AVG(weight_kg), 1) as avg_weight
      FROM user_information 
      WHERE height_cm IS NOT NULL 
      GROUP BY height_cm 
      ORDER BY height_cm
    `);

    if (rows.length === 0) {
      return {
        response: "📊 No hay datos de altura registrados aún.",
        intent: "admin_query",
        confidence: 1.0
      };
    }

    let report = "📊 **Reporte de Alturas Registradas:**\n\n";
    let totalUsers = 0;
    
    rows.forEach(row => {
      report += `${row.height_cm}cm: ${row.user_count} usuario(s) | Peso promedio: ${row.avg_weight}kg\n`;
      totalUsers += parseInt(row.user_count);
    });
    
    report += `\n**Total de usuarios con datos:** ${totalUsers}`;
    
    const avgHeight = rows.reduce((sum, row) => sum + (row.height_cm * row.user_count), 0) / totalUsers;
    report += `\n**Altura promedio:** ${Math.round(avgHeight)}cm`;

    return {
      response: report,
      intent: "admin_query",
      confidence: 1.0
    };
  } catch (error) {
    console.error('Error generating height report:', error);
    return {
      response: "❌ Error al generar el reporte de alturas.",
      intent: "admin_query",
      confidence: 1.0
    };
  }
}

// Define the GraphQL schema using the GraphQL Schema Definition Language
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
    sex: String
    age: Int
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
    logout: String!
    chatbot(message: String!): ChatResponse
    requestPasswordReset(email: String!): String!
    resetPassword(token: String!, newPassword: String!): String!
    saveInitialInfo(
      userId: String!,
      username: String!,
      height_cm: Int,
      weight_kg: Int,
      allergies: [String!],
      sex: String,
      age: Int
    ): UserInfo!
    updateUserInfo(
      userId: String!,
      height_cm: Int,
      weight_kg: Int,
      allergies: [String!],
      sex: String,
      age: Int
    ): UserInfo!
    adminChatbot(message: String!): ChatResponse
}

type TestMessage {
    id: ID!
    message: String
}

type ChatResponse {
    response: String!
    intent: String
    confidence: Float
}
`;

// Define resolvers that match the schema, providing logic for each field
const resolvers = {
  Query: {
    // Query to test server's health (can be removed)
    hello: () => 'Hello, world!',
    testMessage: async (parent, args, { db }) => {
      const { rows } = await db.query('SELECT * FROM test_table WHERE id = 1');
      return rows[0];
    },

    // Resolver to get the current authenticated user's information
    me: async (parent, args, { db, user }) => {
      if (!user) {
        throw new Error('Not authenticated');
      }
      const { rows } = await db.query('SELECT id, username, email, "fullname" FROM users WHERE id = $1', [user.id]);
      return rows[0];
    },

    // Resolver to get detailed user info, with authorization check
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
    // Resolver for user signup
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

      // Create a JWT token and set it as an httpOnly cookie
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

    // Resolver for user login
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

      // Create and set a new token upon successful login
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

    // Resolver for user logout, clearing the cookie
    logout: async (parent, args, { res }) => {
      res.clearCookie('authToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });
      return 'Logged out successfully.';
    },

    // Enhanced public chatbot resolver with NLP integration
    chatbot: async (parent, { message }, { user, db }) => {
      try {
        const userId = user ? user.id : null;
        const nlpResponse = await callNLPService(message, userId, false);
        
        // Store the interaction in the database if user is logged in
        if (user && db) {
          try {
            await db.query(
              'INSERT INTO chatbot_data (user_id, question, answer) VALUES ($1, $2, $3)',
              [user.id, message, nlpResponse.response]
            );
          } catch (dbError) {
            console.error('Error storing chatbot interaction:', dbError);
            // Don't throw error, just log it - user doesn't need to know about storage issues
          }
        }

        return {
          response: nlpResponse.response,
          intent: nlpResponse.intent || null,
          confidence: nlpResponse.confidence || 0.0
        };
      } catch (error) {
        console.error("Chatbot resolver error:", error);
        throw new Error("Failed to process your message. Please try again.");
      }
    },

    // Enhanced admin chatbot resolver with special admin functionality
    adminChatbot: async (parent, { message }, { user, db }) => {
      if (!user) {
        throw new Error('Not authenticated.');
      }

      // Check if user is admin
      const { rows } = await db.query('SELECT username FROM users WHERE id = $1', [user.id]);
      const loggedInUser = rows[0];
      if (loggedInUser.username !== 'AdminUser') {
        throw new Error('Unauthorized access.');
      }

      try {
        // Handle special admin queries
        if (message.toLowerCase().includes('altura') || message.toLowerCase().includes('height') || message.toLowerCase().includes('usuarios por altura')) {
          const adminResponse = await handleAdminHeightQuery(db);
          
          // Store admin interaction
          await db.query(
            'INSERT INTO chatbot_data (user_id, question, answer) VALUES ($1, $2, $3)',
            [user.id, `[ADMIN] ${message}`, adminResponse.response]
          );
          
          return {
            response: adminResponse.response,
            intent: adminResponse.intent,
            confidence: adminResponse.confidence
          };
        }

        // For regular chat, use NLP service with admin flag
        const nlpResponse = await callNLPService(message, user.id, true);
        
        // Store admin interactions
        await db.query(
          'INSERT INTO chatbot_data (user_id, question, answer) VALUES ($1, $2, $3)',
          [user.id, `[ADMIN] ${message}`, nlpResponse.response]
        );

        return {
          response: nlpResponse.response,
          intent: nlpResponse.intent || null,
          confidence: nlpResponse.confidence || 0.0
        };
      } catch (error) {
        console.error("Admin chatbot resolver error:", error);
        throw new Error("Failed to process admin request.");
      }
    },

    // Resolver to handle a password reset request
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

    // Resolver to reset a password using a token
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

    // Resolver to save a new user's initial information
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

    // Resolver to update an existing user's information
    updateUserInfo: async (parent, { userId, height_cm, weight_kg, allergies, sex, age }, { user }) => {
      if (!user || String(user.id) !== userId) {
        throw new Error('Unauthorized attempt to update user information.');
      }
      try {
        // This function reuses the saveInitialUserInfo logic for updates
        const updatedInfo = await saveInitialUserInfo(userId, user.username, height_cm, weight_kg, allergies, sex, age);
        return updatedInfo;
      } catch (error) {
        console.error('Resolver Error in updateUserInfo:', error.message, error.stack);
        throw new Error('Failed to update user information.');
      }
    },
  },
};

// Main function to start the server
async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();

  // Middleware setup
  app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
  }));

  app.use(cookieParser());

  // Rate limiting for login attempts
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many login attempts, please try again later after 15 minutes.',
  });

  // Apply Express middleware for Apollo Server
  app.use('/graphql', express.json(), (req, res, next) => {
    // Apply rate limit only to the login mutation
    if (req.body.query && req.body.query.includes('mutation Login')) {
      return loginLimiter(req, res, next);
    }
    return next();
  }, expressMiddleware(server, {
    // Context function to handle authentication and provide database access
    context: async ({ req, res }) => {
      const token = req.cookies?.authToken;
      let user = null;
      if (token) {
        try {
          // Verify the JWT token
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

  console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
  console.log(`🤖 NLP Chatbot service expected at http://127.0.0.1:8000`);
}

startServer();
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import pool from './db.js'; // Import the connection pool

const typeDefs = `#graphql
  type TestMessage {
    id: ID!
    message: String
  }

  type Query {
    hello: String
    testMessage: TestMessage
  }
`;

const resolvers = {
  Query: {
    hello: () => 'Hello, world!',
    testMessage: async (parent, args, { db }) => {
      const { rows } = await db.query('SELECT * FROM test_table WHERE id = 1');
      return rows[0];
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

  app.use('/graphql', express.json(), expressMiddleware(server, {
    context: async ({ req }) => ({
      db: pool,
    }),
  }));

  const PORT = process.env.PORT || 4000;
  await new Promise((resolve) => httpServer.listen({ port: PORT }, resolve));

  console.log(`Server ready at http://localhost:${PORT}/graphql`);
}

startServer();
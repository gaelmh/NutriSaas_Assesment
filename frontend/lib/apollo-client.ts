// Import necessary modules from the Apollo Client library
import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { onError } from '@apollo/client/link/error';

// Create an HTTP link to connect Apollo Client to the GraphQL server
const httpLink = createHttpLink({
  uri: 'http://localhost:4000/graphql', // Specifies the endpoint
  credentials: 'include', // Ensures that cookies (like the authentication token) are sent with every request
});

// Create an error link to handle and log GraphQL and network errors
const errorLink = onError(({ graphQLErrors, networkError }) => {
  // Log any GraphQL-specific errors, which often contain details about syntax or validation issues
  if (graphQLErrors)
    graphQLErrors.forEach(({ message, locations, path }) =>
      console.log(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
      ),
    );

  // Log network errors, which relate to connection issues or HTTP status codes
  if (networkError) {
    console.log(`[Network error]: ${networkError}`);
    if ('statusCode' in networkError && networkError.statusCode === 429) {
      throw new Error("Too many login attempts, please try again later after 15 minutes.");
    }
  }
});

// Initialize the Apollo Client instance
const client = new ApolloClient({
  link: from([errorLink, httpLink]),
  cache: new InMemoryCache(),
});

// Export the configured client for use throughout the application
export default client;
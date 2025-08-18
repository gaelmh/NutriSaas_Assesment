// Client-side component, necessary for handling private chatbot interactions
'use client';

// Import React hooks for state management and side effects
import { useState } from 'react';

// Import Apollo Client modules for executing GraphQL mutations
import { gql, useMutation } from '@apollo/client';

// Import Next.js's `Link` component for client-side navigation
import Link from 'next/link';
import { useRouter } from 'next/navigation'; 

// Define the GraphQL login mutation
const LOGIN_MUTATION = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      token
      user {
        id
        username
      }
    }
  }
`;

// The main component for the Login page
export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState(''); // State to manage form input values
  const [password, setPassword] = useState(''); // State to manage form input values
  const [displayMessage, setDisplayMessage] = useState<string | null>(null); // State to manage the message displayed to the user
  const [isError, setIsError] = useState(false); // State to track if the message is an error

  // Hook to execute the login mutation
  const [loginUser, { loading }] = useMutation(LOGIN_MUTATION, {
    onCompleted: (result) => {
      if (result.login.token) {
        setDisplayMessage('Login successful! Redirecting to chatbot...');
        setIsError(false);
        router.push('/chatbot');
      } else {
        setDisplayMessage('Login failed: Unexpected response from server.');
        setIsError(true);
      }
    },
    onError: (err) => {
      console.error('Login failed in on Error callback:', err.message);
      setDisplayMessage(`Error: ${err.message}`);
      setIsError(true); // Mark as an error message
    },
  });

  // Function to handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setDisplayMessage('Logging in...');
    setIsError(false);

    await loginUser({
      variables: { username, password },
    });
  };

  // Login Page Design
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Login</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Usuario
            </label>
            <input
              type="text"
              id="username"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Display messages based on the new displayMessage state */}
        {displayMessage && (
          <p className={`mt-4 text-center ${isError ? 'text-red-600' : 'text-gray-600'}`}>
            {displayMessage}
          </p>
        )}

        <p className="mt-6 text-center text-gray-600">
          ¿No tiene una cuenta?&apos;{' '}
          <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
            Registrarme
          </Link>
        </p>
        
        {/* Link to the forgot password page. */}
        <p className="mt-2 text-center text-gray-600">
          <Link href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
            ¿Olvidó su contraseña?
          </Link>
        </p>
      </div>
    </div>
  );
}

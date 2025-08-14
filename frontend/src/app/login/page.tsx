'use client'; // This directive is necessary for client-side interactivity in Next.js App Router

import { useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import Link from 'next/link'; // For navigation

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

export default function LoginPage() {
  // State to manage form input values
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // useMutation hook to execute the login mutation
  // 'data' will contain the response, 'loading' indicates if the mutation is in progress,
  // 'error' will contain any errors, and 'loginUser' is the function to call the mutation.
  const [loginUser, { data, loading, error }] = useMutation(LOGIN_MUTATION);

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); // Prevent default form submission behavior

    try {
      // Call the login mutation with the current username and password
      const response = await loginUser({
        variables: { username, password },
      });

      // Log the response data (e.g., token and user info)
      console.log('Login successful:', response.data?.login);

      // TODO: In a real application, you would save the token to localStorage
      // or a secure cookie and redirect the user to a protected page.
      if (response.data?.login.token) {
        alert('Login successful! Token received. Check console for details.');
        // Example: Redirect to dashboard or home page
        // window.location.href = '/dashboard';
      }
    } catch (err: any) {
      // Display a user-friendly error message
      alert(`Login failed: ${err.message}`);
      console.error('Login error:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Login</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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

        {/* Display loading, error, or success messages */}
        {error && (
          <p className="mt-4 text-center text-red-600">Error: {error.message}</p>
        )}
        {data && data.login.token && (
          <p className="mt-4 text-center text-green-600">Logged in successfully!</p>
        )}

        <p className="mt-6 text-center text-gray-600">
          Don't have an account?{' '}
          <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
    
'use client'; // This directive is necessary for client-side interactivity

import { useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import Link from 'next/link'; // For navigation
import { useRouter } from 'next/navigation'; // Import useRouter

// Define the GraphQL signup mutation
const SIGNUP_MUTATION = gql`
  mutation Signup($username: String!, $password: String!) {
    signup(username: $username, password: $password) {
      token
      user {
        id
        username
      }
    }
  }
`;

export default function SignupPage() {
  const router = useRouter(); // Initialize useRouter
  // State to manage form input values
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // useMutation hook to execute the signup mutation
  const [signupUser, { data, loading, error }] = useMutation(SIGNUP_MUTATION);

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); // Prevent default form submission behavior

    try {
      // Call the signup mutation with the current username and password
      const response = await signupUser({
        variables: { username, password },
      });

      // Log the response data (e.g., token and user info)
      console.log('Signup successful:', response.data?.signup);

      // Save the token (e.g., to localStorage) and redirect
      if (response.data?.signup.token) {
        // In a real app, use a more secure method like httpOnly cookies
        localStorage.setItem('authToken', response.data.signup.token);
        alert('Signup successful! Redirecting to chatbot...'); // Use alert for now
        router.push('/chatbot'); // Redirect to the chatbot page
      }
    } catch (err: any) {
      // Display a user-friendly error message
      alert(`Signup failed: ${err.message}`);
      console.error('Signup error:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Sign Up</h2>
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
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>

        {/* Display loading, error, or success messages */}
        {error && (
          <p className="mt-4 text-center text-red-600">Error: {error.message}</p>
        )}
        {data && data.signup.token && (
          <p className="mt-4 text-center text-green-600">Account created successfully!</p>
        )}

        <p className="mt-6 text-center text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
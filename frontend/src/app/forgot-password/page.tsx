'use client';

import { useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import Link from 'next/link';

// Define the GraphQL mutation for requesting a password reset
const REQUEST_PASSWORD_RESET_MUTATION = gql`
  mutation RequestPasswordReset($email: String!) {
    requestPasswordReset(email: $email)
  }
`;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [displayMessage, setDisplayMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  // useMutation hook to execute the requestPasswordReset mutation
  const [requestReset, { loading }] = useMutation(REQUEST_PASSWORD_RESET_MUTATION, {
    onCompleted: (data) => {
      setDisplayMessage(data.requestPasswordReset); // Display the message returned by the server
      setIsError(false);
    },
    onError: (err) => {
      console.error('Request password reset error:', err.message);
      setDisplayMessage(`Error: ${err.message}`);
      setIsError(true);
    },
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setDisplayMessage('Sending reset link...');
    setIsError(false);
    await requestReset({ variables: { email } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Forgot Password</h2>
        <p className="text-center text-gray-600 mb-6">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        {displayMessage && (
          <p className={`mt-4 text-center ${isError ? 'text-red-600' : 'text-gray-600'}`}>
            {displayMessage}
          </p>
        )}

        <p className="mt-6 text-center text-gray-600">
          Remembered your password?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

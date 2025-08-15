'use client';

import { useState, useEffect } from 'react';
import { gql, useMutation } from '@apollo/client';
import { useRouter, useSearchParams } from 'next/navigation'; // Import useSearchParams for URL parameters
import Link from 'next/link';

// Define the GraphQL mutation for resetting the password
const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword($token: String!, $newPassword: String!) {
    resetPassword(token: $token, newPassword: $newPassword)
  }
`;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [displayMessage, setDisplayMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  // Extract the token from the URL query parameters on component mount
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setResetToken(token);
    } else {
      setDisplayMessage('Error: Password reset token is missing from the URL.');
      setIsError(true);
    }
  }, [searchParams]);

  // useMutation hook for resetting the password
  const [resetPasswordMutation, { loading }] = useMutation(RESET_PASSWORD_MUTATION, {
    onCompleted: (data) => {
      setDisplayMessage(data.resetPassword); // Display the message returned by the server
      setIsError(false);
      // Optional: Redirect to login page after a short delay on success
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    },
    onError: (err) => {
      console.error('Reset password error:', err.message);
      setDisplayMessage(`Error: ${err.message}`);
      setIsError(true);
    },
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!resetToken) {
      setDisplayMessage('Cannot reset password: Token is missing.');
      setIsError(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setDisplayMessage('Error: Passwords do not match.');
      setIsError(true);
      return;
    }

    // Client-side password validation (matching server-side regex for consistency)
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setDisplayMessage('Error: Password must be at least 8 characters long and include at least one number, one letter, and one special character.');
      setIsError(true);
      return;
    }

    setDisplayMessage('Resetting password...');
    setIsError(false);
    await resetPasswordMutation({
      variables: {
        token: resetToken,
        newPassword: newPassword,
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Reset Password</h2>

        {!resetToken && displayMessage ? (
          <p className={`mt-4 text-center ${isError ? 'text-red-600' : 'text-gray-600'}`}>
            {displayMessage}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        {displayMessage && resetToken && ( // Only show message if token exists (form is visible)
          <p className={`mt-4 text-center ${isError ? 'text-red-600' : 'text-gray-600'}`}>
            {displayMessage}
          </p>
        )}

        <p className="mt-6 text-center text-gray-600">
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}

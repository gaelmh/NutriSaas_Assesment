// Client-side component, necessary for handling private chatbot interactions
'use client';

// Import React hooks for state management and side effects
import { useState, useEffect } from 'react';

// Import Apollo Client modules for executing GraphQL mutations
import { gql, useMutation } from '@apollo/client';

// Import Next.js's `Link` component for client-side navigation
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

// Define the GraphQL mutation for resetting the password
const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword($token: String!, $newPassword: String!) {
    resetPassword(token: $token, newPassword: $newPassword)
  }
`;

// The main component for the Reset Password page
export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams(); // State for the new password input field
  const [newPassword, setNewPassword] = useState(''); // State for the confirm password input field
  const [confirmPassword, setConfirmPassword] = useState(''); // State to store the reset token from the URL
  const [resetToken, setResetToken] = useState<string | null>(null); // State for displaying messages to the user
  const [displayMessage, setDisplayMessage] = useState<string | null>(null); // State to track if the displayed message is an error
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

  // Hook for executing the password reset
  const [resetPasswordMutation, { loading }] = useMutation(RESET_PASSWORD_MUTATION, {
    onCompleted: (data) => {
      setDisplayMessage(data.resetPassword); 
      setIsError(false);
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

  // Function to handle the form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Perform client-side validation
    if (!resetToken) {
      setDisplayMessage('Cannot reset password: Token is missing.');
      setIsError(true);
      return;
    }

    // Client-side password validation using a regex
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
        
        {/* Conditionally render the form or an error message if the token is missing. */}
        {!resetToken && displayMessage ? (
          <p className={`mt-4 text-center ${isError ? 'text-red-600' : 'text-gray-600'}`}>
            {displayMessage}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Nueva Contraseña
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
                Confirmar Nueva Contraseña
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

        {/* Display messages only if a token is present, to avoid showing duplicate messages initially. */}
        {displayMessage && resetToken && (
          <p className={`mt-4 text-center ${isError ? 'text-red-600' : 'text-gray-600'}`}>
            {displayMessage}
          </p>
        )}

        <p className="mt-6 text-center text-gray-600">
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Regresar a Inicio de Sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

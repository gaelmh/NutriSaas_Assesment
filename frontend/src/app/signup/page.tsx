// Client-side component, necessary for handling private chatbot interactions
'use client';

// Import React hooks for state management and side effects
import { useState } from 'react';

// Import Apollo Client modules for executing GraphQL mutations
import { gql, useMutation } from '@apollo/client';

// Import Next.js's `Link` component for client-side navigation
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Define the GraphQL signup mutation
const SIGNUP_MUTATION = gql`
  mutation Signup($username: String!, $password: String!, $email: String!, $fullname: String!) {
    signup(username: $username, password: $password, email: $email, fullname: $fullname) {
      token
      user {
        id
        username
        email
        fullname
      }
    }
  }
`;

// The main component for the Signup page
export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState(''); // State to manage form input values
  const [password, setPassword] = useState(''); // State to manage form input values
  const [email, setEmail] = useState('');       // State to manage form input values
  const [fullname, setfullname] = useState(''); // State to manage form input values

  // Hook to execute the signup mutation
  const [signupUser, { data, loading, error }] = useMutation(SIGNUP_MUTATION);

  // Function to handle the form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {      
      await signupUser({
        variables: { username, password, email, fullname },
      });
      alert('Signup successful! Redirecting to chatbot...');
      router.push('/chatbot');
    } catch (err: unknown) {
    if (err instanceof Error) {
        alert(`Signup failed: ${err.message}`);
        console.error('Signup error:', err);
    } else {
        alert('An unknown error occurred during signup.');
        console.error('Signup error:', err);
      }
    }
  };

  // Sign Up Page Design
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Registrarme</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullname" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre Completo
            </label>
            <input
              type="text"
              id="fullname"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
              value={fullname}
              onChange={(e) => setfullname(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              id="email"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de Usuario
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
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Registrando...' : 'Registrarme'}
          </button>
        </form>

        {/* Conditionally display messages based on the mutation state. */}
        {error && (
          <p className="mt-4 text-center text-red-600">Error: {error.message}</p>
        )}
        {data && data.signup.token && (
          <p className="mt-4 text-center text-green-600">Cuenta creada con éxito!</p>
        )}

        <p className="mt-6 text-center text-gray-600">
          ¿Ya tiene una cuenta?&apos;{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Iniciar Sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
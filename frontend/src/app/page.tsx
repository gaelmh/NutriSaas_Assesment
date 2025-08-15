'use client';

import { useState, useEffect } from 'react'; // Keep useState and useEffect for consistency if needed elsewhere
import { useRouter } from 'next/navigation'; // Import useRouter
import Link from 'next/link';
import { gql, useQuery } from '@apollo/client'; // Keep Apollo imports for backend connection check

// Define the GraphQL query to test backend connection
const GET_HELLO_MESSAGE = gql`
  query GetHelloMessage {
    hello
  }
`;

export default function HomePage() {
  const router = useRouter(); // Initialize useRouter hook
  const { loading, error, data } = useQuery(GET_HELLO_MESSAGE); // Use Apollo hook to check backend connection

  // Function to handle "Continuar como Invitado" click
  const handleContinueAsGuest = () => {
    // Explicitly redirect to the public chatbot page
    router.push('/chatbot');
  };

  if (loading) return <p className="text-center text-lg text-gray-700">Cargando...</p>;
  if (error) return <p className="text-center text-lg text-red-600">Error: {error.message}</p>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <h1 className="text-5xl font-extrabold text-gray-900 mb-8">¡Bienvenido a NutriSaas!</h1>
      <p className="text-xl text-gray-700 mb-12 text-center max-w-2xl">
        Tu asistente de nutrición personalizado.
      </p>

      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6 mb-8">
        <Link href="/login" passHref className="py-3 px-8 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition duration-300 ease-in-out text-xl font-semibold text-center">
          Iniciar Sesión
        </Link>
        <Link href="/signup" passHref className="py-3 px-8 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition duration-300 ease-in-out text-xl font-semibold text-center">
          Registrarme
        </Link>
        {/* Modified: Changed Link to a button with onClick handler */}
        <button
          onClick={handleContinueAsGuest} // Use the new handler for redirection
          className="py-3 px-8 bg-gray-600 text-white rounded-lg shadow-md hover:bg-gray-700 transition duration-300 ease-in-out text-xl font-semibold text-center"
        >
          Continuar como Invitado
        </button>
      </div>
    </div>
  );
}

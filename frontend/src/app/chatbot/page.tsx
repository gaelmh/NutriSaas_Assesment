'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { gql, useQuery } from '@apollo/client';
import { useRouter } from 'next/navigation'; // Import useRouter
import PublicChatbotPage from './public/page';
import PrivateChatbotPage from './private/page';

// Define the GraphQL query to get the current authenticated user's information
const GET_ME_QUERY = gql`
  query Me {
    me {
      id
      username
      email
      fullname
    }
  }
`;

export default function ChatbotPage() {
  const router = useRouter(); // Initialize useRouter hook
  const [user, setUser] = useState<{ id: string; username: string; email: string; fullname: string } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const { loading: meQueryLoading, error: meQueryError, data: meQueryData, refetch: refetchMe } = useQuery(GET_ME_QUERY, {
    fetchPolicy: 'network-only',
    onError: (error) => {
      console.error("Error fetching 'me' data, likely unauthenticated:", error.message);
      setUser(null);
      setIsAuthenticated(false);
    },
  });

  // Effect to update authentication state based on 'me' query result
  useEffect(() => {
    if (!meQueryLoading) {
      if (meQueryData && meQueryData.me) {
        setUser(meQueryData.me);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    }
  }, [meQueryLoading, meQueryData]);

  // Function to handle logout
  const handleLogout = () => {
    // Clear the authentication cookie by setting its expiration to the past
    document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    
    // Immediately update local state to reflect the logged-out status
    setUser(null);
    setIsAuthenticated(false);

    // Redirect to the main chatbot page. This will cause the component to re-evaluate
    // its authentication status, and since the cookie is cleared, it will render
    // the PublicChatbotPage.
    router.push('/chatbot');
  };

  // Show a loading state while authentication status is being determined
  if (meQueryLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="text-gray-600 text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl flex flex-col h-[80vh] relative">
        {/* Top right corner: Login/Signup or Username/Logout */}
        <div className="absolute top-4 right-4">
          {isAuthenticated && user ? (
            <div className="flex items-center space-x-2">
              <span className="text-gray-700 font-semibold text-base">Hola, {user.username}</span>
              <button
                onClick={handleLogout}
                className="py-2 px-4 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition duration-300 ease-in-out text-sm font-semibold"
              >
                Cerrar Sesión
              </button>
            </div>
          ) : (
            <Link href="/login" passHref className="py-2 px-4 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition duration-300 ease-in-out text-sm font-semibold">
              Iniciar Sesión / Registrarme
            </Link>
          )}
        </div>

        {/* Main Chatbot Title */}
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-4 mt-12">NutriSaas Chatbot</h2>

        {/* Conditional rendering of chatbot types */}
        {isAuthenticated && user ? (
          <PrivateChatbotPage userId={user.id} username={user.username} />
        ) : (
          <PublicChatbotPage />
        )}
      </div>
    </div>
  );
}

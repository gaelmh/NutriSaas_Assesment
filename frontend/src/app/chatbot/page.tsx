'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { gql, useQuery, useMutation } from '@apollo/client';
import { useRouter } from 'next/navigation';
import PublicChatbotPage from './public/page';
import PrivateChatbotPage from './private/page';
import AdminChatbotPage from './admin/page'; // Import the new admin page

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

// Define the new GraphQL mutation for logging out
const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

export default function ChatbotPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; username: string; email: string; fullname: string } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // New state to check if user is admin

  const { loading: meQueryLoading, error: meQueryError, data: meQueryData, refetch: refetchMe } = useQuery(GET_ME_QUERY, {
    fetchPolicy: 'network-only',
    onError: (error) => {
      console.error("Error fetching 'me' data, likely unauthenticated:", error.message);
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
    },
  });

  const [logoutUser] = useMutation(LOGOUT_MUTATION, {
    onCompleted: () => {
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
      router.push('/chatbot');
    },
    onError: (error) => {
      console.error("Error during logout:", error.message);
    }
  });

  useEffect(() => {
    if (!meQueryLoading) {
      if (meQueryData && meQueryData.me) {
        setUser(meQueryData.me);
        setIsAuthenticated(true);
        // Check if the user is the admin
        if (meQueryData.me.username === 'AdminUser') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
    }
  }, [meQueryLoading, meQueryData]);

  const handleLogout = async () => {
    await logoutUser();
  };

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

        <h2 className="text-3xl font-bold text-center text-gray-800 mb-4 mt-12">NutriSaas Chatbot</h2>

        {isAdmin ? (
          <AdminChatbotPage />
        ) : isAuthenticated && user ? (
          <PrivateChatbotPage userId={user.id} username={user.username} />
        ) : (
          <PublicChatbotPage />
        )}
      </div>
    </div>
  );
}
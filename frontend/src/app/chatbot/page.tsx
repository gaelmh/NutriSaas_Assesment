// Client-side component, necessary for handling private chatbot interactions
'use client';


// Import React hooks for state management and side effects
import { useState, useEffect } from 'react';

// Import Apollo Client modules for executing GraphQL mutations
import { gql, useQuery, useMutation } from '@apollo/client';

// Import Next.js's `Link` component for client-side navigation
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Import child components for different user types
import PublicChatbotPage from './public/page';
import PrivateChatbotPage from './private/page';
import AdminChatbotPage from './admin/page'; 

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

// Main component for the Chatbot Page
export default function ChatbotPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; username: string; email: string; fullname: string } | null>(null); // State to hold the user object if they are authenticated
  const [isAuthenticated, setIsAuthenticated] = useState(false); // State to track if a user is authenticated
  const [isAdmin, setIsAdmin] = useState(false); // State to track if the authenticated user is an admin

  // Hook to fetch the current user's information
  const { loading: meQueryLoading, error: meQueryError, data: meQueryData, refetch: refetchMe } = useQuery(GET_ME_QUERY, {
    fetchPolicy: 'network-only',
    onError: (error) => {
      console.error("Error fetching 'me' data, likely unauthenticated:", error.message);
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
    },
  });

  // Hook to handle the logout logic
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

  // Process the query result and update local state
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

  // Handler function for the logout button
  const handleLogout = async () => {
    await logoutUser();
  };

  // Display a loading message while fetching user information
  if (meQueryLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="text-gray-600 text-xl">Cargando...</div>
      </div>
    );
  }

  // Chatbot page desgn
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl flex flex-col min-h-[80vh] overflow-hidden relative">
        {/* Header section with login/logout buttons */}
        <div className="absolute top-4 right-4">
          {isAuthenticated && user ? (
            // Display user greeting and logout button if authenticated
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
            // Display login/signup link if not authenticated
            <Link href="/login" passHref className="py-2 px-4 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition duration-300 ease-in-out text-sm font-semibold">
              Iniciar Sesión / Registrarme
            </Link>
          )}
        </div>

        <h2 className="text-3xl font-bold text-center text-gray-800 mb-4 mt-12">NutriSaas Chatbot</h2>

        {/* Conditional rendering of chatbot components based on user status */}
        {isAdmin ? (
          // Render Admin Chatbot for admin user
          <AdminChatbotPage />
        ) : isAuthenticated && user ? (
          // Render Private Chatbot for regular authenticated users
          <PrivateChatbotPage userId={user.id} username={user.username} />
        ) : (
          // Render Public Chatbot for unauthenticated users
          <PublicChatbotPage />
        )}
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';
import Link from 'next/link';
// Import PublicChatbotPage from the 'public' route segment.
// Next.js automatically looks for a 'page.tsx' file within the specified directory.
import PublicChatbotPage from './public/page';

export default function ChatbotPage() {
  // State to determine if user is authenticated.
  // This will eventually be connected to your actual authentication system.
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl flex flex-col h-[80vh] relative">
        {/* Persistent Login/Signup Button at the top right */}
        <div className="absolute top-4 right-4">
          <Link href="/login" passHref className="py-2 px-4 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition duration-300 ease-in-out text-sm font-semibold">
            Iniciar Sesión / Registrarme
          </Link>
        </div>

        {/* Main Chatbot Title */}
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-4 mt-12">NutriSaas Chatbot</h2>

        {/* Conditional rendering of chatbot types based on authentication status */}
        {isAuthenticated ? (
          // Placeholder for the Private or Admin Chatbot for authenticated users.
          // You will replace this with your PrivateChatbot component when you create it.
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Authenticated Chatbot will go here.
          </div>
        ) : (
          // Render the PublicChatbotPage component for unauthenticated users.
          // This component contains all the specific logic and UI for the public chatbot.
          <PublicChatbotPage />
        )}
      </div>
    </div>
  );
}

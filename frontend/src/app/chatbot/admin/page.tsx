// Client-side component, necessary for handling private chatbot interactions
'use client'; 

// Import React hooks for state management and side effects
import { useState, useRef, useEffect } from 'react';

// Import Apollo Client modules for executing GraphQL mutations
import { gql, useMutation } from '@apollo/client';

// Define the GraphQL mutation to send a message admin chatbot
const ADMIN_CHATBOT_MUTATION = gql`
  mutation AdminChatbot($message: String!) {
    adminChatbot(message: $message) {
      response
    }
  }
`;

// Define the interface for a chat message object
interface ChatMessage {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

// React component for displaying a single chat message
const ChatMessage = ({ msg }: { msg: ChatMessage }) => (
  <div
    key={msg.id}
    className={`flex ${
      msg.sender === 'user' ? 'justify-end' : 'justify-start'
    }`}
  >
    <div
      className={`max-w-[70%] p-3 rounded-lg ${
        msg.sender === 'user'
          ? 'bg-purple-500 text-white'
          : 'bg-gray-200 text-gray-800'
      }`}
    >
      {msg.text}
    </div>
  </div>
);

// Main component for the Admin Chatbot Page
export default function AdminChatbotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]); // State to store the chat messages
  const [inputMessage, setInputMessage] = useState(''); // State to manage the text input field's value
  const messagesEndRef = useRef<HTMLDivElement>(null); // Hook to create a reference to the end of the message list

  // Hook to handle the `ADMIN_CHATBOT_MUTATION`
  const [sendAdminMessage, { loading }] = useMutation(ADMIN_CHATBOT_MUTATION, {
    // Callback function that runs when the mutation is successful
    onCompleted: (data) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: prevMessages.length + 1,
          text: "Una disculpa, mis habilidades no pueden solucionar esa pregunta por el momento.",
          sender: 'bot',
        },
        {
          id: prevMessages.length + 2,
          text: "¿Hay algo más en lo que te pueda ayudar?",
          sender: 'bot',
        },
      ]);
      setInputMessage('');
    },
     // Callback function for when the mutation fails
    onError: (error) => {
      console.error('Admin Chatbot API error:', error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: prevMessages.length + 1,
          text: 'Oops! Something went wrong with the admin chatbot service. Please try again.',
          sender: 'bot',
        },
      ]);
      setInputMessage('');
    },
  });

  // Display the initial greeting message when the component mounts
  useEffect(() => {
    setMessages([
      {
        id: 1,
        text: "¡Hola Admin! ¿En qué te puedo ayudar hoy?",
        sender: 'bot',
      },
    ]);
  }, []);

  // Scroll to the bottom of the chat window whenever the `messages` state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle form submission
  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (inputMessage.trim() === '') return;
    
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: prevMessages.length + 1,
        text: inputMessage,
        sender: 'user',
      },
    ]);

    await sendAdminMessage({ variables: { message: inputMessage } });
    setInputMessage('');
  };

  // Admin Chatbot page desgn
  return (
    <div className="flex flex-col h-full w-full bg-white text-gray-800">
      {/* Messages container, configured to be scrollable and growable. */}
      <div className="flex-1 overflow-y-auto p-4 border border-gray-200 rounded-md mb-4 space-y-3">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} msg={msg} />
        ))}
        {/* Invisible div to serve as the scroll anchor. */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input form, configured to shrink and stay at the bottom. */}
      <div className="flex-shrink-0">
        <form onSubmit={handleFormSubmit} className="flex space-x-3">
          <input
            type="text"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
            placeholder="Escribe tu mensaje para el admin chatbot..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className="px-6 py-2 bg-purple-600 text-white rounded-md shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
            disabled={loading || inputMessage.trim() === ''}
          >
            {loading ? 'Enviando...' : 'Enviar'}
          </button>
        </form>
      </div>
    </div>
  );
}
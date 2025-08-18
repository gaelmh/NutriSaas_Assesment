// Updated admin chatbot page.tsx with NLP integration
'use client'; 

import { useState, useRef, useEffect } from 'react';
import { gql, useMutation } from '@apollo/client';

// Updated GraphQL mutation to include new fields
const ADMIN_CHATBOT_MUTATION = gql`
  mutation AdminChatbot($message: String!) {
    adminChatbot(message: $message) {
      response
      intent
      confidence
    }
  }
`;

interface ChatMessage {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  intent?: string;
  confidence?: number;
}

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
      <div className="whitespace-pre-line">{msg.text}</div>
      {/* Show intent and confidence for admin debugging */}
      {msg.sender === 'bot' && msg.intent && (
        <div className="text-xs mt-1 opacity-70">
          Intent: {msg.intent} | Confidence: {(msg.confidence || 0 * 100).toFixed(1)}%
        </div>
      )}
    </div>
  </div>
);

export default function AdminChatbotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Updated mutation handler to use actual NLP response
  const [sendAdminMessage, { loading }] = useMutation(ADMIN_CHATBOT_MUTATION, {
    onCompleted: (data) => {
      const nlpResponse = data.adminChatbot;
      
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: prevMessages.length + 1,
          text: nlpResponse.response,
          sender: 'bot',
          intent: nlpResponse.intent,
          confidence: nlpResponse.confidence,
        },
      ]);
      setInputMessage('');
    },
    onError: (error) => {
      console.error('Admin Chatbot API error:', error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: prevMessages.length + 1,
          text: 'Error: No se pudo conectar con el servicio de chat. Por favor, inténtalo de nuevo.',
          sender: 'bot',
        },
      ]);
      setInputMessage('');
    },
  });

  useEffect(() => {
    setMessages([
      {
        id: 1,
        text: "¡Hola Admin! Soy tu asistente con capacidades especiales. Puedes preguntarme sobre estadísticas de usuarios o cualquier cosa relacionada con NutriSaas.",
        sender: 'bot',
      },
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  return (
    <div className="flex flex-col h-full w-full bg-white text-gray-800">
      <div className="flex-1 overflow-y-auto p-4 border border-gray-200 rounded-md mb-4 space-y-3">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} msg={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

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
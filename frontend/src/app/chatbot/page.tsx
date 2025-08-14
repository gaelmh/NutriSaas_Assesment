'use client';

import { useState, useRef, useEffect } from 'react';
import { gql, useMutation } from '@apollo/client';
import { useRouter } from 'next/navigation'; // For redirection
import Link from 'next/link'; // Import Link for the persistent button

// Define the GraphQL chatbot mutation
const CHATBOT_MUTATION = gql`
  mutation Chatbot($message: String!) {
    chatbot(message: $message) {
      response
    }
  }
`;

interface ChatMessage {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  options?: string[]; // For bot-provided buttons
  // New property to indicate if this message was a user button click
  isUserOption?: boolean;
  selectedOption?: string; // To store the option the user selected
}

// Define conversation states for guest users
const GUEST_CONVERSATION_FLOW = {
  INITIAL: {
    botMessage: "¡Hola! Bienvenido a NutriSaaS 🥗 ¿En qué puedo ayudarte hoy?",
    options: ["📋 Conocer nuestros planes", "❓ Preguntas frecuentes", "📞 Contactar a un asesor", "🍎 ¿Qué es NutriSaaS?", "Otro"], // Added "Otro"
  },
  PLAN_SELECTION: {
    botMessage: "Tenemos 3 planes diseñados para ti:",
    options: ["🌟 Plan Básico - $9.99/mes", "💎 Plan Premium - $19.99/mes", "🏆 Plan Pro - $39.99/mes", "⬅️ Volver al menú principal"],
  },
  BASIC_PLAN_DETAILS: {
    botMessage: "Aquí están los detalles del Plan Básico: [Detalles del Plan Básico]",
    options: ["📝 Registrarme ahora", "💬 Hablar con un asesor", "⬅️ Ver otros planes"],
  },
  PREMIUM_PLAN_DETAILS: {
    botMessage: "✅ Planes de comida personalizados ✅ Tracking avanzado de nutrientes ✅ 2 consultas mensuales con nutriólogo ✅ Acceso a +500 recetas",
    options: ["📝 Registrarme ahora", "💬 Hablar con un asesor", "⬅️ Ver otros planes"],
  },
  PRO_PLAN_DETAILS: {
    botMessage: "Aquí están los detalles del Plan Pro: [Detalles del Plan Pro]",
    options: ["📝 Registrarme ahora", "💬 Hablar con un asesor", "⬅️ Ver otros planes"],
  },
  FAQ: {
    botMessage: "Aquí puedes encontrar respuestas a las preguntas más frecuentes: [Link a FAQ]",
    options: ["⬅️ Volver al menú principal"],
  },
  CONTACT_ADVISOR: {
    botMessage: "Por el momento ninguno de nustros asesores está disponible. Puedes contactar a un asesor por email contact@nutrisaas.com o llamando al +1 234 567 8900.",
    options: ["⬅️ Volver al menú principal"],
  },
  WHAT_IS_NUTRISAAS: {
    botMessage: "NutriSaaS es una plataforma que te ayuda a alcanzar tus metas de nutrición con planes personalizados.",
    options: ["⬅️ Volver al menú principal"],
  },
  // New state for "Other" option
  OTHER_INPUT: {
    botMessage: "Una disculpa, mis habilidades no pueden solucionar esa pregunta por el momento.",
    options: [], // No options, expects text input
  },
};

export default function ChatbotPage() {
  const router = useRouter();
  // State to hold the current input message
  const [inputMessage, setInputMessage] = useState('');
  // State to hold all chat messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // State to manage guest conversation flow
  const [guestState, setGuestState] = useState('INITIAL');
  // State to determine if user is authenticated (for future use)
  const [isAuthenticated, setIsAuthenticated] = useState(false); // TODO: Implement actual auth check
  // New state to control visibility of text input for guest
  const [showGuestTextInput, setShowGuestTextInput] = useState(false);

  const [sendChatMessage, { loading }] = useMutation(CHATBOT_MUTATION, {
    onCompleted: (data) => {
      // When the mutation is completed successfully, add the bot's response to messages
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: prevMessages.length + 1,
          text: data.chatbot.response,
          sender: 'bot',
        },
      ]);
      // After bot response for authenticated user, clear input if needed
      setInputMessage('');
    },
    onError: (error) => {
      // Handle errors from the chatbot API
      console.error('Chatbot API error:', error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: prevMessages.length + 1,
          text: 'Oops! Something went wrong. Please try again.',
          sender: 'bot',
        },
      ]);
      setInputMessage('');
    },
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial bot message for guest users or when returning to initial state
  useEffect(() => {
    // Only add initial message if not authenticated, no messages yet, AND not currently showing text input
    // OR if returning to INITIAL state and the last message was a user message (indicating a reset)
    if (!isAuthenticated && (messages.length === 0 || (guestState === 'INITIAL' && messages[messages.length - 1]?.sender === 'user' && !showGuestTextInput))) {
        const initialBotMessage = GUEST_CONVERSATION_FLOW.INITIAL;
        setMessages((prevMessages) => [
            ...prevMessages,
            {
                id: prevMessages.length + 1,
                text: initialBotMessage.botMessage,
                sender: 'bot',
                options: initialBotMessage.options,
            },
        ]);
        setShowGuestTextInput(false); // Ensure text input is hidden when initial options are shown
    }
  }, [isAuthenticated, messages.length, guestState, showGuestTextInput]); // Added showGuestTextInput to dependencies


  // Handle sending a message (for authenticated users or guest text input)
  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (inputMessage.trim() === '') return;

    const userMessage: ChatMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputMessage(''); // Clear input immediately

    if (isAuthenticated) {
      // Authenticated user: send to NLP backend
      await sendChatMessage({ variables: { message: inputMessage } });
    } else {
      // Guest user with "Other" input
      // First bot response: "Una disculpa..."
      const firstBotResponse: ChatMessage = {
        id: messages.length + 2,
        text: GUEST_CONVERSATION_FLOW.OTHER_INPUT.botMessage,
        sender: 'bot',
        options: [], // No options for this message
      };

      // Second bot response: "Hay algo más..." with initial options
      const secondBotResponse: ChatMessage = {
        id: messages.length + 3, // Ensure unique ID
        text: "¿Hay algo más en lo que te pueda ayudar?",
        sender: 'bot',
        options: GUEST_CONVERSATION_FLOW.INITIAL.options, // Prompt initial options again
      };

      setMessages((prevMessages) => [...prevMessages, firstBotResponse, secondBotResponse]);
      setGuestState('INITIAL'); // Reset guest state
      setShowGuestTextInput(false); // Hide text input
    }
  };

  // Handle button clicks for guest users
  const handleGuestOptionClick = (option: string) => {
    // Update the last user message to show the selected option
    setMessages((prevMessages) =>
      prevMessages.map((msg, index) =>
        index === prevMessages.length - 1 && msg.sender === 'user'
          ? { ...msg, selectedOption: option } // Store the selected option
          : msg
      )
    );

    // If "Otro" is clicked, show text input
    if (option === "Otro") {
      const userMessage: ChatMessage = {
        id: messages.length + 1,
        text: option,
        sender: 'user',
        isUserOption: true, // Mark as user option button click
      };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setShowGuestTextInput(true);
      return; // Do not proceed with conversation flow, wait for text input
    }

    const userMessage: ChatMessage = {
      id: messages.length + 1,
      text: option,
      sender: 'user',
      isUserOption: true, // Mark as user option button click
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    let nextBotMessage: { botMessage: string; options?: string[] } | null = null;
    let newGuestState = guestState;

    // Logic to determine the next bot response based on the clicked option
    switch (guestState) {
      case 'INITIAL':
        if (option === "📋 Conocer nuestros planes") {
          nextBotMessage = GUEST_CONVERSATION_FLOW.PLAN_SELECTION;
          newGuestState = 'PLAN_SELECTION';
        } else if (option === "❓ Preguntas frecuentes") {
          nextBotMessage = GUEST_CONVERSATION_FLOW.FAQ;
          newGuestState = 'FAQ';
        } else if (option === "📞 Contactar a un asesor") {
          nextBotMessage = GUEST_CONVERSATION_FLOW.CONTACT_ADVISOR;
          newGuestState = 'CONTACT_ADVISOR';
        } else if (option === "🍎 ¿Qué es NutriSaaS?") {
          nextBotMessage = GUEST_CONVERSATION_FLOW.WHAT_IS_NUTRISAAS;
          newGuestState = 'WHAT_IS_NUTRISAAS';
        }
        break;
      case 'PLAN_SELECTION':
        if (option === "🌟 Plan Básico - $9.99/mes") {
          nextBotMessage = GUEST_CONVERSATION_FLOW.BASIC_PLAN_DETAILS;
          newGuestState = 'BASIC_PLAN_DETAILS';
        } else if (option === "💎 Plan Premium - $19.99/mes") {
          nextBotMessage = GUEST_CONVERSATION_FLOW.PREMIUM_PLAN_DETAILS;
          newGuestState = 'PREMIUM_PLAN_DETAILS';
        } else if (option === "🏆 Plan Pro - $39.99/mes") {
          nextBotMessage = GUEST_CONVERSATION_FLOW.PRO_PLAN_DETAILS;
          newGuestState = 'PRO_PLAN_DETAILS';
        } else if (option === "⬅️ Volver al menú principal") {
          nextBotMessage = GUEST_CONVERSATION_FLOW.INITIAL;
          newGuestState = 'INITIAL';
        }
        break;
      case 'BASIC_PLAN_DETAILS':
      case 'PREMIUM_PLAN_DETAILS':
      case 'PRO_PLAN_DETAILS':
        if (option === "📝 Registrarme ahora") {
          router.push('/signup'); // Redirect to signup page
          return;
        } else if (option === "💬 Hablar con un asesor") {
          nextBotMessage = GUEST_CONVERSATION_FLOW.CONTACT_ADVISOR; // Reuse contact advisor logic
          newGuestState = 'CONTACT_ADVISOR';
        } else if (option === "⬅️ Ver otros planes") {
          nextBotMessage = GUEST_CONVERSATION_FLOW.PLAN_SELECTION;
          newGuestState = 'PLAN_SELECTION';
        }
        break;
      case 'FAQ':
      case 'CONTACT_ADVISOR':
      case 'WHAT_IS_NUTRISAAS':
        if (option === "⬅️ Volver al menú principal") {
          nextBotMessage = GUEST_CONVERSATION_FLOW.INITIAL;
          newGuestState = 'INITIAL';
        }
        break;
      default:
        nextBotMessage = GUEST_CONVERSATION_FLOW.INITIAL;
        newGuestState = 'INITIAL';
    }

    if (nextBotMessage) {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: prevMessages.length + 1,
          text: nextBotMessage.botMessage,
          sender: 'bot',
          options: nextBotMessage.options,
        },
      ]);
      setGuestState(newGuestState);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl flex flex-col h-[80vh] relative">
        {/* Persistent Login/Signup Button */}
        <div className="absolute top-4 right-4">
          <Link href="/login" passHref className="py-2 px-4 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition duration-300 ease-in-out text-sm font-semibold">
            Iniciar Sesión / Registrarme
          </Link>
        </div>

        {/* Chatbot Title - Adjusted margin-top */}
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-4 mt-12">NutriSaas Chatbot</h2> {/* Adjusted mt-12 */}


        {/* Chat Messages Display Area */}
        <div className="flex-1 overflow-y-auto p-4 border border-gray-200 rounded-md mb-4 space-y-3">
          {messages.map((msg, index) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[70%] p-3 rounded-lg ${
                  msg.sender === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                {msg.text}
              </div>
              {/* Render user's selected option as a button */}
              {msg.sender === 'user' && msg.selectedOption && (
                <div className="ml-2">
                  <button className="py-2 px-4 bg-blue-500 text-white rounded-lg shadow-md text-sm">
                    {msg.selectedOption}
                  </button>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} /> {/* For auto-scrolling */}
        </div>

        {/* Conditional Input/Buttons based on authentication status */}
        {isAuthenticated ? (
          // Authenticated user input (for future NLP integration)
          <form onSubmit={handleSendMessage} className="flex space-x-3">
            <input
              type="text"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Type your message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={loading} // Disable input while waiting for bot response
            />
            <button
              type="submit"
              className="px-6 py-2 bg-purple-600 text-white rounded-md shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
              disabled={loading || inputMessage.trim() === ''}
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </form>
        ) : (
          // Guest user buttons or text input
          <>
            {showGuestTextInput ? (
              <form onSubmit={handleSendMessage} className="flex space-x-3">
                <input
                  type="text"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Escribe tu pregunta..."
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
            ) : (
              // Only show options if the last message is from the bot and has options
              messages[messages.length - 1]?.sender === 'bot' && messages[messages.length - 1]?.options && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {messages[messages.length - 1]?.options?.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleGuestOptionClick(option)}
                      className="py-3 px-4 bg-indigo-500 text-white rounded-lg shadow-md hover:bg-indigo-600 transition duration-300 ease-in-out text-base font-medium"
                      disabled={loading}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}

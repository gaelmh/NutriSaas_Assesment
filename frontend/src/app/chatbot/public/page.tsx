// Client-side component, necessary for handling private chatbot interactions
'use client';

// Import React hooks for state management and side effects
import { useState, useRef, useEffect, useCallback } from 'react';

// Import Apollo Client modules for executing GraphQL mutations
import { gql, useMutation } from '@apollo/client';

// Import `useRouter` for programmatic navigation in Next.js
import { useRouter } from 'next/navigation';

// Define the GraphQL mutation to send a message admin chatbot
const CHATBOT_MUTATION = gql`
  mutation Chatbot($message: String!) {
    chatbot(message: $message) {
      response
    }
  }
`;

// Define the interface for a chat message object
interface ChatMessage {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  options?: string[];
  isUserOption?: boolean;
  selectedOption?: string;
}

// Defines conversation flow
const GUEST_CONVERSATION_FLOW = {
  // Initial/Welcome message
  INITIAL: {
    botMessage: "¡Hola! Bienvenido a NutriSaas 🥗 ¿En qué puedo ayudarte hoy?",
    options: ["📋 Conocer nuestros planes", "❓ Preguntas frecuentes", "📞 Contactar a un asesor", "🍎 ¿Qué es NutriSaas?", "🤷 Otro"],
  },

  // Options for returning to the main menu 
  RETURN_TO_INITIAL: {
    botMessage: "¿Hay algo más en lo que te pueda ayudar?",
    options: ["📋 Conocer nuestros planes", "❓ Preguntas frecuentes", "📞 Contactar a un asesor", "🍎 ¿Qué es NutriSaas?", "🤷 Otro"],
  },

  // Options for selecting a plan.
  PLAN_SELECTION: {
    botMessage: "Tenemos 3 planes diseñados para ti:",
    options: ["🌟 Plan Básico - $9.99/mes", "💎 Plan Premium - $19.99/mes", "🏆 Plan Pro - $39.99/mes", "⬅️ Volver al menú principal"],
  },
  // Details for the Basic plan
  BASIC_PLAN_DETAILS: {
    botMessage:
    "El Plan Básico incluye:\n" +
    "• ✅ Planes de comida estandar.\n" +
    "• ✅ Información nutricional básica.\n" + 
    "• ✅ Acceso limitado a recetas",
    options: ["📝 Registrarme ahora", "💬 Hablar con un asesor", "⬅️ Ver otros planes"],
  },
  // Details for the Premium plan
  PREMIUM_PLAN_DETAILS: {
    botMessage: 
    "El Plan Premium incluye:\n" +
    "• ✅ Planes de comida personalizados\n" +
    "• ✅ Tracking avanzado de nutrientes\n" + 
    "• ✅ 2 consultas mensuales con nutriólogo\n" + 
    "• ✅ Acceso a +500 recetas",
    options: ["📝 Registrarme ahora", "💬 Hablar con un asesor", "⬅️ Ver otros planes"],
  },
  // Details for the Pro plan
  PRO_PLAN_DETAILS: {
    botMessage:     
    "El Plan Pro incluye:\n" +
    "• ✅ Planes de comida personalizados\n" +
    "• ✅ Tracking avanzado de nutrientes\n" + 
    "• ✅ Consultas ilimitadas con nutriólogo\n" + 
    "• ✅ Acceso ilimitado a recetas\n" +
    "• ✅ Integración con dispositivos de seguimiento de actividad física",
    options: ["📝 Registrarme ahora", "💬 Hablar con un asesor", "⬅️ Ver otros planes"],
  },

  // FAQ option, which includes a link to the FAQ page
  FAQ: {
    botMessage: `Aquí puedes encontrar respuestas a las preguntas más frecuentes: <a href="/chatbot/public/FAQs" target="_blank" class="text-blue-500 underline hover:text-blue-700">FAQs</a>`,
    options: ["⬅️ Volver al menú principal"],
  },
  
  // Contact advisor information
  CONTACT_ADVISOR: {
    botMessage: "Por el momento ninguno de nustros asesores está disponible. Puedes contactar a un asesor por email contact@nutrisaas.com o llamando al +1 234 567 8900.",
    options: ["⬅️ Volver al menú principal"],
  },

  // Description of NutriSaaS
  WHAT_IS_NUTRISAAS: {
    botMessage: "NutriSaas es una plataforma que te ayuda a alcanzar tus metas de nutrición con planes personalizados.",
    options: ["⬅️ Volver al menú principal"],
  },

  // // Temporary default response for user input (MODIFY TO TAKE NLP ANSWER) 
  OTHER_INPUT: {
    botMessage: "Una disculpa, mis habilidades no pueden solucionar esa pregunta por el momento.",
    options: [],
  },
};

// React component for displaying a single chat message
const ChatMessage = ({ msg }: { msg: ChatMessage }) => (
  <div
    key={msg.id}
    className={`flex ${
      msg.sender === 'user' ? 'justify-end' : 'justify-start'
    }`}
  >
    <div
      className={`max-w-[70%] p-3 rounded-lg whitespace-pre-line ${
        msg.sender === 'user'
          ? 'bg-blue-500 text-white'
          : 'bg-gray-200 text-gray-800'
      }`}
    >
      <span dangerouslySetInnerHTML={{ __html: msg.text }} />
    </div>
  </div>
);

// The main component for the public chatbot page
export default function PublicChatbotPage() {
  const router = useRouter();
  const [inputMessage, setInputMessage] = useState(''); // State for the text input field
  const [messages, setMessages] = useState<ChatMessage[]>([]); // State for the chat messages list
  const [guestState, setGuestState] = useState('INITIAL'); // State to track the current position in the conversational flow
  const [showGuestTextInput, setShowGuestTextInput] = useState(false); // State to conditionally show the text input field

  // Hook to send messages to the chatbot backend
  const [sendChatMessage, { loading }] = useMutation(CHATBOT_MUTATION, {
    onError: (error) => {
      console.error('Chatbot API error:', error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: prevMessages.length + 1,
          text: 'Oops! Something went wrong with the chatbot service. Please try again.',
          sender: 'bot',
        },
      ]);
      setInputMessage('');
    },
  });

  // Ref to enable auto-scrolling to the latest message
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom of the message list whenever messages are updated
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Effect to initialize the chat with the first bot message when the component mounts
  useEffect(() => {
    if (messages.length === 0) {
      const initialBotMessage = GUEST_CONVERSATION_FLOW.INITIAL;
      setMessages([
        {
          id: 1,
          text: initialBotMessage.botMessage,
          sender: 'bot',
          options: initialBotMessage.options,
        },
      ]);
      setGuestState('INITIAL');
      setShowGuestTextInput(false);
    }
  }, []);

  // Handler for text input form submission
  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (inputMessage.trim() === '') return;

    const userMessage: ChatMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputMessage('');

    await sendChatMessage({ variables: { message: inputMessage } });

    const firstBotResponse: ChatMessage = {
      id: messages.length + 2,
      text: GUEST_CONVERSATION_FLOW.OTHER_INPUT.botMessage,
      sender: 'bot',
      options: [],
    };

    const secondBotResponse: ChatMessage = {
      id: messages.length + 3,
      text: "¿Hay algo más en lo que te pueda ayudar?",
      sender: 'bot',
      options: GUEST_CONVERSATION_FLOW.INITIAL.options,
    };

    setMessages((prevMessages) => [...prevMessages, firstBotResponse, secondBotResponse]);
    setGuestState('INITIAL');
    setShowGuestTextInput(false);
  };

  // Handler for when a user clicks on an option button
  const handleGuestOptionClick = (option: string) => {
    const userMessage: ChatMessage = {
      id: messages.length + 1,
      text: option,
      sender: 'user',
      isUserOption: true,
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    // Handle the "Otro" option separately to switch to text input mode
    if (option === "🤷 Otro") {
      setShowGuestTextInput(true);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: prevMessages.length + 1,
          text: "Por favor, describe lo que necesitas",
          sender: 'bot',
        },
      ]);
      return;
    }

    let nextBotMessage: { botMessage: string; options?: string[] } | null = null;
    let newGuestState = guestState;

    // Use a switch statement to manage the flow based on the current state and user's choice
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
        } else if (option === "🍎 ¿Qué es NutriSaas?") {
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
          nextBotMessage = GUEST_CONVERSATION_FLOW.RETURN_TO_INITIAL;
          newGuestState = 'INITIAL';
        }
        break;
      case 'BASIC_PLAN_DETAILS':
      case 'PREMIUM_PLAN_DETAILS':
      case 'PRO_PLAN_DETAILS':
        if (option === "📝 Registrarme ahora") {
          router.push('/signup');
          return;
        } else if (option === "💬 Hablar con un asesor") {
          nextBotMessage = GUEST_CONVERSATION_FLOW.CONTACT_ADVISOR;
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
          nextBotMessage = GUEST_CONVERSATION_FLOW.RETURN_TO_INITIAL;
          newGuestState = 'INITIAL';
        }
        break;
      default:
        nextBotMessage = GUEST_CONVERSATION_FLOW.RETURN_TO_INITIAL;
        newGuestState = 'INITIAL';
    }

    // Add the next bot message and update the state
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

// Public Chatbot page desgn
return (
  <div className="flex flex-col h-full w-full bg-white text-gray-800">
    {/* Messages container, configured to be scrollable and growable. */}
    <div className="flex-1 overflow-y-auto p-4 bg-white border border-gray-200 rounded-md mb-4 space-y-3">
      {messages.map((msg) => (
        <ChatMessage key={msg.id} msg={msg} />
      ))}
      {/* Invisible div as a scroll anchor. */}
      <div ref={messagesEndRef} />
    </div>

    {/* Input or option buttons, conditionally rendered. */}
    <div className="flex-shrink-0">
      {showGuestTextInput ? (
        <form onSubmit={handleSendMessage} className="flex space-x-3">
          <input
            type="text"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Escribe tu mensaje para el chatbot público..."
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
    </div>
  </div>
)};

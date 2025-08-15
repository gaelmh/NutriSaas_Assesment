'use client';

import { useState, useRef, useEffect } from 'react';
import { gql, useMutation } from '@apollo/client';
import { useRouter } from 'next/navigation';

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
  options?: string[];
  isUserOption?: boolean;
  selectedOption?: string;
}

// Define conversation states for guest users
const GUEST_CONVERSATION_FLOW = {
  INITIAL: {
    botMessage: "¡Hola! Bienvenido a NutriSaas 🥗 ¿En qué puedo ayudarte hoy?",
    options: ["📋 Conocer nuestros planes", "❓ Preguntas frecuentes", "📞 Contactar a un asesor", "🍎 ¿Qué es NutriSaas?", "Otro"],
  },
  RETURN_TO_INITIAL: {
    botMessage: "¿Hay algo más en lo que te pueda ayudar?",
    options: ["📋 Conocer nuestros planes", "❓ Preguntas frecuentes", "📞 Contactar a un asesor", "🍎 ¿Qué es NutriSaas?", "Otro"],
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
    botMessage: "NutriSaas es una plataforma que te ayuda a alcanzar tus metas de nutrición con planes personalizados.",
    options: ["⬅️ Volver al menú principal"],
  },
  OTHER_INPUT: {
    botMessage: "Una disculpa, mis habilidades no pueden solucionar esa pregunta por el momento.",
    options: [],
  },
};

// Simple ChatMessage component for rendering messages
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
          ? 'bg-blue-500 text-white'
          : 'bg-gray-200 text-gray-800'
      }`}
    >
      {msg.text}
    </div>
  </div>
);

// This component is now named "Page" as per Next.js route file conventions.
// It will be the default export for the /chatbot/public route.
export default function PublicChatbotPage() {
  const router = useRouter();
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [guestState, setGuestState] = useState('INITIAL');
  const [showGuestTextInput, setShowGuestTextInput] = useState(false);

  const [sendChatMessage, { loading }] = useMutation(CHATBOT_MUTATION, {
    onCompleted: (data) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: prevMessages.length + 1,
          text: data.chatbot.response,
          sender: 'bot',
        },
      ]);
      setInputMessage('');
    },
    onError: (error) => {
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

  // Effect for auto-scrolling
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Effect to add the initial bot message on component mount for public users.
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

  // Handle sending a message when the guest user uses the text input ('Otro' option)
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

  // Handle button clicks for guest users
  const handleGuestOptionClick = (option: string) => {
    const userMessage: ChatMessage = {
      id: messages.length + 1,
      text: option,
      sender: 'user',
      isUserOption: true,
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    if (option === "Otro") {
      setShowGuestTextInput(true);
      return;
    }

    let nextBotMessage: { botMessage: string; options?: string[] } | null = null;
    let newGuestState = guestState;

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
    <>
      {/* Chat Messages Display Area */}
      <div className="flex-1 overflow-y-auto p-4 border border-gray-200 rounded-md mb-4 space-y-3">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} msg={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Guest user buttons or text input */}
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
  );
}

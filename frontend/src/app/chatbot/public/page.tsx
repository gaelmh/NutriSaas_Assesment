// Updated public chatbot page.tsx with NLP integration
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { gql, useMutation } from '@apollo/client';
import { useRouter } from 'next/navigation';

// Updated GraphQL mutation to include new fields
const CHATBOT_MUTATION = gql`
  mutation Chatbot($message: String!) {
    chatbot(message: $message) {
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
  options?: string[];
  isUserOption?: boolean;
  selectedOption?: string;
  intent?: string;
  confidence?: number;
}

// Conversation flow remains the same
const GUEST_CONVERSATION_FLOW = {
  INITIAL: {
    botMessage: "¡Hola! Bienvenido a NutriSaas 🥗 ¿En qué puedo ayudarte hoy?",
    options: ["📋 Conocer nuestros planes", "❓ Preguntas frecuentes", "📞 Contactar a un asesor", "🍎 ¿Qué es NutriSaas?", "🤷 Otro"],
  },

  RETURN_TO_INITIAL: {
    botMessage: "¿Hay algo más en lo que te pueda ayudar?",
    options: ["📋 Conocer nuestros planes", "❓ Preguntas frecuentes", "📞 Contactar a un asesor", "🍎 ¿Qué es NutriSaas?", "🤷 Otro"],
  },

  PLAN_SELECTION: {
    botMessage: "Tenemos 3 planes diseñados para ti:",
    options: ["🌟 Plan Básico - $9.99/mes", "💎 Plan Premium - $19.99/mes", "🏆 Plan Pro - $39.99/mes", "⬅️ Volver al menú principal"],
  },

  BASIC_PLAN_DETAILS: {
    botMessage:
    "El Plan Básico incluye:\n" +
    "• ✅ Planes de comida estandar.\n" +
    "• ✅ Información nutricional básica.\n" + 
    "• ✅ Acceso limitado a recetas",
    options: ["📝 Registrarme ahora", "💬 Hablar con un asesor", "⬅️ Ver otros planes"],
  },

  PREMIUM_PLAN_DETAILS: {
    botMessage: 
    "El Plan Premium incluye:\n" +
    "• ✅ Planes de comida personalizados\n" +
    "• ✅ Tracking avanzado de nutrientes\n" + 
    "• ✅ 2 consultas mensuales con nutriólogo\n" + 
    "• ✅ Acceso a +500 recetas",
    options: ["📝 Registrarme ahora", "💬 Hablar con un asesor", "⬅️ Ver otros planes"],
  },

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

  FAQ: {
    botMessage: `Aquí puedes encontrar respuestas a las preguntas más frecuentes: <a href="/chatbot/public/FAQs" target="_blank" class="text-blue-500 underline hover:text-blue-700">FAQs</a>`,
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
};

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
      {/* Show intent and confidence for NLP responses (optional) */}
      {msg.sender === 'bot' && msg.intent && msg.confidence !== undefined && (
        <div className="text-xs mt-1 opacity-60">
          {msg.intent} ({(msg.confidence * 100).toFixed(1)}%)
        </div>
      )}
    </div>
  </div>
);

export default function PublicChatbotPage() {
  const router = useRouter();
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [guestState, setGuestState] = useState('INITIAL');
  const [showGuestTextInput, setShowGuestTextInput] = useState(false);

  // Updated mutation to use actual NLP response
  const [sendChatMessage, { loading }] = useMutation(CHATBOT_MUTATION, {
    onCompleted: (data) => {
      const nlpResponse = data.chatbot;
      
      // Use actual NLP response
      const botResponse: ChatMessage = {
        id: messages.length + 2,
        text: nlpResponse.response,
        sender: 'bot',
        options: [],
        intent: nlpResponse.intent,
        confidence: nlpResponse.confidence,
      };

      setMessages((prevMessages) => [...prevMessages, botResponse]);

      // If the intent is pricing, show plan options after the NLP response
      if (nlpResponse.intent === 'pricing') {
        setTimeout(() => {
          const planMessage: ChatMessage = {
            id: messages.length + 3,
            text: GUEST_CONVERSATION_FLOW.PLAN_SELECTION.botMessage,
            sender: 'bot',
            options: GUEST_CONVERSATION_FLOW.PLAN_SELECTION.options,
          };
          setMessages((prevMessages) => [...prevMessages, planMessage]);
          setGuestState('PLAN_SELECTION');
          setShowGuestTextInput(false);
        }, 1000);
      } else {
        // For other intents, just keep text input available
        // No automatic follow-up message
      }
    },
    onError: (error) => {
      console.error('Chatbot API error:', error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: prevMessages.length + 1,
          text: 'Lo siento, no pude procesar tu mensaje en este momento. Por favor, inténtalo de nuevo.',
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

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (inputMessage.trim() === '') return;

    const userMessage: ChatMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    
    // Store the input message and clear it immediately
    const messageToSend = inputMessage;
    setInputMessage('');

    // Send to NLP service
    await sendChatMessage({ variables: { message: messageToSend } });
  };

  const handleGuestOptionClick = (option: string) => {
    const userMessage: ChatMessage = {
      id: messages.length + 1,
      text: option,
      sender: 'user',
      isUserOption: true,
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    // Handle the "Otro" option to switch to NLP mode
    if (option === "🤷 Otro") {
      setShowGuestTextInput(true);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: prevMessages.length + 1,
          text: "Por favor, describe lo que necesitas y usaré mi sistema de inteligencia artificial para ayudarte.",
          sender: 'bot',
        },
      ]);
      return;
    }

    let nextBotMessage: { botMessage: string; options?: string[] } | null = null;
    let newGuestState = guestState;

    // Handle predefined conversation flow
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
    <div className="flex flex-col h-full w-full bg-white text-gray-800">
      <div className="flex-1 overflow-y-auto p-4 bg-white border border-gray-200 rounded-md mb-4 space-y-3">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} msg={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex-shrink-0">
        {showGuestTextInput ? (
          <form onSubmit={handleSendMessage} className="flex space-x-3">
            <input
              type="text"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Escribe tu mensaje para el chatbot..."
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
  );
}
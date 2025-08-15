'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';

// --- GraphQL Definitions ---

// Query to get user information, now including sex and age
const GET_USER_INFO_QUERY = gql`
  query GetUserInfo($userId: String!) {
    userInfo(userId: $userId) {
      initialInfoCollected
      height_cm
      weight_kg
      allergies
      sex # Added sex
      age # Added age
    }
  }
`;

// Mutation to save initial user information, now including sex and age
const SAVE_INITIAL_INFO_MUTATION = gql`
  mutation SaveInitialInfo(
    $userId: String!,
    $username: String!,
    $height_cm: Int,
    $weight_kg: Int,
    $allergies: [String!],
    $sex: String, # Added sex
    $age: Int # Added age
  ) {
    saveInitialInfo(
      userId: $userId,
      username: $username,
      height_cm: $height_cm,
      weight_kg: $weight_kg,
      allergies: $allergies,
      sex: $sex, # Added sex
      age: $age # Added age
    ) {
      initialInfoCollected
    }
  }
`;

// General chatbot mutation (for post-info collection phase)
const CHATBOT_MUTATION = gql`
  mutation Chatbot($message: String!) {
    chatbot(message: $message) {
      response
    }
  }
`;

// --- Chat Message Interface ---
interface ChatMessage {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  options?: string[]; // For bot-provided buttons
  isUserOption?: boolean; // To mark if a user's message came from a button click
}

// --- Chat Message Component ---
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

// --- Private Chatbot Page Component ---
interface PrivateChatbotPageProps {
  userId: string;
  username: string;
}

export default function PrivateChatbotPage({ userId, username }: PrivateChatbotPageProps) {
  const ACTUAL_USER_ID = userId;
  const ACTUAL_USERNAME = username;

  // --- State Management ---
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [initialInfoCollected, setInitialInfoCollected] = useState<boolean>(false);
  const [infoCollectionStep, setInfoCollectionStep] = useState<string>('LOADING_USER_INFO');

  // Temporary state to hold collected info before final database save
  const [tempSex, setTempSex] = useState<string | null>(null); // New: for sex
  const [tempAge, setTempAge] = useState<number | null>(null); // New: for age
  const [tempHeight, setTempHeight] = useState<number | null>(null);
  const [tempWeight, setTempWeight] = useState<number | null>(null);
  const [tempAllergies, setTempAllergies] = useState<string[]>([]);


  // --- GraphQL Hooks ---

  // 1. Query to fetch user_information on component mount
  const { loading: queryLoading, error: queryError } = useQuery(GET_USER_INFO_QUERY, {
    variables: { userId: ACTUAL_USER_ID },
    skip: !ACTUAL_USER_ID,
    onCompleted: (data) => {
      if (data?.userInfo?.initialInfoCollected) {
        setInitialInfoCollected(true);
        setInfoCollectionStep('DONE');
        sendBotMessage("¡Hola de nuevo! ¿En qué te puedo ayudar hoy?");
      } else {
        setInfoCollectionStep('INTRO_PERSONAL_INFO');
      }
    },
    onError: (err) => {
      console.error("Error fetching user info:", err);
      setInfoCollectionStep('INTRO_PERSONAL_INFO');
    }
  });

  // 2. Mutation to save initial user information
  const [saveInitialInfoMutation, { loading: saveLoading }] = useMutation(SAVE_INITIAL_INFO_MUTATION, {
    onCompleted: (mutationData) => {
      if (mutationData.saveInitialInfo?.initialInfoCollected) {
        setInitialInfoCollected(true);
        sendBotMessage("¡Gracias! He guardado tu información. ¿En qué te puedo ayudar el día de hoy?");
        setInfoCollectionStep('DONE');
      }
    },
    onError: (error) => {
      console.error("Error saving initial info:", error);
      sendBotMessage("Lo siento, no pude guardar tu información en este momento. Por favor, inténtalo de nuevo.");
      // Fallback to a safe step if saving fails, e.g., re-ask allergies or general info
      setInfoCollectionStep('INTRO_PERSONAL_INFO'); 
    }
  });

  // 3. Mutation for general chatbot interaction (post-info collection)
  const [sendChatMessage, { loading: chatLoading }] = useMutation(CHATBOT_MUTATION, {
    onCompleted: (data) => {
      sendBotMessage("Una disculpa, mis habilidades no pueden solucionar esa pregunta por el momento.");
      sendBotMessage("¿Hay algo más en lo que te pueda ayudar?");
      setInputMessage('');
    },
    onError: (error) => {
      console.error('Chatbot API error:', error);
      sendBotMessage('Oops! Something went wrong. Please try again.');
      setInputMessage('');
    },
  });

  // --- Helper Functions ---
  const sendBotMessage = useCallback((text: string, options?: string[]) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: prevMessages.length + 1,
        text,
        sender: 'bot',
        options,
      },
    ]);
  }, []);

  const sendUserMessage = useCallback((text: string) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: prevMessages.length + 1,
        text,
        sender: 'user',
      },
    ]);
  }, []);


  // --- Effects ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Only proceed if not loading, info not collected, correct step, no messages yet, AND userId is available
    if (!queryLoading && !initialInfoCollected && infoCollectionStep === 'INTRO_PERSONAL_INFO' && messages.length === 0 && ACTUAL_USER_ID) {
      sendBotMessage("Para personalizar tu experiencia, necesito conocerte mejor.");
      setTimeout(() => {
        sendBotMessage("¿Cuál es tu sexo?", ["♂️ Masculino", "♀️ Femenino"]); // Ask for sex first
        setInfoCollectionStep('INTRO_SEX');
      }, 1000);
    }
  }, [queryLoading, initialInfoCollected, infoCollectionStep, messages.length, sendBotMessage, ACTUAL_USER_ID]);


  // --- Main Logic for Handling User Responses ---
  const handleUserResponse = async (responseText: string) => {
    sendUserMessage(responseText);

    const numericValue = parseInt(responseText); // For age, height, weight validation

    switch (infoCollectionStep) {
      case 'INTRO_SEX':
        if (responseText === "♂️ Masculino" || responseText === "♀️ Femenino") {
          setTempSex(responseText);
          sendBotMessage(`Perfecto, ${responseText.toLowerCase()} registrado. ¿Estás seguro de que esta información es correcta?`, ["✅ Sí, continuar", "✏️ Corregir sexo"]);
          setInfoCollectionStep('SEX_CONFIRM');
        } else {
          sendBotMessage("Por favor, selecciona una de las opciones de sexo.");
        }
        break;

      case 'SEX_CONFIRM':
        if (responseText === "✅ Sí, continuar") {
          sendBotMessage("¿Cuál es tu edad?");
          setInfoCollectionStep('INTRO_AGE');
        } else if (responseText === "✏️ Corregir sexo") {
          sendBotMessage("Por favor, selecciona tu sexo nuevamente.", ["♂️ Masculino", "♀️ Femenino"]);
          setInfoCollectionStep('INTRO_SEX');
        }
        break;

      case 'INTRO_AGE':
        if (!isNaN(numericValue) && numericValue > 0 && numericValue < 120) { // Basic age validation
          setTempAge(numericValue);
          sendBotMessage(`Perfecto, ${numericValue} años registrado. ¿Estás seguro de que esta información es correcta?`, ["✅ Sí, continuar", "✏️ Corregir edad"]);
          setInfoCollectionStep('AGE_CONFIRM');
        } else {
          sendBotMessage("Por favor, ingresa tu edad en años (solo números, por ejemplo: 25).");
        }
        break;

      case 'AGE_CONFIRM':
        if (responseText === "✅ Sí, continuar") {
          sendBotMessage("¿Cuál es tu altura actual? (en cm)");
          setInfoCollectionStep('INTRO_HEIGHT');
        } else if (responseText === "✏️ Corregir edad") {
          sendBotMessage("Por favor, ingresa tu edad actual nuevamente.");
          setInfoCollectionStep('INTRO_AGE');
        }
        break;

      case 'INTRO_HEIGHT':
        if (!isNaN(numericValue) && numericValue > 0) {
          setTempHeight(numericValue);
          sendBotMessage(`Perfecto, ${numericValue} cm registrado. ¿Estás seguro de que esta información es correcta?`, ["✅ Sí, continuar", "✏️ Corregir altura"]);
          setInfoCollectionStep('HEIGHT_CONFIRM');
        } else {
          sendBotMessage("Por favor, ingresa tu altura en centímetros (solo números).");
        }
        break;

      case 'HEIGHT_CONFIRM':
        if (responseText === "✅ Sí, continuar") {
          sendBotMessage("¿Cuál es tu peso actual? (en kg)");
          setInfoCollectionStep('INTRO_WEIGHT');
        } else if (responseText === "✏️ Corregir altura") {
          sendBotMessage("Por favor, ingresa tu altura actual nuevamente (en cm).");
          setInfoCollectionStep('INTRO_HEIGHT');
        }
        break;

      case 'INTRO_WEIGHT':
        if (!isNaN(numericValue) && numericValue > 0) {
          setTempWeight(numericValue);
          sendBotMessage(`He registrado ${numericValue} kg. ¿Es correcto?`, ["✅ Sí, continuar", "✏️ Corregir peso"]);
          setInfoCollectionStep('WEIGHT_CONFIRM');
        } else {
          sendBotMessage("Por favor, ingresa tu peso en kilogramos (solo números).");
        }
        break;

      case 'WEIGHT_CONFIRM':
        if (responseText === "✅ Sí, continuar") {
          sendBotMessage("¿Tienes alguna alergia alimentaria?", ["✅ Sí", "❌ No"]); // Ask if they have allergies
          setInfoCollectionStep('INTRO_ALLERGIES_QUESTION');
        } else if (responseText === "✏️ Corregir peso") {
          sendBotMessage("Por favor, ingresa tu peso actual nuevamente (en kg).");
          setInfoCollectionStep('INTRO_WEIGHT');
        }
        break;

      case 'INTRO_ALLERGIES_QUESTION':
        if (responseText === "✅ Sí") {
          sendBotMessage("¿A qué eres alérgico?");
          setInfoCollectionStep('INTRO_ALLERGIES_INPUT'); // Move to allergy input
        } else if (responseText === "❌ No") {
          setTempAllergies([]); // Ensure allergies array is empty
          setInfoCollectionStep('SAVING_INFO'); // Skip allergy input, go straight to saving
          await saveInitialInfoMutation({
            variables: {
              userId: ACTUAL_USER_ID,
              username: ACTUAL_USERNAME,
              sex: tempSex,
              age: tempAge,
              height_cm: tempHeight,
              weight_kg: tempWeight,
              allergies: [], // Explicitly empty if user selected 'No'
            }
          });
        } else {
          sendBotMessage("Por favor, selecciona 'Sí' o 'No'.");
        }
        break;

      case 'INTRO_ALLERGIES_INPUT': // User provides first allergy
        if (responseText.trim()) {
          setTempAllergies([responseText.trim()]);
          sendBotMessage(`He registrado: "${responseText.trim()}"`);
          sendBotMessage("¿Hay alguna otra alergia que deba conocer?", ["➕ Agregar otra alergia", "✅ No, eso es todo"]);
          setInfoCollectionStep('ALLERGIES_ADD_MORE');
        } else {
          sendBotMessage("Por favor, especifica tu alergia.");
        }
        break;

      case 'ALLERGIES_ADD_MORE':
        if (responseText === "➕ Agregar otra alergia") {
          sendBotMessage("Por favor, ingresa la siguiente alergia.");
          setInfoCollectionStep('ADD_NEXT_ALLERGY');
        } else if (responseText === "✅ No, eso es todo") {
          setInfoCollectionStep('SAVING_INFO');
          await saveInitialInfoMutation({
            variables: {
              userId: ACTUAL_USER_ID,
              username: ACTUAL_USERNAME,
              sex: tempSex,
              age: tempAge,
              height_cm: tempHeight,
              weight_kg: tempWeight,
              allergies: tempAllergies.length > 0 ? tempAllergies : [],
            }
          });
        } else {
          // User typed another allergy directly
          const updatedAllergies = [...tempAllergies, responseText.trim()];
          setTempAllergies(updatedAllergies);
          sendBotMessage(`He registrado: "${responseText.trim()}"`);
          sendBotMessage("¿Hay alguna otra alergia que deba conocer?", ["➕ Agregar otra alergia", "✅ No, eso es todo"]);
          // Remain in ALLERGIES_ADD_MORE state
        }
        break;

      case 'ADD_NEXT_ALLERGY':
        if (responseText.trim()) {
          const updatedAllergies = [...tempAllergies, responseText.trim()];
          setTempAllergies(updatedAllergies);
          sendBotMessage(`He registrado: "${responseText.trim()}"`);
          sendBotMessage("¿Hay alguna otra alergia que deba conocer?", ["➕ Agregar otra alergia", "✅ No, eso es todo"]);
          setInfoCollectionStep('ALLERGIES_ADD_MORE');
        } else {
          sendBotMessage("Por favor, ingresa la alergia o selecciona una opción.");
        }
        break;

      case 'DONE':
        await sendChatMessage({ variables: { message: responseText } });
        break;

      default:
        console.warn("Unexpected infoCollectionStep:", infoCollectionStep, "Resetting flow.");
        sendBotMessage("Lo siento, hubo un problema. Por favor, reinicia la conversación o intenta más tarde.");
        setInfoCollectionStep('INTRO_PERSONAL_INFO');
        break;
    }
  };

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (inputMessage.trim() === '') return;
    handleUserResponse(inputMessage);
    setInputMessage('');
  };

  const handleButtonClick = (option: string) => {
    handleUserResponse(option);
  };

  const lastBotMessage = messages[messages.length - 1];
  const lastBotHasOptions = lastBotMessage?.sender === 'bot' && lastBotMessage.options && lastBotMessage.options.length > 0;

  // Determine if the text input should be shown
  const showTextInput = (
    infoCollectionStep === 'INTRO_AGE' || // Age is text input
    infoCollectionStep === 'INTRO_HEIGHT' ||
    infoCollectionStep === 'INTRO_WEIGHT' ||
    infoCollectionStep === 'INTRO_ALLERGIES_INPUT' || // New state for allergy input
    infoCollectionStep === 'ADD_NEXT_ALLERGY' ||
    infoCollectionStep === 'DONE'
  );

  if (queryLoading || infoCollectionStep === 'LOADING_USER_INFO') {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 text-lg">
        Cargando información del usuario...
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 border border-gray-200 rounded-md mb-4 space-y-3">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} msg={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {showTextInput && !lastBotHasOptions ? (
        // Show text input if required by step and no active bot options are present
        <form onSubmit={handleFormSubmit} className="flex space-x-3">
          <input
            type="text"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder={infoCollectionStep === 'DONE' ? "Escribe tu mensaje..." : "Ingresa tu respuesta..."}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={saveLoading || chatLoading}
          />
          <button
            type="submit"
            className="px-6 py-2 bg-purple-600 text-white rounded-md shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
            disabled={saveLoading || chatLoading || inputMessage.trim() === ''}
          >
            {saveLoading || chatLoading ? 'Enviando...' : 'Enviar'}
          </button>
        </form>
      ) : (
        // Show buttons if the last bot message has options and text input is not explicitly forced
        lastBotHasOptions && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {lastBotMessage.options?.map((option, index) => (
              <button
                key={index}
                onClick={() => handleButtonClick(option)}
                className="py-3 px-4 bg-indigo-500 text-white rounded-lg shadow-md hover:bg-indigo-600 transition duration-300 ease-in-out text-base font-medium"
                disabled={saveLoading || chatLoading}
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

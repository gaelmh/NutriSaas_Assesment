// Client-side component, necessary for handling private chatbot interactions

'use client';

// Array of objects, containing a question and its corresponding answer.
const faqItems = [
  {
    question: "¿Qué es NutriSaas?",
    answer:
      "NutriSaas es una plataforma integral de nutrición que te ayuda a alcanzar tus objetivos de salud con planes personalizados, seguimiento de alimentos y acceso a nutriólogos certificados.",
  },
  {
    question: "¿Cuánto cuestan los planes?",
    answer:
      "Ofrecemos tres planes para adaptarnos a tus necesidades: Básico ($9.99/mes), Premium ($19.99/mes) y Pro ($39.99/mes). Todos nuestros planes incluyen una garantía de satisfacción de 30 días.",
  },
  {
    question: "¿Qué diferencia hay entre los planes?",
    answer:
      "El Plan Básico ofrece planes de comida estándar y seguimiento de nutrientes. El Plan Premium añade planes de comida personalizados y dos consultas mensuales con un nutriólogo. El Plan Pro incluye todas las funciones del Premium, pero con consultas ilimitadas y un acceso a una biblioteca de recetas más extensa.",
  },
  {
    question: "¿Puedo cancelar mi suscripción?",
    answer:
      "Sí, puedes cancelar tu suscripción en cualquier momento desde tu panel de usuario sin penalizaciones. La cancelación será efectiva al final del ciclo de facturación actual.",
  },
  {
    question: "¿Se adapta NutriSaas a mis alergias alimentarias?",
    answer:
      "Absolutamente. Al crear tu perfil, puedes especificar cualquier alergia o restricción dietética, y nuestro sistema personalizará tus planes de comida y recetas para garantizar tu seguridad y bienestar.",
  },
];

// Main component for the FAQs page
export default function FAQsPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Preguntas Frecuentes
        </h2>
        <div className="space-y-6">
          {/* Map over the faqItems array to render each question and answer. */}
          {faqItems.map((item, index) => (
            <div key={index}>
              <h3 className="text-xl font-semibold text-gray-800">
                {item.question}
              </h3>
              <p className="mt-2 text-gray-600">{item.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
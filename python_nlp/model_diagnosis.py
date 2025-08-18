# model_diagnosis.py - Diagnose and fix training issues

import json
import os
from collections import Counter

def analyze_training_data():
    """Analyze the training data to identify potential issues"""
    print("🔍 Analyzing Training Data")
    print("=" * 50)
    
    with open('./data/training_data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    intent_counts = Counter()
    total_examples = 0
    
    print("Intent Distribution:")
    for intent in data['intents']:
        count = len(intent['patterns'])
        intent_counts[intent['tag']] = count
        total_examples += count
        print(f"  {intent['tag']:15} → {count:2} examples")
    
    print(f"\nTotal examples: {total_examples}")
    print(f"Average per intent: {total_examples / len(intent_counts):.1f}")
    
    # Check for issues
    issues = []
    if total_examples < 100:
        issues.append("⚠️  Too few total examples (recommend 100+)")
    
    if min(intent_counts.values()) < 10:
        issues.append("⚠️  Some intents have too few examples (recommend 10+ each)")
    
    if max(intent_counts.values()) / min(intent_counts.values()) > 3:
        issues.append("⚠️  Unbalanced dataset (some intents have 3x more examples)")
    
    if issues:
        print("\n🚨 Issues Found:")
        for issue in issues:
            print(f"  {issue}")
    else:
        print("\n✅ Training data looks balanced")
    
    return intent_counts

def create_enhanced_training_data():
    """Create enhanced training data with more examples"""
    print("\n🚀 Creating Enhanced Training Data")
    print("=" * 50)
    
    enhanced_data = {
        "intents": [
            {
                "tag": "greeting",
                "patterns": [
                    "Hola", "Hola, cómo estás", "Buenos días", "Buenas tardes", "Qué tal",
                    "Hey", "hi", "hello", "Hola amigo", "Buenos días doctor", "Buenas noches",
                    "Saludos", "Hola qué tal", "Muy buenos días", "Hola buen día",
                    "Hola buenas", "Qué onda", "Cómo está usted", "Hola doctor",
                    "Buen día", "Buenas tardes doctor", "Hola amiga", "Hola querido",
                    "Hola mi amor", "Hola cariño", "Hola amor", "Hola que tal todo"
                ],
                "responses": ["¡Hola! Bienvenido a NutriSaas 🥗 ¿En qué puedo ayudarte hoy?"]
            },
            {
                "tag": "about_nutrisaas",
                "patterns": [
                    "¿Qué es NutriSaas?", "Háblame de NutriSaas", "Explica tu servicio",
                    "Qué servicios ofrecen", "Cuéntame sobre NutriSaas", "Qué hace NutriSaas",
                    "Para qué sirve NutriSaas", "Información sobre NutriSaas", "Describe NutriSaas",
                    "En qué consiste NutriSaas", "Qué tipo de servicio es", "Cuál es su función",
                    "Explícame qué hacen", "Cuéntame del servicio", "Qué ofrece la plataforma",
                    "De qué se trata esto", "Qué es esta aplicación", "Para qué es esto",
                    "Explica la plataforma", "Cuéntame sobre el servicio", "Qué tipo de app es"
                ],
                "responses": ["NutriSaas es una plataforma que te ayuda a alcanzar tus metas de nutrición con planes personalizados."]
            },
            {
                "tag": "pricing",
                "patterns": [
                    "¿Cuánto cuestan sus planes?", "Precios", "Costo", "Quiero saber los planes",
                    "Dime los planes", "Cuánto pagar", "qué planes tienen", "planes de suscripción",
                    "Cuánto vale", "Precio de los servicios", "Costos de membresía",
                    "Tarifas", "Cuánto cobra", "Precio mensual", "Precio anual",
                    "Información de precios", "Lista de precios", "Cuánto debo pagar",
                    "Costo del servicio", "Valor de la suscripción", "Precio de los planes",
                    "Cuánto cuesta el plan", "Precio del plan premium", "Plan básico precio",
                    "Costo mensual", "Costo anual", "Precio plan familiar", "Ofertas disponibles"
                ],
                "responses": ["Esta es la información sobre nuestros planes..."]
            },
            {
                "tag": "nutrition",
                "patterns": [
                    "calorías", "proteína", "carbohidratos", "vitaminas", "nutrición",
                    "quiero saber sobre dietas", "información nutricional", "macronutrientes",
                    "micronutrientes", "fibra", "grasas", "azúcares", "sodio",
                    "calcio", "hierro", "zinc", "magnesio", "potasio",
                    "vitamina C", "vitamina D", "omega 3", "antioxidantes",
                    "calorías diarias", "proteína por día", "cuánta proteína necesito",
                    "información sobre carbohidratos", "tipos de grasas", "grasas saludables"
                ],
                "responses": ["Puedo proporcionarte información sobre nutrición. ¿Sobre qué nutriente te gustaría saber más?"]
            },
            {
                "tag": "allergies",
                "patterns": [
                    "soy alérgico a", "tengo intolerancia a", "no puedo comer", "me hace daño",
                    "alergia", "intolerante", "reacción alérgica", "sensibilidad alimentaria",
                    "alérgico al gluten", "intolerancia lactosa", "alergia frutos secos",
                    "no tolero", "me causa alergia", "tengo alergia", "soy celíaco",
                    "intolerante al gluten", "alérgico mariscos", "alergia huevos",
                    "no puedo consumir", "me prohibieron comer", "evito comer",
                    "restricciones alimentarias", "alimentos prohibidos", "dieta sin gluten"
                ],
                "responses": ["Por favor, especifica tus alergias y las tendré en cuenta para tus planes de comida."]
            },
            {
                "tag": "goals",
                "patterns": [
                    "quiero bajar de peso", "subir masa muscular", "objetivos", "cómo puedo mantenerme",
                    "quiero definir mi cuerpo", "perder peso", "ganar músculo", "tonificar",
                    "adelgazar", "engordar", "aumentar masa", "definición muscular",
                    "quiero estar en forma", "mejorar mi físico", "transformar mi cuerpo",
                    "objetivo fitness", "meta de peso", "quiero marcar abdomen",
                    "desarrollar músculos", "reducir grasa", "quemar grasa",
                    "plan para adelgazar", "rutina para ganar masa", "dieta para definir"
                ],
                "responses": ["Entiendo tus objetivos. Para ayudarte, necesito saber más sobre ti. ¿Cuál es tu sexo?"]
            },
            {
                "tag": "support",
                "patterns": [
                    "necesito ayuda", "tengo un problema", "hay un error", "no funciona algo",
                    "contacto", "hablar con un asesor", "soporte técnico", "ayuda por favor",
                    "tengo dudas", "no entiendo", "no funciona", "está fallando",
                    "problema técnico", "error en la app", "no puedo acceder",
                    "solicitar ayuda", "atención al cliente", "servicio al cliente",
                    "quiero hablar con alguien", "necesito asistencia", "tengo una consulta",
                    "reportar problema", "solicitar soporte", "ayuda urgente"
                ],
                "responses": ["Veo que necesitas ayuda especializada. ¿Te gustaría hablar con uno de nuestros asesores?"]
            },
            {
                "tag": "admin_query",
                "patterns": [
                    "muéstrame las alturas de los usuarios", "dame el reporte de altura",
                    "usuarios por altura", "estadísticas de altura", "reporte usuarios",
                    "estadísticas generales", "datos de usuarios", "información administrativa",
                    "dashboard admin", "panel administrativo", "métricas usuarios",
                    "reporte completo", "estadísticas del sistema", "datos del panel",
                    "información de base de datos", "consulta administrativa"
                ],
                "responses": ["📊 Alturas registradas:"]
            },
            {
                "tag": "register",
                "patterns": [
                    "Quiero registrarme", "Crear una cuenta", "Registrarme ahora",
                    "nueva cuenta", "abrir cuenta", "inscribirme", "registro",
                    "crear perfil", "unirme", "suscribirme", "empezar",
                    "quiero comenzar", "iniciar sesión nueva", "cuenta nueva",
                    "proceso de registro", "formulario registro", "sign up",
                    "crear usuario", "nueva membresía", "activar cuenta"
                ],
                "responses": ["¡Excelente! Puedes registrarte en la página de registro."]
            },
            {
                "tag": "fallback",
                "patterns": [
                    "No entiendo", "No sé qué decir", "¿Qué significa eso?", "No entendí la pregunta",
                    "habla más claro", "no comprendo", "repite por favor", "no escuché bien",
                    "qué dijiste", "no te entiendo", "explícate mejor", "confuso",
                    "no sé", "perdón", "disculpa", "what", "huh", "eh",
                    "asdf", "test", "prueba", "123", "xyz", "random text"
                ],
                "responses": ["Una disculpa, mis habilidades no pueden solucionar esa pregunta por el momento."]
            }
        ]
    }
    
    # Save enhanced data
    with open('./data/enhanced_training_data.json', 'w', encoding='utf-8') as f:
        json.dump(enhanced_data, f, ensure_ascii=False, indent=2)
    
    print("✅ Enhanced training data saved to './data/enhanced_training_data.json'")
    
    # Count new examples
    total = 0
    for intent in enhanced_data['intents']:
        count = len(intent['patterns'])
        total += count
        print(f"  {intent['tag']:15} → {count:2} examples")
    
    print(f"\nTotal examples: {total} (vs original)")
    return enhanced_data

def create_improved_config():
    """Create an improved training configuration"""
    config = """[paths]
train = "data/train.spacy"
dev = "data/dev.spacy"

[system]
gpu_allocator = null
seed = 0

[nlp]
lang = "es"
pipeline = ["textcat"]
batch_size = 1000

[components]

[components.textcat]
factory = "textcat"

[components.textcat.model]
@architectures = "spacy.TextCatEnsemble.v2"
exclusive_classes = true
hidden_size = 128
ngram_size = 2
dropout = 0.2

[corpora]

[corpora.dev]
@readers = "spacy.Corpus.v1"
path = ${paths.dev}

[corpora.train]
@readers = "spacy.Corpus.v1"
path = ${paths.train}

[training]
seed = ${system.seed}
gpu_allocator = ${system.gpu_allocator}
dev_corpus = "corpora.dev"
train_corpus = "corpora.train"
max_epochs = 20
patience = 5

[training.optimizer]
@optimizers = "Adam.v1"
learn_rate = 0.001

[training.score_weights]
cats_score = 1.0

[initialize]
vectors = null"""

    with open('./improved_config.cfg', 'w') as f:
        f.write(config)
    
    print("✅ Improved config saved to './improved_config.cfg'")
    print("\nKey improvements:")
    print("  - Changed to TextCatEnsemble.v2 (better architecture)")
    print("  - Added hidden layer (128 neurons)")
    print("  - Increased ngram_size to 2")
    print("  - Added dropout (0.2) for regularization")
    print("  - Set max_epochs to 20 with patience")

def main():
    print("🔬 NLP Model Diagnosis and Fix")
    print("=" * 50)
    
    # Analyze current data
    analyze_training_data()
    
    print("\n" + "="*50)
    print("📝 RECOMMENDATIONS:")
    print("="*50)
    print("1. Your model has very low confidence because:")
    print("   - Too few training examples per intent")
    print("   - Simple BOW architecture")
    print("   - Possible training issues")
    print("\n2. Immediate fixes:")
    print("   - Use confidence_threshold = 0.05 in main.py")
    print("   - This will make your current model work")
    print("\n3. Long-term fixes:")
    print("   - Add more training examples (done below)")
    print("   - Use better model architecture (done below)")
    print("   - Retrain with improved config")
    
    print("\n" + "="*50)
    choice = input("Create enhanced training data and config? (y/n): ").lower()
    
    if choice == 'y':
        create_enhanced_training_data()
        create_improved_config()
        
        print("\n🚀 NEXT STEPS:")
        print("1. Update create_data.py to use enhanced_training_data.json")
        print("2. Run: python data/create_data.py")
        print("3. Train with: python -m spacy train improved_config.cfg --output ./output --paths.train ./data/train.spacy --paths.dev ./data/dev.spacy")
        print("4. Test again with the new model")
        print("\n💡 QUICK FIX for current model:")
        print("   Set confidence_threshold = 0.05 in main.py")

if __name__ == "__main__":
    main()
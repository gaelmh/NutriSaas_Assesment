# Enhanced main.py for better backend integration
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import spacy
import random
import json
import os
from typing import Optional
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Enhanced request model
class ChatRequest(BaseModel):
    message: str
    userId: Optional[str] = None
    isAdmin: Optional[bool] = False

# Enhanced response model  
class ChatResponse(BaseModel):
    response: str
    intent: str
    confidence: float

# Load training JSON file
try:
    with open(os.path.join(os.path.dirname(__file__), 'data', 'training_data.json'), 'r', encoding='utf-8') as f:
        training_data = json.load(f)
    logger.info("Training data loaded successfully")
except FileNotFoundError:
    logger.error("Training data file not found")
    training_data = {"intents": []}

# Load your trained Spanish NLP model
try:
    nlp = spacy.load("./enhanced_output/model-last")  # Adjust path to your trained model
    logger.info("Enhanced NLP model loaded successfully")
except IOError:
    logger.warning("Enhanced model not found, trying original output")
    try:
        nlp = spacy.load("./output/model-best")
        logger.info("Original NLP model loaded successfully")
    except IOError:
        logger.error("No trained model found, using fallback")
        nlp = spacy.blank("es")

# Create FastAPI app
app = FastAPI(title="NutriSaas NLP Chatbot", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4000", "http://localhost:3000"],  # Backend and frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "message": "NutriSaas NLP Chatbot API",
        "status": "running",
        "model_loaded": nlp is not None
    }

@app.get("/health")
def health_check():
    """Health check endpoint for backend monitoring"""
    return {
        "status": "healthy",
        "model_status": "loaded" if nlp else "not_loaded",
        "intents_available": len(training_data.get("intents", []))
    }

def get_intent_response(intent_tag: str, user_id: str = None, is_admin: bool = False) -> str:
    """Get appropriate response for an intent"""
    
    # Handle admin-specific responses
    if is_admin and intent_tag == "admin_query":
        return "📊 Procesando consulta administrativa..."
    
    # Handle user-specific responses
    if intent_tag == "goals" and user_id:
        return "Entiendo tus objetivos. Para ayudarte mejor, necesito saber más sobre ti. ¿Podrías contarme cuál es tu meta específica?"
    
    # Find the intent in training data
    for intent in training_data["intents"]:
        if intent["tag"] == intent_tag:
            return random.choice(intent["responses"])
    
    # Fallback response
    return "Una disculpa, mis habilidades no pueden solucionar esa pregunta por el momento."

@app.post("/chatbot", response_model=ChatResponse)
def process_message(request: ChatRequest):
    """Main chatbot endpoint with enhanced functionality"""
    
    try:
        message = request.message.strip()
        user_id = request.userId
        is_admin = request.isAdmin or False
        
        logger.info(f"Processing message: '{message}' (User: {user_id}, Admin: {is_admin})")
        
        if not message:
            return ChatResponse(
                response="Por favor, escribe un mensaje.",
                intent="fallback",
                confidence=0.0
            )
        
        # Use trained spaCy model for intent classification
        doc = nlp(message)
        
        if doc.cats:
            # Find the intent with highest probability
            predicted_intent = max(doc.cats, key=doc.cats.get)
            confidence = doc.cats[predicted_intent]
            
            # Adjusted confidence threshold based on your model performance
            confidence_threshold = 0.05  # Based on your test results
            
            if confidence < confidence_threshold:
                predicted_intent = "fallback"
                confidence = 0.0
            
            logger.info(f"Predicted intent: {predicted_intent} (confidence: {confidence:.3f})")
            
        else:
            predicted_intent = "fallback"
            confidence = 0.0
            logger.warning("No predictions available from model")
        
        # Get appropriate response
        response_text = get_intent_response(predicted_intent, user_id, is_admin)
        
        # Add personalization for logged-in users
        if user_id and predicted_intent == "greeting":
            response_text = "¡Hola de nuevo! " + response_text
        
        return ChatResponse(
            response=response_text,
            intent=predicted_intent,
            confidence=float(confidence)
        )
        
    except Exception as e:
        logger.error(f"Error processing message: {str(e)}")
        return ChatResponse(
            response="Lo siento, ocurrió un error procesando tu mensaje. Por favor inténtalo de nuevo.",
            intent="error",
            confidence=0.0
        )

@app.post("/test")
def test_model(message: str):
    """Test endpoint to check model predictions"""
    doc = nlp(message)
    
    if doc.cats:
        # Return all predictions for debugging
        predictions = [
            {"intent": intent, "confidence": float(conf)} 
            for intent, conf in sorted(doc.cats.items(), key=lambda x: x[1], reverse=True)
        ]
        return {
            "message": message,
            "predictions": predictions[:5],  # Top 5 predictions
            "top_intent": max(doc.cats, key=doc.cats.get)
        }
    else:
        return {
            "message": message,
            "predictions": [],
            "error": "No predictions available"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)

# Comments on how to activate virtual environment and run server: 
# To activate venv --> venv\Scripts\activate
# To run NLP --> uvicorn main:app --reload
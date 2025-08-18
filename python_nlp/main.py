# Import the FastAPI class to create the API instance
from fastapi import FastAPI

# Import BaseModel from pydantic for data validation and defining request body format
from pydantic import BaseModel

# Import spacy library for Natural Language Processing
import spacy

# Import random to select a response from the list of options
import random

# Import json to load the training data
import json

# Import os for file path handling
import os

# Load training JSON file
try:
    with open(os.path.join(os.path.dirname(__file__), training_data.json), 'r', encoding='utf-8') as f:
        training_data = json.load(f)
except FileNotFoundError:
    print("Error: Training data file not found.")
    data = {"intents": []}

# Load a pre-trained small English NLP model
nlp = spacy.load("en_core_web_sm")

# Define a Pydantic model for the incoming request body
class ChatRequest(BaseModel):
    message: str

# Create a FastAPI application instance
app = FastAPI()

# Define a GET endpoint for the root URL ("/") to test if the server is running
@app.get("/")
def read_root():
    return {"Hello": "World"}

# Define a POST endpoint for the "/chatbot" URL
@app.post("/chatbot")
def process_message(request: ChatRequest):
    message = request.message.lower()

    # Use a pre-trained spaCy model for text processing
    doc = nlp(message)

    # Simple keyword-based intent recognition
    if "planes" in message or "planes de comida" in message:
        intent_tag = "pricing"
    elif "nutrisaas" in message or "que es" in message:
        intent_tag = "about_nutrisaas"
    elif "preguntas" in message or "frecuentes" in message or "ayuda" in message:
        intent_tag = "faq"
    elif "contactar" in message or "asesor" in message:
        intent_tag = "contact"
    elif "registrarme" in message or "registrar" in message or "cuenta" in message:
        intent_tag = "register"
    elif "hola" in message or "hi" in message:
        intent_tag = "greeting"
    else:
        intent_tag = "fallback"

    # Find the matching intent and a random response
    for intent in data["intents"]:
        if intent["tag"] == intent_tag:
            response = random.choice(intent["responses"])
            return{"response": response}
    
    # Fallback response if no intent is matched
    return{"response": "Una disculpa, mis habilidades no pueden solucionar esa pregunta por el momento."}

# Comments on how to activate virtual environment and run server:
# To activate venv --> venv\Scripts\activate
# To run NLP --> uvicorn main:app --reload
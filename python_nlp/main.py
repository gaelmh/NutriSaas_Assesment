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
    with open(os.path.join(os.path.dirname(__file__), 'data', 'training_data.json'), 'r', encoding='utf-8') as f:
        training_data = json.load(f)
except FileNotFoundError:
    print("Error: Training data file not found.")
    training_data = {"intents": []}

# Load your trained Spanish NLP model
# Make sure to replace 'path/to/your/trained/model' with the actual path to your trained model
try:
    nlp = spacy.load("./model-best")  # Adjust path to your trained model
except IOError:
    print("Error: Trained model not found. Make sure you've trained the model first.")
    # Fallback to blank Spanish model
    nlp = spacy.blank("es")

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
    message = request.message

    # Use your trained spaCy model for intent classification
    doc = nlp(message)
    
    # Get the predicted intent from the model
    # The model returns probabilities for each category
    if doc.cats:
        # Find the intent with the highest probability
        predicted_intent = max(doc.cats, key=doc.cats.get)
        confidence = doc.cats[predicted_intent]
        
        # Set a confidence threshold (adjusted for current model performance)
        confidence_threshold = 0.05  # Lowered from 0.5 to work with current model
        
        if confidence < confidence_threshold:
            predicted_intent = "fallback"
    else:
        predicted_intent = "fallback"

    # Find the matching intent and return a random response
    for intent in training_data["intents"]:
        if intent["tag"] == predicted_intent:
            response = random.choice(intent["responses"])
            return {"response": response, "intent": predicted_intent, "confidence": confidence if 'confidence' in locals() else 0.0}
    
    # Fallback response if no intent is matched
    return {"response": "Una disculpa, mis habilidades no pueden solucionar esa pregunta por el momento.", "intent": "fallback", "confidence": 0.0}

# Comments on how to activate virtual environment and run server:
# To activate venv --> venv\Scripts\activate
# To train the model --> python -m spacy train config.cfg --output ./output --paths.train ./data/train.spacy --paths.dev ./data/dev.spacy
# To run NLP --> uvicorn main:app --reload
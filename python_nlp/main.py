# Import the FastAPI class to create the API instance
from fastapi import FastAPI

# Import BaseModel from pydantic for data validation and defining request body format
from pydantic import BaseModel

# Import spacy library for Natural Language Processing
import spacy

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
    # NLP LOGIC GOES HERE

    # SIMPLE EXAMPLE (FOR TESTING):
    # Convert the incoming message to lowercase for case-insensitive matching
    message = request.message.lower()

    # Check for specific keywords and return a predefined response
    if "hello" in message or "hi" in message:
        return {"response": "Hello! How can I help you with your nutrition goals today?"}
    elif "nutrition" in message:
        return {"response": "I can provide information about healthy eating. What would you like to know?"}
    else:
        return {"response": "I'm sorry, I don't understand that. Can you please rephrase?"}
    
# Comments on how to activate virtual environment and run server:
# To activate venv --> venv\Scripts\activate
# To run NLP --> uvicorn main:app --reload
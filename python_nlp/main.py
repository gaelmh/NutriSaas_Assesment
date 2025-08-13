from fastapi import FastAPI
from pydantic import BaseModel
import spacy

# Load your NLP model
nlp = spacy.load("en_core_web_sm")

# Define the request body format
class ChatRequest(BaseModel):
    message: str

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.post("/chatbot")
def process_message(request: ChatRequest):
    # Your NLP logic goes here!
    # For a simple example, let's just return a static response.

    # We can simulate a basic chatbot by checking for keywords
    message = request.message.lower()
    if "hello" in message or "hi" in message:
        return {"response": "Hello! How can I help you with your nutrition goals today?"}
    elif "nutrition" in message:
        return {"response": "I can provide information about healthy eating. What would you like to know?"}
    else:
        return {"response": "I'm sorry, I don't understand that. Can you please rephrase?"}
    
# To activate venv --> venv\Scripts\activate
# To run --> uvicorn main:app --reload
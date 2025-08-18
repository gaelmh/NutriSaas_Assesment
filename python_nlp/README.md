## NutriSaas: Technical Assessment NLP

### Description
This NLP service is a Python application built with FastAPI and the spaCy library. Its primary function is to process natural language messages, classify their intent, and generate appropriate responses for the NutriSaas chatbot. It is designed to work in conjunction with the main backend to provide conversational capabilities for public, private, and administrative users.

***

### Tech Stack
* **Python:** The programming language for the NLP service.
* **FastAPI:** A modern, high-performance web framework for building APIs with Python
* **spaCy:** A library for advanced natural language processing. The service uses a pre-trained Spanish model (`es`).
* **`uvicorn`:** An ASGI server that runs the FastAPI application.
* **`pydantic`:** Used for data validation and settings management.

***

### Prerequisites
To run the NLP service, you need the following installed:
* Python (v3.12 or higher).
* A Python virtual environment is highly recommended.

***

### Setup and Installation
Follow these steps to set up and run the Python NLP service:
1.  **NLP Setup**
    * Navigate to the `python_nlp` directory:
        ```bash
        cd python_nlp
        ```
    * (Optional but recommended) Create and activate a Python virtual environment:
        ```bash
        python -m venv venv
        # On Windows: venv\Scripts\activate
        # On macOS/Linux: source venv/bin/activate
        ```
    * Install the required Python packages:
        ```bash
        pip install -r requirements.txt
        ```
    * Model Training (spaCy model):
        * First, generate the training and development data files from the JSON source:
        ```bash
        python data/create_data.py
        ```
        * Then, train the model using the configuration file:
        ```bash
        python -m spacy train config.cfg --output ./output --paths.train ./data/train.spacy --paths.dev ./data/dev.spacy
        ```
        * You may also use `improved_config.cfg` for better performance after running the `model_diagnosis.py` script.
    * Start the FastAPI server:
        ```bash
        uvicorn main:app --reload
        ```
    The NLP service will be available at `http://127.0.0.1:8000`.

***

### API Endpoints
* `GET /`: A root endpoint that returns a status message to indicate the service is running.
* `GET /health`: A health check endpoint for monitoring, returning the status of the service and the model.
* `POST /chatbot`: The main endpoint for processing user messages. It accepts a JSON body with a `message` and optional `userId` and `isAdmin` flags. It returns a `ChatResponse` object containing the chatbot's response, the predicted intent, and a confidence score.
* `POST /test`: A test endpoint for debugging, which shows the top 5 predictions from the spaCy model for a given message.
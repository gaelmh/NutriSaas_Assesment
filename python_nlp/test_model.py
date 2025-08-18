# quick_test.py - Simple model testing without external dependencies
import spacy
import json

def quick_test():
    """Quick and simple model testing"""
    
    # Load model
    try:
        nlp = spacy.load("./enhanced_output/model-last")
        print("✅ Model loaded!")
    except:
        print("❌ Could not load model. Check the path.")
        return
    
    # Load training data
    try:
        with open('./data/training_data.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        print("✅ Training data loaded!")
    except:
        print("❌ Could not load training data.")
        return
    
    # Test examples
    test_messages = [
        "Hola, ¿cómo estás?",
        "¿Qué es NutriSaas?",
        "¿Cuánto cuestan los planes?",
        "Quiero bajar de peso",
        "Necesito ayuda",
        "Información sobre proteínas",
        "Buenos días",
        "Esto es una frase rara que no debería reconocer"
    ]
    
    print("\n🧪 Testing model with sample messages:")
    print("-" * 60)
    
    for message in test_messages:
        doc = nlp(message)
        
        if doc.cats:
            # Get top prediction
            top_intent = max(doc.cats, key=doc.cats.get)
            confidence = doc.cats[top_intent]
            
            # Show all predictions above 0.1
            print(f"\nMessage: '{message}'")
            print(f"🎯 Top: {top_intent} ({confidence:.3f})")
            
            # Show other high-confidence predictions
            other_predictions = [(intent, conf) for intent, conf in doc.cats.items() 
                               if conf > 0.1 and intent != top_intent]
            if other_predictions:
                other_predictions.sort(key=lambda x: x[1], reverse=True)
                print(f"📊 Others: {', '.join([f'{intent}({conf:.2f})' for intent, conf in other_predictions[:3]])}")
            
            # Threshold testing
            for threshold in [0.3, 0.5, 0.7]:
                result = top_intent if confidence >= threshold else "fallback"
                print(f"   Threshold {threshold}: {result}")
        
        print("-" * 60)
        

if __name__ == "__main__":
    quick_test()
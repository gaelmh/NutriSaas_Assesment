import spacy

# Test the new enhanced model
print("=== ENHANCED MODEL TEST ===")
nlp = spacy.load("./enhanced_output/model-last")

# Test message
doc = nlp("Hola, ¿cómo estás?")
print("Message: 'Hola, ¿cómo estás?'")
print("Raw confidence scores:")
for intent, conf in doc.cats.items():
    print(f"  {intent}: {conf:.6f}")  # Show more decimal places

print(f"\nTop prediction: {max(doc.cats, key=doc.cats.get)} ({max(doc.cats.values()):.6f})")
exit()

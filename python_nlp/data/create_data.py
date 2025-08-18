import spacy
import json
import random
from spacy.tokens import DocBin
import os

# Get the absolute path of the directory where the script is located
script_dir = os.path.dirname(os.path.abspath(__file__))
data_dir = script_dir

# Try to load enhanced training data first, fall back to original
try:
    with open(os.path.join(data_dir, 'enhanced_training_data.json'), 'r', encoding='utf-8') as f:
        data = json.load(f)
    print("✅ Using enhanced training data")
except FileNotFoundError:
    with open(os.path.join(data_dir, 'training_data.json'), 'r', encoding='utf-8') as f:
        data = json.load(f)
    print("⚠️  Using original training data (consider running model_diagnosis.py first)")

# Create a blank Spanish model
nlp = spacy.blank("es")

# Collect all unique labels first
all_labels = set()
training_data = []

for intent in data["intents"]:
    tag = intent["tag"]
    all_labels.add(tag)
    for pattern in intent["patterns"]:
        # Create a dictionary with all labels set to 0.0, then set the correct one to 1.0
        cats = {label: 0.0 for label in all_labels}
        cats[tag] = 1.0
        training_data.append((pattern, {"cats": cats}))

# Now that we have all labels, we need to update all training examples to include all labels
all_labels = list(all_labels)
print(f"Found labels: {all_labels}")

# Recreate training data with complete label sets
training_data = []
for intent in data["intents"]:
    tag = intent["tag"]
    for pattern in intent["patterns"]:
        cats = {label: 0.0 for label in all_labels}
        cats[tag] = 1.0
        training_data.append((pattern, {"cats": cats}))

# Add the textcat component and add labels
textcat = nlp.add_pipe("textcat")
for label in all_labels:
    textcat.add_label(label)

# Shuffle and split the data (80% train, 20% dev)
random.shuffle(training_data)
split_index = int(len(training_data) * 0.8)
train_set = training_data[:split_index]
dev_set = training_data[split_index:]

print(f"Total examples: {len(training_data)}")
print(f"Train set: {len(train_set)} examples")
print(f"Dev set: {len(dev_set)} examples")

# Ensure we have at least some examples in dev set
if len(dev_set) < 5:
    print("⚠️  Warning: Very small dev set. Consider adding more training data.")

# Create DocBin objects
db_train = DocBin()
db_dev = DocBin()

# Process training set
for text, annotations in train_set:
    doc = nlp.make_doc(text)
    doc.cats = annotations["cats"]
    db_train.add(doc)

# Process dev set
for text, annotations in dev_set:
    doc = nlp.make_doc(text)
    doc.cats = annotations["cats"]
    db_dev.add(doc)

# Save the DocBin objects to disk
db_train.to_disk(os.path.join(data_dir, "train.spacy"))
db_dev.to_disk(os.path.join(data_dir, "dev.spacy"))

print(f"✅ Created train.spacy with {len(train_set)} examples.")
print(f"✅ Created dev.spacy with {len(dev_set)} examples.")
print(f"Labels: {all_labels}")

# Show distribution per intent
print("\nIntent distribution:")
intent_counts = {}
for intent in data["intents"]:
    count = len(intent["patterns"])
    intent_counts[intent["tag"]] = count
    print(f"  {intent['tag']:15} → {count:2} examples")

# Check for potential issues
min_examples = min(intent_counts.values())
max_examples = max(intent_counts.values())

if min_examples < 5:
    print(f"\n⚠️  Warning: Some intents have very few examples (minimum: {min_examples})")
    print("   Consider adding more examples for better performance")

if max_examples / min_examples > 3:
    print(f"\n⚠️  Warning: Unbalanced dataset (ratio: {max_examples/min_examples:.1f}:1)")
    print("   Consider balancing the number of examples per intent")

print(f"\nReady for training! Use:")
print("python -m spacy train config.cfg --output ./output --paths.train ./data/train.spacy --paths.dev ./data/dev.spacy")
print("\nOr with improved config:")
print("python -m spacy train improved_config.cfg --output ./output --paths.train ./data/train.spacy --paths.dev ./data/dev.spacy")
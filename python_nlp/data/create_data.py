import spacy
import json
import random
from spacy.tokens import DocBin
import os

# Get the absolute path of the directory where the script is located
script_dir = os.path.dirname(os.path.abspath(__file__))
data_dir = script_dir

# Load the training data from the JSON file
with open(os.path.join(data_dir, 'training_data.json'), 'r', encoding='utf-8') as f:
    data = json.load(f)

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

# Add the textcat component and add labels (removed config parameter)
textcat = nlp.add_pipe("textcat")
for label in all_labels:
    textcat.add_label(label)

# Shuffle and split the data
random.shuffle(training_data)
split_index = int(len(training_data) * 0.8)
train_set = training_data[:split_index]
dev_set = training_data[split_index:]

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

print(f"Created train.spacy with {len(train_set)} examples.")
print(f"Created dev.spacy with {len(dev_set)} examples.")
print(f"Labels: {all_labels}")
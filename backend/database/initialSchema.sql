/* Drops tables to avoid issues */
DROP TABLE IF EXISTS user_information CASCADE; 
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS chatbot_data CASCADE;

/* Creates the users table
Will contain information about users login */
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  fullname VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP WITH TIME ZONE
);

/* Creates the user_information table
Will contain detailed profile information for signed-up users */
CREATE TABLE user_information (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  username VARCHAR(255) UNIQUE NOT NULL REFERENCES users(username) ON DELETE CASCADE,
  sex VARCHAR(50),
  age INTEGER,
  height_cm INTEGER,
  weight_kg INTEGER,
  allergies TEXT[],
  initial_info_collected BOOLEAN DEFAULT FALSE
);

/* Creates the chat_bot table
Will contain information about the chat_bot answers */
CREATE TABLE chatbot_data (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
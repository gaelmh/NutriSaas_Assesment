/* Drops tables to avoid issues */
DROP table users;
DROP table chatbot_data;

/* Creates the users table
Will contain information about users login */
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  fullname VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP WITH TIME ZONE;
);

/* Creates the chat_bot table
Will contain information about the chat_bot answers */
CREATE TABLE chatbot_data (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
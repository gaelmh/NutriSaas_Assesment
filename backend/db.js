import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Function to get user information by user_id
async function getUserInfo(userId) {
  try {
    const result = await pool.query(
      'SELECT initial_info_collected, height_cm, weight_kg, allergies FROM user_information WHERE user_id = $1',
      [userId]
    );
    return result.rows[0]; // Returns undefined if no user info found
  } catch (error) {
    console.error('Error fetching user info:', error);
    throw new Error('Could not fetch user information.');
  }
}

// Function to save initial user information (insert or update if exists)
async function saveInitialUserInfo(userId, username, height_cm, weight_kg, allergies) {
  try {
    // Check if user_information already exists for this user_id
    const existingInfo = await pool.query(
      'SELECT user_id FROM user_information WHERE user_id = $1',
      [userId]
    );

    if (existingInfo.rows.length > 0) {
      // If exists, update it
      const result = await pool.query(
        `UPDATE user_information
         SET username = $2, height_cm = $3, weight_kg = $4, allergies = $5, initial_info_collected = TRUE
         WHERE user_id = $1
         RETURNING initial_info_collected`,
        [userId, username, height_cm, weight_kg, allergies]
      );
      return result.rows[0];
    } else {
      // If not, insert new record
      const result = await pool.query(
        `INSERT INTO user_information (user_id, username, height_cm, weight_kg, allergies, initial_info_collected)
         VALUES ($1, $2, $3, $4, $5, TRUE)
         RETURNING initial_info_collected`,
        [userId, username, height_cm, weight_kg, allergies]
      );
      return result.rows[0];
    }
  } catch (error) {
    console.error('Error saving initial user info:', error);
    throw new Error('Could not save initial user information.');
  }
}

// Re-export pool and new functions
export { pool as default, getUserInfo, saveInitialUserInfo };

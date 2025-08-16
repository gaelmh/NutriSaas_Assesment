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
      'SELECT initial_info_collected, height_cm, weight_kg, allergies, sex, age FROM user_information WHERE user_id = $1',
      [userId]
    );
    const info = result.rows[0];
    if (info) {
      info.initialInfoCollected = typeof info.initial_info_collected === 'boolean' ? info.initial_info_collected : false;
      delete info.initial_info_collected;
      info.height_cm = info.height_cm;
      info.weight_kg = info.weight_kg;
      info.allergies = info.allergies;
      info.sex = info.sex;
      info.age = info.age;
      return info;
    }
    return undefined;
  } catch (error) {
    // Detailed logging for getUserInfo errors
    console.error('DB Error in getUserInfo:', error.message, error.stack);
    throw new Error('Could not fetch user information from DB.'); // Re-throw to propagate to resolver
  }
}

// Function to save initial user information (insert or update if exists)
async function saveInitialUserInfo(userId, username, height_cm, weight_kg, allergies, sex, age) {
  try {
    const existingInfo = await pool.query(
      'SELECT user_id FROM user_information WHERE user_id = $1',
      [userId]
    );

    let result;
    if (existingInfo.rows.length > 0) {
      result = await pool.query(
        `UPDATE user_information
         SET username = $2, height_cm = $3, weight_kg = $4, allergies = $5, sex = $6, age = $7, initial_info_collected = TRUE
         WHERE user_id = $1
         RETURNING initial_info_collected, height_cm, weight_kg, allergies, sex, age`,
        [userId, username, height_cm, weight_kg, allergies, sex, age]
      );
    } else {
      result = await pool.query(
        `INSERT INTO user_information (user_id, username, height_cm, weight_kg, allergies, sex, age, initial_info_collected)
         VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
         RETURNING initial_info_collected, height_cm, weight_kg, allergies, sex, age`,
        [userId, username, height_cm, weight_kg, allergies, sex, age]
      );
    }

    const savedInfo = result.rows[0];
    savedInfo.initialInfoCollected = typeof savedInfo.initial_info_collected === 'boolean' ? savedInfo.initial_info_collected : false;
    delete savedInfo.initial_info_collected;
    savedInfo.height_cm = savedInfo.height_cm;
    savedInfo.weight_kg = savedInfo.weight_kg;
    savedInfo.allergies = savedInfo.allergies;
    savedInfo.sex = savedInfo.sex;
    savedInfo.age = savedInfo.age;

    return savedInfo;

  } catch (error) {
    // Detailed logging for saveInitialUserInfo errors
    console.error('DB Error in saveInitialUserInfo:', error.message, error.stack);
    // Also log the query parameters to see if data types are an issue
    console.error('Attempted save parameters:', { userId, username, height_cm, weight_kg, allergies, sex, age });
    throw new Error('Could not save initial user information to DB.'); // Re-throw to propagate
  }
}

export { pool as default, getUserInfo, saveInitialUserInfo };
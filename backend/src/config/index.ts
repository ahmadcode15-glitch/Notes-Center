import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'al_notes_hub_jwt_secret_fallback_key_2026',
  sessionSecret: process.env.SESSION_SECRET || 'al_notes_hub_session_fallback_key_2026',
  defaultSessionDurationHours: 24,
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  apiUrl: process.env.API_URL || 'http://localhost:5000',
  storageProvider: process.env.STORAGE_PROVIDER || 'local',
  storagePath: process.env.STORAGE_PATH || './uploads',
};


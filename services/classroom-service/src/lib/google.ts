import { GoogleAuth, JWT, OAuth2Client } from 'google-auth-library';
import fs from 'fs';
import TokenModel from '../models/token';

const SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.rosters.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.students'
];

export async function getClientForUser(userId: string): Promise<OAuth2Client | null> {
  const token = await TokenModel.findOne({ userId }).sort({ createdAt: -1 }).exec();
  if (!token) return null;

  // If token expired, try to refresh it using the auth-service refresh endpoint (or using refresh token here)
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
  client.setCredentials({ access_token: token.accessToken, refresh_token: token.refreshToken, expiry_date: token.expiryDate?.getTime() });
  return client;
}

export async function getClientForServiceAccount(): Promise<JWT | null> {
  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
  if (!keyPath || !fs.existsSync(keyPath)) return null;
  const key = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  const jwtClient = new JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: SCOPES,
    subject: process.env.GOOGLE_ADMIN_EMAIL // for domain-wide delegation
  });
  await jwtClient.authorize();
  return jwtClient;
}



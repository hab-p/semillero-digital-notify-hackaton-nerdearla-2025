import { Router } from 'express';
import axios from 'axios';
import querystring from 'querystring';
import jwt from 'jsonwebtoken';
import User from '../models/user';
import TokenModel from '../models/token';

const router = Router();

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

router.get('/login', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  const scope = [
    'openid',
    'email',
    'profile',
    'https://www.googleapis.com/auth/classroom.courses.readonly',
    'https://www.googleapis.com/auth/classroom.rosters.readonly',
  ].join(' ');

  const params = querystring.stringify({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope,
    access_type: 'offline',
    prompt: 'consent'
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

router.get('/callback', async (req, res) => {
  const code = req.query.code as string;
  if (!code) return res.status(400).send('missing code');

  try {
    const tokenResp = await axios.post(GOOGLE_TOKEN_URL, querystring.stringify({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

    const { access_token, refresh_token, id_token, expires_in } = tokenResp.data;

    // Decode id_token for user info
    const decoded: any = jwt.decode(id_token);
    const email = decoded.email;
    const name = decoded.name;
    const picture = decoded.picture;

    // Upsert user
    let user = await User.findOne({ email }).exec();
    if (!user) {
      user = await User.create({ email, name, picture, googleId: decoded.sub });
    }

    // Store tokens
    await TokenModel.create({
      userId: user.id,
      accessToken: access_token,
      refreshToken: refresh_token,
      expiryDate: new Date(Date.now() + expires_in * 1000)
    });

    // Create our app JWT
    const appToken = jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });

    // Set cookie and redirect to frontend
    res.cookie('session_token', appToken, { httpOnly: true, secure: false, maxAge: 7 * 24 * 3600 * 1000 });
    return res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173');
  } catch (err) {
    console.error('oauth callback error', err);
    return res.status(500).send('oauth error');
  }
});

router.post('/refresh', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  const token = await TokenModel.findOne({ userId }).sort({ createdAt: -1 }).exec();
  if (!token || !token.refreshToken) return res.status(400).json({ error: 'no refresh token' });

  try {
    const resp = await axios.post(GOOGLE_TOKEN_URL, querystring.stringify({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: token.refreshToken,
      grant_type: 'refresh_token'
    }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

    const { access_token, expires_in } = resp.data;
    token.accessToken = access_token;
    token.expiryDate = new Date(Date.now() + expires_in * 1000);
    await token.save();

    res.json({ ok: true });
  } catch (err) {
    console.error('refresh failed', err);
    res.status(500).json({ error: 'refresh failed' });
  }
});

router.get('/me', async (req, res) => {
  const auth = req.cookies?.session_token || req.headers.authorization?.split(' ')[1];
  if (!auth) return res.status(401).json({ error: 'not authenticated' });

  try {
    const payload: any = jwt.verify(auth, process.env.JWT_SECRET || 'dev-secret');
    const user = await User.findById(payload.userId).exec();
    if (!user) return res.status(404).json({ error: 'user not found' });
    res.json({ email: user.email, name: user.name, role: user.role, picture: user.picture });
  } catch (err) {
    res.status(401).json({ error: 'invalid token' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('session_token');
  res.json({ ok: true });
});

export default router;



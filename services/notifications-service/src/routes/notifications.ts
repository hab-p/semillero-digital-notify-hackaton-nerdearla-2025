import { Router } from 'express';
import nodemailer from 'nodemailer';
import Notification from '../models/notification';
import TelegramBot from 'node-telegram-bot-api';
import Twilio from 'twilio';

const router = Router();

router.get('/health', (req, res) => res.json({ ok: true }));

router.post('/send-email', async (req, res) => {
  const { to, subject, text, html } = req.body;
  if (!to || !subject) return res.status(400).json({ error: 'to and subject required' });

  const notif = await Notification.create({ channel: 'email', to, subject, body: text });

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  try {
    await transporter.sendMail({ from: process.env.SMTP_FROM, to, subject, text, html });
    notif.status = 'sent';
    await notif.save();
    res.json({ ok: true });
  } catch (err: any) {
    notif.status = 'failed';
    notif.error = String(err.message || err);
    await notif.save();
    res.status(500).json({ error: 'send failed', details: err });
  }
});

router.post('/send-telegram', async (req, res) => {
  const { chatId, text } = req.body;
  if (!chatId || !text) return res.status(400).json({ error: 'chatId and text required' });

  const notif = await Notification.create({ channel: 'telegram', to: String(chatId), body: text });
  try {
    const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN || '', { polling: false });
    await bot.sendMessage(chatId, text);
    notif.status = 'sent';
    await notif.save();
    res.json({ ok: true });
  } catch (err: any) {
    notif.status = 'failed';
    notif.error = String(err.message || err);
    await notif.save();
    res.status(500).json({ error: 'telegram send failed' });
  }
});

router.post('/send-whatsapp', async (req, res) => {
  const { to, text } = req.body; // to must be in E.164 format
  if (!to || !text) return res.status(400).json({ error: 'to and text required' });

  const notif = await Notification.create({ channel: 'whatsapp', to, body: text });
  try {
    const client = Twilio(process.env.TWILIO_ACCOUNT_SID || '', process.env.TWILIO_AUTH_TOKEN || '');
    const message = await client.messages.create({ from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`, to: `whatsapp:${to}`, body: text });
    notif.status = 'sent';
    await notif.save();
    res.json({ ok: true, sid: message.sid });
  } catch (err: any) {
    notif.status = 'failed';
    notif.error = String(err.message || err);
    await notif.save();
    res.status(500).json({ error: 'whatsapp send failed' });
  }
});

export default router;



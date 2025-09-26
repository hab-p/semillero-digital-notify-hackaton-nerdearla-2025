import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use('/auth', createProxyMiddleware({ target: 'http://auth-service:4000', changeOrigin: true, pathRewrite: {'^/auth': '/api/auth'} }));
app.use('/classroom', createProxyMiddleware({ target: 'http://classroom-service:4000', changeOrigin: true, pathRewrite: {'^/classroom': '/api/classroom'} }));
app.use('/notifications', createProxyMiddleware({ target: 'http://notifications-service:4000', changeOrigin: true, pathRewrite: {'^/notifications': '/api/notifications'} }));

app.get('/health', (req, res) => res.json({ ok: true }));

const port = process.env.GATEWAY_PORT || 3000;
app.listen(port, () => console.log(`API Gateway running on ${port}`));



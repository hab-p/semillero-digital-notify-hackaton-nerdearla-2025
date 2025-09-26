import { Router } from 'express';
import oauthRouter from './oauth';

const router = Router();

router.use('/', oauthRouter);

router.get('/health', (req, res) => res.json({ ok: true }));

export default router;



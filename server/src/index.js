import express from 'express';
import cors from 'cors';
import { authRouter } from './auth.js';

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') ?? true }));
app.use(express.json({ limit: '10kb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);

const port = Number(process.env.API_PORT) || 4000; // not PORT: dev tooling often sets that for the web server
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));

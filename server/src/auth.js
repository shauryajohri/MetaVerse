import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findByRollNo, findById, publicUser } from './users.js';

const SECRET = process.env.JWT_SECRET ?? 'dev-only-insecure-secret';
if (!process.env.JWT_SECRET) console.warn('[auth] JWT_SECRET not set — using an insecure dev secret');

// Compared against when the roll number doesn't exist, so response time doesn't reveal valid IDs.
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser', 10);

const MAX_FAILS = 5;
const LOCK_MS = 60_000;
const fails = new Map(); // `${ip}:${rollNo}` -> { count, until }

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  const rollNo = String(req.body?.rollNo ?? '').trim().toUpperCase();
  const password = String(req.body?.password ?? '');
  if (!rollNo || !password) return res.status(400).json({ error: 'Roll number and password are required.' });

  const key = `${req.ip}:${rollNo}`;
  const now = Date.now();
  let f = fails.get(key);
  if (f?.until > now) {
    return res.status(429).json({ error: `Too many attempts. Try again in ${Math.ceil((f.until - now) / 1000)}s.` });
  }
  if (f?.until) f = undefined; // lock expired, start fresh

  const user = findByRollNo(rollNo);
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) {
    const count = (f?.count ?? 0) + 1;
    fails.set(key, { count, until: count >= MAX_FAILS ? now + LOCK_MS : 0 });
    return res.status(401).json({ error: 'Invalid roll number or password.' });
  }

  fails.delete(key);
  const token = jwt.sign({ sub: user.id, role: user.role }, SECRET, { expiresIn: '8h' });
  res.json({ token, user: publicUser(user) });
});

authRouter.get('/me', (req, res) => {
  const token = req.headers.authorization?.replace(/^Bearer /, '');
  try {
    const { sub } = jwt.verify(token ?? '', SECRET);
    const user = findById(sub);
    if (!user) throw new Error('gone');
    res.json({ user: publicUser(user) });
  } catch {
    res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
});

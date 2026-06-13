import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { readDB, writeDB, UserMeta } from '../db';
import { getJWTSecret } from '../config/jwt';

const router = Router();

// Register
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const db = await readDB();
  const existingUser = db.users.find(u => u.email === email);

  if (existingUser) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const newUser: UserMeta = {
    id: uuidv4(),
    email,
    passwordHash,
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  await writeDB(db);

  const token = jwt.sign({ id: newUser.id, email: newUser.email }, getJWTSecret(), { expiresIn: '7d' });

  res.json({ token, user: { id: newUser.id, email: newUser.email } });
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const db = await readDB();
  const user = db.users.find(u => u.email === email);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);

  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, email: user.email }, getJWTSecret(), { expiresIn: '7d' });

  res.json({ token, user: { id: user.id, email: user.email } });
});

export const authRoutes = router;

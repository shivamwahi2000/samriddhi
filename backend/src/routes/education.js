import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Placeholder routes for education
router.get('/courses', authenticateToken, async (req, res) => {
  res.json({ courses: [], message: 'Education feature coming soon' });
});

router.get('/progress', authenticateToken, async (req, res) => {
  res.json({ progress: [], message: 'Progress tracking coming soon' });
});

export default router;
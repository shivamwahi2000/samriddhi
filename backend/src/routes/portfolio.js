import express from 'express';
import { authenticateToken, requireKyc } from '../middleware/auth.js';
import { getPortfolio } from '../controllers/portfolio.js';

const router = express.Router();

// Get user portfolio
router.get('/', getPortfolio);

router.get('/transactions', authenticateToken, requireKyc, async (req, res) => {
  res.json({ transactions: [], message: 'Transaction history coming soon' });
});

export default router;
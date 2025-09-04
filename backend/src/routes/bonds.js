import express from 'express';
import { getBonds, getBondById, calculateInvestment } from '../controllers/bonds.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all bonds with filtering
router.get('/', getBonds);

// Get specific bond by ID
router.get('/:id', getBondById);

// Calculate investment returns (requires authentication)
router.post('/calculate', authenticateToken, calculateInvestment);

export default router;
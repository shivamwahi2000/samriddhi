import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import prisma from '../config/database.js';

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  res.json(req.user);
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, nameHindi, email, languagePreference } = req.body;
    
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(nameHindi && { nameHindi }),
        ...(email && { email }),
        ...(languagePreference && { languagePreference }),
      },
      select: {
        id: true,
        name: true,
        nameHindi: true,
        phone: true,
        email: true,
        userType: true,
        kycStatus: true,
        languagePreference: true,
        walletAddress: true,
      },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
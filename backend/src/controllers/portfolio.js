import prisma from '../config/database.js';
import jwt from 'jsonwebtoken';

export const getPortfolio = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    const userId = decoded.userId;

    console.log('Getting portfolio for userId:', userId);
    
    // Get user holdings with bond details
    const holdings = await prisma.holding.findMany({
      where: { 
        userId: parseInt(userId),
        isActive: true 
      },
      include: {
        bond: true
      },
      orderBy: {
        purchaseDate: 'desc'
      }
    });
    
    console.log('Found holdings:', holdings.length);

    // Calculate totals
    const totalInvested = holdings.reduce((sum, holding) => sum + holding.totalInvested, 0);
    const currentValue = holdings.reduce((sum, holding) => sum + holding.currentValue, 0);

    // Format holdings for frontend
    const formattedHoldings = holdings.map(holding => ({
      id: holding.id,
      bondName: holding.bond.bondName,
      issuer: holding.bond.issuer,
      quantity: holding.quantity,
      totalInvested: holding.totalInvested,
      currentValue: holding.currentValue,
      purchaseDate: holding.purchaseDate,
      yieldRate: holding.bond.yieldRate,
      maturityDate: holding.bond.maturityDate
    }));

    res.json({
      holdings: formattedHoldings,
      totalInvested,
      currentValue,
      profit: currentValue - totalInvested,
      profitPercentage: totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested * 100).toFixed(2) : 0
    });

  } catch (error) {
    console.error('Portfolio error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
import prisma from '../config/database.js';

export const getBonds = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      isActive = true,
      minYield,
      maxYield,
      creditRating,
      search 
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const where = {
      isActive: isActive === 'true',
      ...(minYield && { yieldRate: { gte: parseFloat(minYield) } }),
      ...(maxYield && { yieldRate: { lte: parseFloat(maxYield) } }),
      ...(creditRating && { creditRating }),
      ...(search && {
        OR: [
          { bondName: { contains: search, mode: 'insensitive' } },
          { issuer: { contains: search, mode: 'insensitive' } },
          { isin: { contains: search, mode: 'insensitive' } },
        ]
      }),
    };

    const [bonds, total] = await Promise.all([
      prisma.bond.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.bond.count({ where }),
    ]);

    res.json({
      bonds,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: bonds.length,
        totalRecords: total,
      },
    });
  } catch (error) {
    console.error('Get bonds error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getBondById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const bond = await prisma.bond.findUnique({
      where: { id: parseInt(id) },
    });

    if (!bond) {
      return res.status(404).json({ error: 'Bond not found' });
    }

    res.json(bond);
  } catch (error) {
    console.error('Get bond error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const calculateInvestment = async (req, res) => {
  try {
    const { bondId, amount } = req.body;
    
    if (!bondId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Bond ID and positive amount are required' });
    }

    const bond = await prisma.bond.findUnique({
      where: { id: parseInt(bondId) },
    });

    if (!bond || !bond.isActive) {
      return res.status(404).json({ error: 'Bond not found or inactive' });
    }

    if (amount < bond.minInvestment) {
      return res.status(400).json({ 
        error: `Minimum investment is ₹${bond.minInvestment}` 
      });
    }

    if (amount > bond.availableAmount) {
      return res.status(400).json({ 
        error: `Maximum available amount is ₹${bond.availableAmount}` 
      });
    }

    const tokens = parseFloat(amount) / parseFloat(bond.currentPrice);
    const annualInterest = (parseFloat(amount) * parseFloat(bond.yieldRate)) / 100;
    const maturityValue = parseFloat(amount) + annualInterest;

    // Calculate days to maturity
    const daysToMaturity = Math.ceil(
      (new Date(bond.maturityDate) - new Date()) / (1000 * 60 * 60 * 24)
    );

    res.json({
      investment: {
        amount: parseFloat(amount),
        tokens: parseFloat(tokens.toFixed(8)),
        currentPrice: parseFloat(bond.currentPrice),
        yieldRate: parseFloat(bond.yieldRate),
        annualInterest: parseFloat(annualInterest.toFixed(2)),
        maturityValue: parseFloat(maturityValue.toFixed(2)),
        daysToMaturity,
        maturityDate: bond.maturityDate,
      },
      bond: {
        id: bond.id,
        name: bond.bondName,
        issuer: bond.issuer,
        creditRating: bond.creditRating,
      },
    });
  } catch (error) {
    console.error('Calculate investment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
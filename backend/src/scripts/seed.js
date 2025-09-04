import prisma from '../config/database.js';

async function seedBonds() {
  // Sample bond data for demo
  const sampleBonds = [
    {
      issuer: 'HDFC Bank',
      issuerHindi: 'एचडीएफसी बैंक',
      bondName: 'HDFC Bank Corporate Bond 2024',
      isin: 'INE040A08025',
      faceValue: 1000,
      currentPrice: 102.50,
      yieldRate: 8.75,
      creditRating: 'AAA',
      maturityDate: new Date('2029-12-31'),
      issueDate: new Date('2024-01-01'),
      totalAmount: 10000000,
      availableAmount: 8500000,
      minInvestment: 100,
      isActive: true,
    },
    {
      issuer: 'Tata Steel',
      issuerHindi: 'टाटा स्टील',
      bondName: 'Tata Steel Infrastructure Bond 2024',
      isin: 'INE081A08027',
      faceValue: 1000,
      currentPrice: 98.75,
      yieldRate: 9.25,
      creditRating: 'AA+',
      maturityDate: new Date('2027-06-30'),
      issueDate: new Date('2024-02-01'),
      totalAmount: 5000000,
      availableAmount: 3200000,
      minInvestment: 100,
      isActive: true,
    },
    {
      issuer: 'ICICI Bank',
      issuerHindi: 'आईसीआईसीआई बैंक',
      bondName: 'ICICI Bank Growth Bond 2024',
      isin: 'INE090A08031',
      faceValue: 1000,
      currentPrice: 101.25,
      yieldRate: 8.50,
      creditRating: 'AAA',
      maturityDate: new Date('2028-03-31'),
      issueDate: new Date('2024-03-01'),
      totalAmount: 15000000,
      availableAmount: 12000000,
      minInvestment: 100,
      isActive: true,
    },
  ];

  console.log('🌱 Seeding bonds...');
  
  for (const bond of sampleBonds) {
    await prisma.bond.upsert({
      where: { isin: bond.isin },
      update: bond,
      create: bond,
    });
  }

  console.log(`✅ Seeded ${sampleBonds.length} bonds`);
}

async function main() {
  try {
    console.log('🚀 Starting database seeding...');
    
    await seedBonds();
    
    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
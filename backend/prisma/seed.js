import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding demo data...');

  // Create demo bonds
  const bonds = await Promise.all([
    prisma.bond.create({
      data: {
        issuer: 'HDFC Bank Ltd.',
        issuerHindi: 'एचडीएफसी बैंक लिमिटेड',
        bondName: 'HDFC Bank 8.5% Bond 2027',
        isin: 'INE040A08024',
        faceValue: 1000,
        currentPrice: 950,
        yieldRate: 8.5,
        creditRating: 'AAA',
        maturityDate: new Date('2027-03-15'),
        issueDate: new Date('2024-03-15'),
        totalAmount: 10000000,
        availableAmount: 8500000,
        minInvestment: 100,
      }
    }),
    prisma.bond.create({
      data: {
        issuer: 'Tata Steel Ltd.',
        issuerHindi: 'टाटा स्टील लिमिटेड',
        bondName: 'Tata Steel 7.8% Bond 2026',
        isin: 'INE081A08033',
        faceValue: 1000,
        currentPrice: 985,
        yieldRate: 7.8,
        creditRating: 'AA+',
        maturityDate: new Date('2026-12-20'),
        issueDate: new Date('2024-01-20'),
        totalAmount: 5000000,
        availableAmount: 3200000,
        minInvestment: 100,
      }
    }),
    prisma.bond.create({
      data: {
        issuer: 'Infosys Ltd.',
        issuerHindi: 'इंफोसिस लिमिटेड',
        bondName: 'Infosys 6.9% Bond 2025',
        isin: 'INE009A08041',
        faceValue: 1000,
        currentPrice: 1020,
        yieldRate: 6.9,
        creditRating: 'AAA',
        maturityDate: new Date('2025-09-30'),
        issueDate: new Date('2023-09-30'),
        totalAmount: 7500000,
        availableAmount: 4100000,
        minInvestment: 100,
      }
    }),
    prisma.bond.create({
      data: {
        issuer: 'Bharti Airtel Ltd.',
        issuerHindi: 'भारती एयरटेल लिमिटेड',
        bondName: 'Bharti Airtel 8.2% Bond 2028',
        isin: 'INE397D08019',
        faceValue: 1000,
        currentPrice: 975,
        yieldRate: 8.2,
        creditRating: 'AA',
        maturityDate: new Date('2028-06-15'),
        issueDate: new Date('2024-06-15'),
        totalAmount: 6000000,
        availableAmount: 5800000,
        minInvestment: 100,
      }
    }),
    prisma.bond.create({
      data: {
        issuer: 'Reliance Industries Ltd.',
        issuerHindi: 'रिलायंस इंडस्ट्रीज लिमिटेड',
        bondName: 'RIL 7.5% Bond 2029',
        isin: 'INE002A08052',
        faceValue: 1000,
        currentPrice: 1000,
        yieldRate: 7.5,
        creditRating: 'AAA',
        maturityDate: new Date('2029-11-10'),
        issueDate: new Date('2024-11-10'),
        totalAmount: 12000000,
        availableAmount: 11500000,
        minInvestment: 100,
      }
    })
  ]);

  // Create a demo user
  const demoUser = await prisma.user.create({
    data: {
      name: 'Demo User',
      nameHindi: 'डेमो उपयोगकर्ता',
      phone: '+919999999999',
      email: 'demo@samriddhi.com',
      userType: 'individual',
      kycStatus: 'verified',
      languagePreference: 'en',
    }
  });

  // Create a demo SHG
  const demoShg = await prisma.shg.create({
    data: {
      name: 'Aarogya Women SHG',
      nameHindi: 'आरोग्य महिला स्वयं सहायता समूह',
      leaderUserId: demoUser.id,
      totalMembers: 12,
      votingThreshold: 0.67,
      location: 'Village Rampur, Uttar Pradesh',
      registrationNumber: 'SHG-UP-2024-001',
    }
  });

  // Add SHG membership
  await prisma.shgMember.create({
    data: {
      shgId: demoShg.id,
      userId: demoUser.id,
      role: 'leader',
    }
  });

  // Create some demo holdings
  await prisma.holding.create({
    data: {
      userId: demoUser.id,
      bondId: bonds[0].id,
      quantity: 5,
      averagePrice: 950,
      totalInvested: 4750,
      currentValue: 4750,
    }
  });

  await prisma.holding.create({
    data: {
      userId: demoUser.id,
      bondId: bonds[2].id,
      quantity: 3,
      averagePrice: 1020,
      totalInvested: 3060,
      currentValue: 3060,
    }
  });

  console.log('✅ Demo data seeded successfully!');
  console.log(`📊 Created ${bonds.length} bonds`);
  console.log(`👤 Created demo user: ${demoUser.phone}`);
  console.log(`🤝 Created SHG: ${demoShg.name}`);
  console.log(`💰 Created 2 holdings with total investment: ₹7,810`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
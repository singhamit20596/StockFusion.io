const fs = require('fs').promises;
const path = require('path');

/**
 * Seed script to populate the database with sample data
 */
async function seedDatabase() {
  console.log('Starting database seed...');
  
  try {
    const dataDir = path.join(__dirname, 'data');
    
    // Read seed data
    const seedAccounts = JSON.parse(await fs.readFile(path.join(dataDir, 'seed-accounts.json'), 'utf8'));
    const seedStocks = JSON.parse(await fs.readFile(path.join(dataDir, 'seed-stocks.json'), 'utf8'));
    const seedPortfolios = JSON.parse(await fs.readFile(path.join(dataDir, 'seed-portfolios.json'), 'utf8'));
    const seedPortfolioAccounts = JSON.parse(await fs.readFile(path.join(dataDir, 'seed-portfolio-accounts.json'), 'utf8'));
    
    // Write to actual data files
    await fs.writeFile(path.join(dataDir, 'accounts.json'), JSON.stringify(seedAccounts, null, 2));
    console.log('✅ Accounts seeded');
    
    await fs.writeFile(path.join(dataDir, 'stocks.json'), JSON.stringify(seedStocks, null, 2));
    console.log('✅ Stocks seeded');
    
    await fs.writeFile(path.join(dataDir, 'portfolios.json'), JSON.stringify(seedPortfolios, null, 2));
    console.log('✅ Portfolios seeded');
    
    await fs.writeFile(path.join(dataDir, 'portfolio_accounts.json'), JSON.stringify(seedPortfolioAccounts, null, 2));
    console.log('✅ Portfolio accounts seeded');
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log(`📊 Data summary:`);
    console.log(`   - ${seedAccounts.length} accounts`);
    console.log(`   - ${seedStocks.length} stocks`);
    console.log(`   - ${seedPortfolios.length} portfolios`);
    console.log(`   - ${seedPortfolioAccounts.length} portfolio-account associations`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;

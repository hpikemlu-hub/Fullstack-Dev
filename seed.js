require('dotenv').config();
const database = require('./src/config/database');
const SeedData = require('./src/utils/seedData');

const seedDatabase = async () => {
    try {
        console.log('Initializing database...');
        await database.initialize();
        
        console.log('Seeding data...');
        await SeedData.seedAll();
        
        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedDatabase();
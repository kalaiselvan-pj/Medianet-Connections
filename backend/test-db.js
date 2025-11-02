import db from './config/db.js';

async function testDatabase() {
    try {
        db.connectDB(); // connect to MySQL

        // Test which database is connected and count rows in login table
        const result = await db.query('SELECT DATABASE() as db, COUNT(*) as users FROM login');
        console.log('Database connected:', result[0].db);
        console.log('Number of users in login table:', result[0].users);
    } catch (err) {
        console.error('Error:', err.message);
    }
}

testDatabase();

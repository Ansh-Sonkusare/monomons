import { db } from './src/db';
import { bets } from './src/db/schema';

async function resetDatabase() {
    console.log('Resetting database...\n');
    
    // Delete all bets
    await db.delete(bets);
    console.log('✓ All bets cleared\n');
    
    // Verify
    const count = await db.query.bets.findMany();
    console.log(`Bets remaining: ${count.length}`);
    
    process.exit(0);
}

resetDatabase().catch(e => {
    console.error('Error:', e);
    process.exit(1);
});

import { db } from './src/db';
import { bets } from './src/db/schema';

async function checkDatabase() {
    console.log('Checking database...\n');
    
    // Get all bets
    const allBets = await db.query.bets.findMany();
    console.log(`Total bets in database: ${allBets.length}\n`);
    
    if (allBets.length > 0) {
        console.log('Sample bet:');
        console.log(allBets[0]);
        console.log('\nAll bets:');
        allBets.forEach((bet, i) => {
            console.log(`${i + 1}. Room: ${bet.roomId} | Choice: ${bet.choice} | Amount: ${bet.amount} | Status: ${bet.status} | User: ${bet.userAddress}`);
        });
    }
    
    // Get pending bets specifically
    const pendingBets = await db.query.bets.findMany({
        where: (bets, { eq }) => eq(bets.status, 'pending')
    });
    console.log(`\nPending bets: ${pendingBets.length}`);
    
    process.exit(0);
}

checkDatabase().catch(e => {
    console.error('Error:', e);
    process.exit(1);
});

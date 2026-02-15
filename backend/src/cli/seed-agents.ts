import { db } from '../db';
import { aiAgents } from '../db/schema';

const agents = [
  {
    name: 'Alpha Bot',
    strategyType: 'alpha',
    avatarColor: '#FF4444',
  },
  {
    name: 'Beta Trader',
    strategyType: 'beta',
    avatarColor: '#4444FF',
  },
  {
    name: 'Gamma Predictor',
    strategyType: 'gamma',
    avatarColor: '#44FF44',
  },
  {
    name: 'Delta Oracle',
    strategyType: 'delta',
    avatarColor: '#FFAA00',
  },
];

async function seedAgents() {
  console.log('🌱 Seeding AI agents...');

  for (const agent of agents) {
    const existing = await db.query.aiAgents.findFirst({
      where: (agents, { eq }) => eq(agents.strategyType, agent.strategyType),
    });

    if (existing) {
      console.log(`⏭️  ${agent.name} already exists, skipping`);
      continue;
    }

    const [created] = await db.insert(aiAgents).values(agent).returning();
    console.log(`✅ Created ${created.name} (${created.strategyType})`);
  }

  console.log('🎉 Agents seeded successfully!');
  process.exit(0);
}

seedAgents().catch((error) => {
  console.error('❌ Failed to seed agents:', error);
  process.exit(1);
});

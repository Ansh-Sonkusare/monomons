import { Elysia, t } from 'elysia';
import { RollService } from '../services/roll.service';

const RARITY_ODDS = [
  { rarity: 'common', odds: 50, characterCost: '0.1', cardCost: '0.05' },
  { rarity: 'uncommon', odds: 30, characterCost: '0.25', cardCost: '0.1' },
  { rarity: 'rare', odds: 15, characterCost: '0.5', cardCost: '0.25' },
  { rarity: 'epic', odds: 4, characterCost: '1', cardCost: '0.5' },
  { rarity: 'legendary', odds: 1, characterCost: '5', cardCost: '2' }
];

export const rollRoutes = new Elysia({ prefix: '/roll' })
  .get('/odds', () => {
    return {
      character: RARITY_ODDS.map(r => ({
        rarity: r.rarity,
        odds: r.odds,
        cost: r.characterCost + ' MON'
      })),
      card: RARITY_ODDS.map(r => ({
        rarity: r.rarity,
        odds: r.odds,
        cost: r.cardCost + ' MON'
      }))
    };
  })
  .post('/character', async ({ body }) => {
    const { userAddress, vrfRequestId, txHash, fee } = body as {
      userAddress: string;
      vrfRequestId: string;
      txHash: string;
      fee: string;
    };
    
    const roll = await RollService.createRoll(
      userAddress,
      'character',
      vrfRequestId,
      txHash,
      fee
    );
    
    return { success: true, roll };
  }, {
    body: t.Object({
      userAddress: t.String(),
      vrfRequestId: t.String(),
      txHash: t.String(),
      fee: t.String()
    })
  })
  .post('/card', async ({ body }) => {
    const { userAddress, vrfRequestId, txHash, fee } = body as {
      userAddress: string;
      vrfRequestId: string;
      txHash: string;
      fee: string;
    };
    
    const roll = await RollService.createRoll(
      userAddress,
      'card',
      vrfRequestId,
      txHash,
      fee
    );
    
    return { success: true, roll };
  }, {
    body: t.Object({
      userAddress: t.String(),
      vrfRequestId: t.String(),
      txHash: t.String(),
      fee: t.String()
    })
  })
  .post('/fulfill', async ({ body }) => {
    const { vrfRequestId, rarity, tokenId, txHash } = body as {
      vrfRequestId: string;
      rarity: string;
      tokenId: number;
      txHash: string;
    };
    
    const result = await RollService.fulfillRoll(vrfRequestId, rarity, tokenId, txHash);
    
    return { success: true, result };
  }, {
    body: t.Object({
      vrfRequestId: t.String(),
      rarity: t.String(),
      tokenId: t.Number(),
      txHash: t.String()
    })
  })
  .get('/history/:address', async ({ params }) => {
    const history = await RollService.getRollHistory(params.address);
    return { success: true, history };
  })
  .get('/inventory/:address', async ({ params }) => {
    const inventory = await RollService.getInventory(params.address);
    return { success: true, inventory };
  })
  .get('/team/:address', async ({ params }) => {
    const team = await RollService.getUserTeam(params.address);
    return { success: true, team };
  })
  .post('/team/:address', async ({ body, params }) => {
    const { characterIds } = body as { characterIds: string[] };
    await RollService.setUserTeam(params.address, characterIds);
    return { success: true };
  }, {
    body: t.Object({
      characterIds: t.Array(t.String())
    })
  });

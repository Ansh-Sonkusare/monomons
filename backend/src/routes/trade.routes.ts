import { Elysia, t } from 'elysia';
import { db } from '../db';
import { trades, characters, cards } from '../db/schema';
import { eq, and, or } from 'drizzle-orm';

export const tradeRoutes = new Elysia({ prefix: '/trade' })
  .post('/list', async ({ body }) => {
    const { sellerAddress, itemType, itemId, tokenId, price } = body as {
      sellerAddress: string;
      itemType: 'character' | 'card';
      itemId: string;
      tokenId: number;
      price: string;
    };

    const table = itemType === 'character' ? characters : cards;
    
    const [item] = await db.select().from(table).where(eq(table.tokenId, tokenId));
    if (!item || item.ownerAddress !== sellerAddress.toLowerCase()) {
      return { success: false, error: 'Item not owned by seller' };
    }

    const [trade] = await db.insert(trades).values({
      sellerAddress: sellerAddress.toLowerCase(),
      itemType,
      itemId,
      tokenId,
      price,
      status: 'open'
    }).returning();

    return { success: true, trade };
  }, {
    body: t.Object({
      sellerAddress: t.String(),
      itemType: t.Union([t.Literal('character'), t.Literal('card')]),
      itemId: t.String(),
      tokenId: t.Number(),
      price: t.String()
    })
  })
  .post('/buy', async ({ body }) => {
    const { buyerAddress, tradeId } = body as {
      buyerAddress: string;
      tradeId: string;
    };

    const [trade] = await db.select().from(trades).where(eq(trades.id, tradeId));
    
    if (!trade || trade.status !== 'open') {
      return { success: false, error: 'Trade not available' };
    }

    if (trade.sellerAddress === buyerAddress.toLowerCase()) {
      return { success: false, error: 'Cannot buy your own item' };
    }

    const table = trade.itemType === 'character' ? characters : cards;

    await db.update(table)
      .set({ ownerAddress: buyerAddress.toLowerCase() })
      .where(eq(table.tokenId, trade.tokenId));

    await db.update(trades)
      .set({ 
        status: 'completed', 
        buyerAddress: buyerAddress.toLowerCase(),
        completedAt: new Date()
      })
      .where(eq(trades.id, tradeId));

    return { success: true };
  }, {
    body: t.Object({
      buyerAddress: t.String(),
      tradeId: t.String()
    })
  })
  .post('/cancel', async ({ body }) => {
    const { sellerAddress, tradeId } = body as {
      sellerAddress: string;
      tradeId: string;
    };

    const [trade] = await db.select().from(trades).where(
      and(
        eq(trades.id, tradeId),
        eq(trades.sellerAddress, sellerAddress.toLowerCase())
      )
    );

    if (!trade || trade.status !== 'open') {
      return { success: false, error: 'Trade not found or cannot be cancelled' };
    }

    await db.update(trades)
      .set({ status: 'cancelled' })
      .where(eq(trades.id, tradeId));

    return { success: true };
  }, {
    body: t.Object({
      sellerAddress: t.String(),
      tradeId: t.String()
    })
  })
  .get('/market', async () => {
    const openTrades = await db.select().from(trades)
      .where(eq(trades.status, 'open'))
      .orderBy(trades.createdAt);
    
    return { success: true, trades: openTrades };
  })
  .get('/user/:address', async ({ params }) => {
    const userTrades = await db.select().from(trades)
      .where(or(
        eq(trades.sellerAddress, params.address.toLowerCase()),
        eq(trades.buyerAddress, params.address.toLowerCase())
      ))
      .orderBy(trades.createdAt);
    
    return { success: true, trades: userTrades };
  });

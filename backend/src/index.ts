import { Elysia } from 'elysia'
import { staticPlugin } from '@elysiajs/static'
import { openapi, fromTypes } from '@elysiajs/openapi'
import { cors } from '@elysiajs/cors'
import { authRoutes } from './routes/auth.routes'
import { gameRoutes } from './routes/game.routes'
import { betRoutes } from './routes/bet.routes'
import { tradingRoutes } from './routes/trading.routes'
import { adminRoutes } from './routes/admin.routes'
import { AutoBattlerByRoom } from './services/battle.service'
import { wsService } from './services/websocket.service'
import { priceService } from './services/price.service'

export const app = new Elysia()
	.use(cors({
		origin: true,
		credentials: true,
	}))
	.use(
		openapi({
			references: fromTypes()
		})
	)
	.use(authRoutes)
	.use(gameRoutes)
	.use(betRoutes)
	.use(tradingRoutes)
	.use(adminRoutes)
	// WebSocket route for trading updates
	.ws('/ws/trading', {
		open(ws) {
			console.log('🔌 WebSocket client connected:', ws.remoteAddress);
			ws.data.subscribedRounds = new Set();
			wsService.addClient(ws);
			ws.send(JSON.stringify({ event: 'connected', data: { message: 'Welcome to trading WebSocket' } }));
		},
		message(ws, message) {
			try {
				const data = JSON.parse(message as string);
				if (data.action === 'subscribe' && data.roundId) {
					wsService.subscribeToRound(ws, data.roundId);
				} else if (data.action === 'unsubscribe' && data.roundId) {
					wsService.unsubscribeFromRound(ws, data.roundId);
				}
			} catch (error) {
				console.error('WebSocket message error:', error);
			}
		},
		close(ws) {
			wsService.removeClient(ws);
		},
	})
	.use(
		await staticPlugin({
			prefix: '/'
		})
	)
	.get('/message', { message: 'Hello from server' } as const)
	.listen(8080)

if (app.server) {
	AutoBattlerByRoom.setServer(app.server);
}

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
)
console.log(`📡 WebSocket available at ws://${app.server?.hostname}:${app.server?.port}/ws/trading`)

// Connect to Binance WebSocket for price data
priceService.connect().then(() => {
	console.log('✅ Price service connected to Binance')
}).catch(err => {
	console.error('❌ Failed to connect price service:', err)
})


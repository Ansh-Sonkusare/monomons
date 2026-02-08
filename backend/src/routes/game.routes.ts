import { Elysia } from "elysia";
import { AuthService } from "../services/auth.service";
import { playerStateManager, type PlayerPosition } from "../services/player.service";
import { AutoBattlerByRoom } from "../services/battle.service";

interface WebSocketData {
  playerId?: string;
  userId?: string;
  address?: string;
  roomId?: string;
  sessionId?: string;
}



export const gameRoutes = new Elysia()
  .ws("/ws/game", {
    async open(ws) {
      console.log("WebSocket connection opened");
      // Initialize our custom fields
      Object.assign(ws.data as any, { playerId: undefined, userId: undefined, address: undefined });
    },

    async message(ws, rawMessage) {
      try {
        const message = typeof rawMessage === 'string'
          ? JSON.parse(rawMessage)
          : rawMessage;

        // Use ws.data directly
        // Cast to any to avoid type issues if not strictly typed
        const wsData = (ws.data as any);

        switch (message.type) {
          case "auth": {
            const { token } = message;
            const userData = AuthService.verifyToken(token);

            if (!userData) {
              console.log("Token verification failed for token:", token);
              ws.send(
                JSON.stringify({
                  type: "error",
                  error: "Invalid token",
                })
              );
              ws.close();
              return;
            }

            console.log("Token verified for user:", userData.address);

            const player = await playerStateManager.getOrCreatePlayer(
              userData.address,
              userData.address
            );

            // Store in ws.data
            wsData.playerId = player.id;
            wsData.userId = player.userId;
            wsData.address = player.address;
            wsData.sessionId = player.sessionId;

            // Subscribe FIRST before sending any messages
            ws.subscribe("game");

            ws.send(
              JSON.stringify({
                type: "auth_success",
                player: {
                  id: player.id,
                  address: player.address,
                  username: player.username,
                  position: player.position,
                },
                onlinePlayers: playerStateManager.getOnlinePlayers(),
              })
            );

            // Broadcast new player joined to all others (after subscription)
            ws.publish(
              "game",
              JSON.stringify({
                type: "player_joined",
                player: {
                  id: player.id,
                  address: player.address,
                  username: player.username,
                  position: player.position,
                },
              })
            );

            break;
          }

          case "move": {
            const { playerId } = wsData;

            if (!playerId) {
              console.log("Move received but no playerId found in ws.data for this connection.");
              ws.send(
                JSON.stringify({
                  type: "error",
                  error: "Not authenticated",
                })
              );
              return;
            }

            const position: PlayerPosition = message.position;
            await playerStateManager.updatePlayerPosition(playerId, position);

            ws.publish(
              "game",
              JSON.stringify({
                type: "player_moved",
                playerId,
                position,
              })
            );
            break;
          }

          case "join_room": {
            const { playerId } = wsData;
            const { roomId } = message;

            if (!playerId) return;

            wsData.roomId = roomId;
            playerStateManager.setPlayerRoom(playerId, roomId);
            
            // Sub to room channel
            ws.subscribe(`room:${roomId}`);
            
            // Notify others in room
            ws.publish(
              `room:${roomId}`,
              JSON.stringify({
                type: "room_player_joined",
                player: playerStateManager.getPlayer(playerId)
              })
            );

            // Send current room players to joining user
            const roomPlayers = playerStateManager.getPlayersInRoom(roomId);
            ws.send(JSON.stringify({
              type: "room_state",
              players: roomPlayers
            }));

            // Initialize or Retrieve Battle for this room
            const battle = AutoBattlerByRoom.getOrCreate(roomId);
            ws.send(JSON.stringify({
              type: "battle_state",
              state: battle.state
            }));
            
            break;
          }

          case "chat_message": {
             const { playerId, roomId } = wsData;
             if (!playerId || !roomId) return;
             
             const player = playerStateManager.getPlayer(playerId);

             // Echo back to sender too (since publish excludes sender usually in some impls, but assume pub/sub)
             // Actually ws.publish in Elysia/Bun usually excludes sender. We should send to self manually or rely on UI optimistic update?
             // Let's send to all in room including sender via individual send? No, broadcast to room.
             // We can just send to self manually.
             
             const msgPayload = {
               type: "room_message",
               message: {
                 id: Date.now().toString() + "-" + Math.random().toString(36).substr(2, 9),
                 senderId: playerId,
                 senderName: player?.username || player?.address,
                 text: message.text,
                 timestamp: Date.now()
               }
             };

             ws.publish(`room:${roomId}`, JSON.stringify(msgPayload));
             ws.send(JSON.stringify(msgPayload)); // Echo to self
             break;
          }

          default:
            console.log("Unknown message type:", message.type);
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
        ws.send(
          JSON.stringify({
            type: "error",
            error: "Failed to process message",
          })
        );
      }
    },

    async close(ws) {
      const wsData = (ws.data as any);
      if (wsData?.playerId) {
        await playerStateManager.removePlayer(wsData.playerId, wsData.sessionId);

        // Broadcast player left (only if actually removed? removePlayer doesn't return bool yet, but assuming check passed)
        const stillOnline = playerStateManager.getPlayer(wsData.playerId);
        if (!stillOnline) {
             ws.publish(
              "game",
              JSON.stringify({
                type: "player_left",
                playerId: wsData.playerId,
              })
            );

            if (wsData.roomId) {
                 ws.publish(
                  `room:${wsData.roomId}`,
                  JSON.stringify({
                    type: "room_player_left",
                    playerId: wsData.playerId,
                  })
                );
            }
        }
      }
      console.log("WebSocket connection closed");
    },
  });

import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { getDataStore } from '../db/fileDataStore';
import { chatService } from '../services/chatService';
import { 
  ChatMessage, 
  ChatConversation, 
  CallSession, 
  ChatPrivacySettings 
} from '../../src/types';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  isAlive?: boolean;
  activeConversationId?: string;
}

export class ChatSocketServer {
  private static instance: ChatSocketServer | null = null;
  private wss: WebSocketServer | null = null;
  private userSockets: Map<string, Set<AuthenticatedWebSocket>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  static getInstance(): ChatSocketServer {
    if (!ChatSocketServer.instance) {
      ChatSocketServer.instance = new ChatSocketServer();
    }
    return ChatSocketServer.instance;
  }

  initialize(httpServer: HttpServer) {
    this.wss = new WebSocketServer({ 
      server: httpServer,
      path: '/ws'
    });

    console.log('[RAVINI Realtime] WebSocket Server mounted at /ws on port 3000');

    this.wss.on('connection', (ws: AuthenticatedWebSocket, req) => {
      ws.isAlive = true;

      // Extract userId from query parameter if present: /ws?userId=...
      const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
      const queryUserId = url.searchParams.get('userId');
      if (queryUserId) {
        this.registerUserSocket(queryUserId, ws);
      }

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', async (data) => {
        try {
          const payload = JSON.parse(data.toString());
          await this.handleClientMessage(ws, payload);
        } catch (err: any) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message payload',
            error: err.message
          }));
        }
      });

      ws.on('close', () => {
        if (ws.userId) {
          this.removeUserSocket(ws.userId, ws);
        }
      });

      ws.on('error', (err) => {
        console.error('[RAVINI Realtime] Socket error:', err.message);
      });
    });

    // Heartbeat ping every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      if (!this.wss) return;
      this.wss.clients.forEach((client) => {
        const authWs = client as AuthenticatedWebSocket;
        if (authWs.isAlive === false) {
          return authWs.terminate();
        }
        authWs.isAlive = false;
        authWs.ping();
      });
    }, 30000);
  }

  // --- Socket Registration & User Presence ---
  private registerUserSocket(userId: string, ws: AuthenticatedWebSocket) {
    ws.userId = userId;
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(ws);

    // Send connection acknowledgement
    ws.send(JSON.stringify({
      type: 'auth_success',
      userId,
      timestamp: new Date().toISOString()
    }));

    // Broadcast online status to contacts
    this.broadcastPresence(userId, true);
  }

  private removeUserSocket(userId: string, ws: AuthenticatedWebSocket) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(ws);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
        // User is now offline, broadcast last seen
        this.broadcastPresence(userId, false);
      }
    }
  }

  private async broadcastPresence(userId: string, isOnline: boolean) {
    const dataStore = getDataStore();
    const privacy = await dataStore.getUserPrivacySettings(userId);
    if (!privacy.showOnlineStatus && isOnline) return;

    const payload = JSON.stringify({
      type: 'presence_update',
      userId,
      isOnline,
      lastSeen: new Date().toISOString()
    });

    // Notify all participants in conversations with this user
    const convs = await dataStore.getConversations(userId);
    const peerIds = new Set<string>();
    convs.forEach(c => {
      c.participantIds.forEach(pid => {
        if (pid !== userId) peerIds.add(pid);
      });
    });

    peerIds.forEach(pid => {
      this.sendToUser(pid, payload);
    });
  }

  // --- Message Handling ---
  private async handleClientMessage(ws: AuthenticatedWebSocket, payload: any) {
    const dataStore = getDataStore();

    switch (payload.type) {
      // 1. Authenticate Socket
      case 'auth': {
        const { userId } = payload;
        if (!userId) {
          return ws.send(JSON.stringify({ type: 'error', message: 'Missing userId for auth' }));
        }
        const user = await dataStore.getUserById(userId);
        if (!user) {
          return ws.send(JSON.stringify({ type: 'error', message: 'User not found or revoked' }));
        }
        this.registerUserSocket(userId, ws);
        break;
      }

      // 2. Set Active Conversation (for auto-mark read)
      case 'set_active_conversation': {
        ws.activeConversationId = payload.conversationId;
        if (payload.conversationId && ws.userId) {
          await chatService.markConversationRead(payload.conversationId, ws.userId);
        }
        break;
      }

      // 3. Send Message
      case 'send_message': {
        if (!ws.userId) {
          return ws.send(JSON.stringify({ type: 'error', message: 'Unauthenticated socket' }));
        }

        try {
          const result = await chatService.sendMessage({
            senderId: ws.userId,
            receiverId: payload.receiverId,
            conversationId: payload.conversationId,
            groupId: payload.groupId,
            content: payload.content || '',
            mediaUrl: payload.mediaUrl,
            mediaType: payload.mediaType,
            mediaName: payload.mediaName,
            mediaSize: payload.mediaSize,
            location: payload.location,
            contact: payload.contact,
            replyTo: payload.replyTo,
            forwarded: payload.forwarded,
            forwardedFrom: payload.forwardedFrom,
            idempotencyKey: payload.idempotencyKey
          });

          // Confirm to sender
          ws.send(JSON.stringify({
            type: 'message_sent',
            message: result.message,
            conversation: result.conversation,
            tempId: payload.tempId
          }));

          // Deliver in realtime to recipients
          const recipients = result.conversation.participantIds.filter(id => id !== ws.userId);
          let anyRecipientOnline = false;

          for (const recipientId of recipients) {
            const delivered = this.sendToUser(recipientId, JSON.stringify({
              type: 'new_message',
              message: result.message,
              conversation: result.conversation
            }));

            if (delivered) {
              anyRecipientOnline = true;
              // Mark delivered immediately in backend
              await chatService.markDelivered(result.message.id, recipientId);
            }
          }

          // If at least one recipient received via active socket, notify sender that it's delivered
          if (anyRecipientOnline) {
            ws.send(JSON.stringify({
              type: 'message_delivered',
              messageId: result.message.id,
              deliveredAt: new Date().toISOString()
            }));
          }
        } catch (err: any) {
          ws.send(JSON.stringify({
            type: 'message_failed',
            tempId: payload.tempId,
            error: err.message
          }));
        }
        break;
      }

      // 4. Message Delivered Ack from Client
      case 'message_delivered_ack': {
        if (!ws.userId || !payload.messageId) return;
        const updated = await chatService.markDelivered(payload.messageId, ws.userId);
        if (updated && updated.senderId) {
          this.sendToUser(updated.senderId, JSON.stringify({
            type: 'message_delivered',
            messageId: updated.id,
            deliveredAt: updated.deliveredAt
          }));
        }
        break;
      }

      // 5. Message Read
      case 'mark_read': {
        if (!ws.userId || !payload.conversationId) return;
        const { updatedCount, messageIds } = await chatService.markConversationRead(payload.conversationId, ws.userId);
        const conv = await dataStore.getConversationById(payload.conversationId);
        
        if (conv) {
          const peers = conv.participantIds.filter(id => id !== ws.userId);
          peers.forEach(peerId => {
            this.sendToUser(peerId, JSON.stringify({
              type: 'messages_read',
              conversationId: payload.conversationId,
              readerId: ws.userId,
              messageIds,
              readAt: new Date().toISOString()
            }));
          });
        }
        break;
      }

      // 6. Typing Indicators
      case 'typing_start':
      case 'typing_stop': {
        if (!ws.userId || !payload.conversationId) return;
        const conv = await dataStore.getConversationById(payload.conversationId);
        if (!conv) return;

        const sender = await dataStore.getUserById(ws.userId);
        const typingPayload = JSON.stringify({
          type: payload.type,
          conversationId: payload.conversationId,
          userId: ws.userId,
          userName: sender?.name || 'Mtumiaji'
        });

        conv.participantIds.filter(id => id !== ws.userId).forEach(peerId => {
          this.sendToUser(peerId, typingPayload);
        });
        break;
      }

      // 7. Message Reactions
      case 'reaction': {
        if (!ws.userId || !payload.messageId || !payload.emoji) return;
        const msg = await dataStore.getMessageById(payload.messageId);
        if (!msg) return;

        msg.reactions = msg.reactions || {};
        const emojiList = msg.reactions[payload.emoji] || [];
        const userIdx = emojiList.indexOf(ws.userId);

        if (userIdx >= 0) {
          emojiList.splice(userIdx, 1);
        } else {
          emojiList.push(ws.userId);
        }

        if (emojiList.length === 0) {
          delete msg.reactions[payload.emoji];
        } else {
          msg.reactions[payload.emoji] = emojiList;
        }

        await dataStore.updateMessage(msg.id, { reactions: msg.reactions });

        // Broadcast reaction update
        const conv = msg.conversationId ? await dataStore.getConversationById(msg.conversationId) : null;
        const participants = conv ? conv.participantIds : [msg.senderId, msg.receiverId];

        const reactionEvent = JSON.stringify({
          type: 'message_reaction_updated',
          messageId: msg.id,
          conversationId: msg.conversationId,
          reactions: msg.reactions,
          actorId: ws.userId
        });

        participants.forEach(pid => {
          this.sendToUser(pid, reactionEvent);
        });
        break;
      }

      // 8. Edit Message
      case 'edit_message': {
        if (!ws.userId || !payload.messageId || !payload.newContent) return;
        const msg = await dataStore.getMessageById(payload.messageId);
        if (!msg || msg.senderId !== ws.userId) {
          return ws.send(JSON.stringify({ type: 'error', message: 'Huwezi kuhariri ujumbe huu' }));
        }

        const updated = await dataStore.updateMessage(msg.id, {
          content: payload.newContent,
          isEdited: true,
          editedAt: new Date().toISOString()
        });

        if (updated) {
          const conv = updated.conversationId ? await dataStore.getConversationById(updated.conversationId) : null;
          const participants = conv ? conv.participantIds : [updated.senderId, updated.receiverId];

          const editEvent = JSON.stringify({
            type: 'message_edited',
            message: updated
          });

          participants.forEach(pid => {
            this.sendToUser(pid, editEvent);
          });
        }
        break;
      }

      // 9. Delete Message
      case 'delete_message': {
        if (!ws.userId || !payload.messageId) return;
        const msg = await dataStore.getMessageById(payload.messageId);
        if (!msg) return;

        // Check if author or group admin
        let allowed = msg.senderId === ws.userId;
        if (!allowed && msg.conversationId) {
          const conv = await dataStore.getConversationById(msg.conversationId);
          if (conv && (conv.groupAdminIds || []).includes(ws.userId)) {
            allowed = true;
          }
        }

        if (!allowed) {
          return ws.send(JSON.stringify({ type: 'error', message: 'Huna ruhusa ya kufuta ujumbe huu' }));
        }

        await dataStore.deleteMessage(msg.id, ws.userId, !!payload.forEveryone);

        const conv = msg.conversationId ? await dataStore.getConversationById(msg.conversationId) : null;
        const participants = conv ? conv.participantIds : [msg.senderId, msg.receiverId];

        const deleteEvent = JSON.stringify({
          type: 'message_deleted',
          messageId: msg.id,
          conversationId: msg.conversationId,
          forEveryone: !!payload.forEveryone,
          deletedBy: ws.userId
        });

        participants.forEach(pid => {
          this.sendToUser(pid, deleteEvent);
        });
        break;
      }

      // 10. WebRTC Voice / Video Call Signaling
      case 'call_initiate': {
        if (!ws.userId || !payload.receiverId || !payload.callType) return;

        const caller = await dataStore.getUserById(ws.userId);
        const receiver = await dataStore.getUserById(payload.receiverId);
        if (!caller || !receiver) return;

        // Check global communication control policy
        const callService = payload.callType === 'video' ? 'videoCalls' : 'voiceCalls';
        const commPerm = await dataStore.isCommunicationServiceAllowed(callService, caller.role);
        if (!commPerm.allowed) {
          return ws.send(JSON.stringify({
            type: 'call_failed',
            reason: commPerm.reason || 'Huduma ya simu imezimwa kwa muda na Msimamizi Mkuu.'
          }));
        }

        // Check permissions and blocking
        const isBlocked = await dataStore.isUserBlocked(ws.userId, payload.receiverId);
        if (isBlocked) {
          return ws.send(JSON.stringify({
            type: 'call_failed',
            reason: 'Mtumiaji huyu amekuzuia au amezuiliwa.'
          }));
        }

        const sessionId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        
        // STUN/TURN audit: Public Google STUN is configured, external TURN checked from env
        const turnConfigured = !!(process.env.TURN_SERVER_URL && process.env.TURN_CREDENTIAL);

        const callSession: CallSession = {
          id: sessionId,
          type: payload.callType,
          callerId: ws.userId,
          callerName: caller.name,
          callerAvatar: caller.avatar,
          receiverId: payload.receiverId,
          receiverName: receiver.name,
          receiverAvatar: receiver.avatar,
          status: 'ringing',
          startedAt: new Date().toISOString(),
          stunTurnConfigured: turnConfigured
        };

        await dataStore.saveCallSession(callSession);

        // Notify caller
        ws.send(JSON.stringify({
          type: 'call_ringing',
          session: callSession,
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            ...(turnConfigured ? [{ urls: process.env.TURN_SERVER_URL!, credential: process.env.TURN_CREDENTIAL }] : [])
          ]
        }));

        // Notify receiver
        const delivered = this.sendToUser(payload.receiverId, JSON.stringify({
          type: 'incoming_call',
          session: callSession,
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            ...(turnConfigured ? [{ urls: process.env.TURN_SERVER_URL!, credential: process.env.TURN_CREDENTIAL }] : [])
          ]
        }));

        if (!delivered) {
          // Receiver offline: mark as missed call after short timeout
          setTimeout(async () => {
            const current = (await dataStore.getCallSessions(ws.userId!)).find(s => s.id === sessionId);
            if (current && current.status === 'ringing') {
              await dataStore.updateCallSession(sessionId, { status: 'missed' });
              ws.send(JSON.stringify({
                type: 'call_missed',
                sessionId,
                reason: 'Mtumiaji hajapatikana'
              }));
            }
          }, 15000);
        }
        break;
      }

      case 'call_accept': {
        if (!ws.userId || !payload.sessionId) return;
        const dataStore = getDataStore();
        const session = (await dataStore.getCallSessions(ws.userId)).find(s => s.id === payload.sessionId);
        if (!session) return;

        const updated = await dataStore.updateCallSession(payload.sessionId, {
          status: 'connected',
          connectedAt: new Date().toISOString()
        });

        // Notify caller that call was accepted
        this.sendToUser(session.callerId, JSON.stringify({
          type: 'call_accepted',
          session: updated
        }));
        break;
      }

      case 'call_decline': {
        if (!ws.userId || !payload.sessionId) return;
        const session = (await dataStore.getCallSessions(ws.userId)).find(s => s.id === payload.sessionId);
        if (!session) return;

        await dataStore.updateCallSession(payload.sessionId, {
          status: 'declined',
          endedAt: new Date().toISOString()
        });

        this.sendToUser(session.callerId, JSON.stringify({
          type: 'call_declined',
          sessionId: payload.sessionId
        }));
        break;
      }

      case 'call_end': {
        if (!ws.userId || !payload.sessionId) return;
        const session = (await dataStore.getCallSessions(ws.userId)).find(s => s.id === payload.sessionId);
        if (!session) return;

        const endedAt = new Date().toISOString();
        let durationSeconds = 0;
        if (session.connectedAt) {
          durationSeconds = Math.round((new Date(endedAt).getTime() - new Date(session.connectedAt).getTime()) / 1000);
        }

        await dataStore.updateCallSession(payload.sessionId, {
          status: 'ended',
          endedAt,
          durationSeconds
        });

        const peerId = session.callerId === ws.userId ? session.receiverId : session.callerId;
        this.sendToUser(peerId, JSON.stringify({
          type: 'call_ended',
          sessionId: payload.sessionId,
          durationSeconds
        }));
        break;
      }

      // 11. WebRTC Signaling Dispatch (offer, answer, candidate)
      case 'webrtc_signal': {
        if (!ws.userId || !payload.targetUserId || !payload.data) return;
        // Verify target user is connected and forward the signal
        this.sendToUser(payload.targetUserId, JSON.stringify({
          type: 'webrtc_signal',
          senderUserId: ws.userId,
          sessionId: payload.sessionId,
          data: payload.data
        }));
        break;
      }

      // 12. Reconnect Sync
      case 'sync_missed_messages': {
        if (!ws.userId) return;
        const sinceTimestamp = payload.sinceTimestamp || new Date(0).toISOString();
        const convs = await dataStore.getConversations(ws.userId);
        
        let allNewMessages: ChatMessage[] = [];
        for (const c of convs) {
          const msgs = await dataStore.getMessages(c.id);
          const filtered = msgs.filter(m => new Date(m.createdAt).getTime() > new Date(sinceTimestamp).getTime());
          allNewMessages.push(...filtered);
        }

        ws.send(JSON.stringify({
          type: 'sync_missed_messages_response',
          messages: allNewMessages,
          conversations: convs,
          syncedAt: new Date().toISOString()
        }));
        break;
      }

      default:
        console.warn('[RAVINI Realtime] Unknown event type:', payload.type);
    }
  }

  // --- Send to User Helper ---
  sendToUser(userId: string, data: string): boolean {
    const sockets = this.userSockets.get(userId);
    if (!sockets || sockets.size === 0) return false;

    let sent = false;
    sockets.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
        sent = true;
      }
    });
    return sent;
  }

  broadcastAll(eventPayload: string | object) {
    const raw = typeof eventPayload === 'string' ? eventPayload : JSON.stringify(eventPayload);
    if (!this.wss) return;
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(raw);
      }
    });
  }

  broadcastToUsers(userIds: string[], eventPayload: string | object) {
    const raw = typeof eventPayload === 'string' ? eventPayload : JSON.stringify(eventPayload);
    userIds.forEach(uid => this.sendToUser(uid, raw));
  }

  disconnectUser(userId: string, reason?: string): boolean {
    const sockets = this.userSockets.get(userId);
    if (!sockets || sockets.size === 0) return false;

    const payload = JSON.stringify({
      type: 'FORCE_LOGOUT',
      userId,
      reason: reason || 'Msimamizi Mkuu amekatisha kipindi hiki.',
      timestamp: new Date().toISOString()
    });

    sockets.forEach(ws => {
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(payload);
          ws.close(4001, reason || 'Session terminated');
        }
      } catch (e) {
        console.warn('Error closing socket for user', userId, e);
      }
    });

    this.userSockets.delete(userId);
    this.broadcastPresence(userId, false);
    return true;
  }

  disconnectAllExcept(exemptUserId?: string, reason?: string): number {
    let count = 0;
    const payload = JSON.stringify({
      type: 'FORCE_LOGOUT',
      reason: reason || 'Msimamizi Mkuu amefunga vipindi vyote vya mfumo.',
      timestamp: new Date().toISOString()
    });

    this.userSockets.forEach((sockets, uid) => {
      if (exemptUserId && uid === exemptUserId) return;
      sockets.forEach(ws => {
        try {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(payload);
            ws.close(4001, reason || 'System-wide session reset');
          }
        } catch (e) {
          console.warn('Error closing socket for user', uid, e);
        }
      });
      this.userSockets.delete(uid);
      this.broadcastPresence(uid, false);
      count++;
    });

    return count;
  }

  isUserOnline(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return !!sockets && sockets.size > 0;
  }

  sendPushNotification(userId: string, notification: {
    id?: string;
    title: string;
    message: string;
    type?: string;
    url?: string;
    relatedId?: string;
  }) {
    const sockets = this.userSockets.get(userId);
    const payload = JSON.stringify({
      type: 'PUSH_NOTIFICATION',
      notification: {
        id: notification.id || `push_${Date.now()}`,
        title: notification.title,
        message: notification.message,
        body: notification.message,
        type: notification.type || 'SYSTEM',
        url: notification.url || '/',
        relatedId: notification.relatedId,
        timestamp: new Date().toISOString()
      }
    });

    if (sockets && sockets.size > 0) {
      sockets.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(payload);
        }
      });
    }
  }

  broadcastPushNotification(notification: {
    title: string;
    message: string;
    type?: string;
    url?: string;
  }) {
    if (!this.wss) return;
    const payload = JSON.stringify({
      type: 'PUSH_NOTIFICATION',
      notification: {
        id: `push_broadcast_${Date.now()}`,
        title: notification.title,
        message: notification.message,
        body: notification.message,
        type: notification.type || 'ANNOUNCEMENT',
        url: notification.url || '/',
        timestamp: new Date().toISOString()
      }
    });

    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }
}

export const chatSocketServer = ChatSocketServer.getInstance();

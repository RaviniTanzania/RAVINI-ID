import { ChatMessage, ChatConversation, CallSession } from '../../types';

export type RealtimeConnectionState = 'connected' | 'connecting' | 'reconnecting' | 'disconnected';

export interface RealtimeMessageEvent {
  type: 'new_message' | 'message_sent' | 'message_delivered' | 'messages_read' | 'message_edited' | 'message_deleted' | 'message_reaction_updated' | 'typing_start' | 'typing_stop' | 'presence_update' | 'incoming_call' | 'call_ringing' | 'call_accepted' | 'call_declined' | 'call_ended' | 'call_missed' | 'call_failed' | 'webrtc_signal' | 'sync_missed_messages_response';
  [key: string]: any;
}

export class ChatRealtimeClient {
  private static instance: ChatRealtimeClient | null = null;
  private ws: WebSocket | null = null;
  private currentUserId: string | null = null;
  private state: RealtimeConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: any = null;
  private heartbeatTimer: any = null;
  private listeners: Map<string, Set<(event: RealtimeMessageEvent) => void>> = new Map();
  private stateListeners: Set<(state: RealtimeConnectionState) => void> = new Set();
  private lastReceivedTimestamp: string = new Date(0).toISOString();
  private unsentQueue: Array<{ payload: any; resolve: (val: any) => void; reject: (err: any) => void }> = [];

  // WebRTC
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private activeCallSession: CallSession | null = null;
  private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;

  static getInstance(): ChatRealtimeClient {
    if (!ChatRealtimeClient.instance) {
      ChatRealtimeClient.instance = new ChatRealtimeClient();
    }
    return ChatRealtimeClient.instance;
  }

  // --- Connection Management ---
  connect(userId: string) {
    if (this.currentUserId === userId && (this.state === 'connected' || this.state === 'connecting')) {
      return;
    }

    this.currentUserId = userId;
    this.reconnectAttempts = 0;
    this.establishConnection();
  }

  private establishConnection() {
    if (!this.currentUserId) return;

    this.updateState(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting');

    try {
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      const wsProtocol = isHttps ? 'wss:' : 'ws:';
      const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
      const wsUrl = `${wsProtocol}//${host}/ws?userId=${this.currentUserId}`;

      if (this.ws) {
        this.ws.onclose = null;
        this.ws.onerror = null;
        this.ws.onmessage = null;
        this.ws.close();
      }

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.updateState('connected');

        // Authenticate
        this.sendRaw({
          type: 'auth',
          userId: this.currentUserId
        });

        // Request missed messages since last disconnect
        if (this.lastReceivedTimestamp !== new Date(0).toISOString()) {
          this.sendRaw({
            type: 'sync_missed_messages',
            sinceTimestamp: this.lastReceivedTimestamp
          });
        }

        // Flush unsent messages queue
        this.flushUnsentQueue();
      };

      this.ws.onmessage = (event) => {
        try {
          const payload: RealtimeMessageEvent = JSON.parse(event.data);
          this.handleIncomingEvent(payload);
        } catch (err) {
          console.error('[RAVINI Realtime Client] Parse error:', err);
        }
      };

      this.ws.onclose = (event) => {
        this.updateState('disconnected');
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.warn('[RAVINI Realtime Client] Socket error, reconnecting...');
      };
    } catch (err) {
      this.updateState('disconnected');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (!this.currentUserId) return;

    // Exponential backoff: 1s, 2s, 4s, max 15s
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 15000);
    this.reconnectAttempts++;
    this.updateState('reconnecting');

    this.reconnectTimer = setTimeout(() => {
      this.establishConnection();
    }, delay);
  }

  disconnect() {
    this.currentUserId = null;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.cleanupWebRTC();
    this.updateState('disconnected');
  }

  private updateState(newState: RealtimeConnectionState) {
    if (this.state !== newState) {
      this.state = newState;
      this.stateListeners.forEach(fn => fn(newState));
    }
  }

  getState(): RealtimeConnectionState {
    return this.state;
  }

  onStateChange(fn: (state: RealtimeConnectionState) => void): () => void {
    this.stateListeners.add(fn);
    fn(this.state);
    return () => this.stateListeners.delete(fn);
  }

  // --- Event Handling ---
  subscribe(eventType: string, handler: (event: RealtimeMessageEvent) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(handler);
    return () => {
      this.listeners.get(eventType)?.delete(handler);
    };
  }

  private handleIncomingEvent(event: RealtimeMessageEvent) {
    // Track last timestamp for reconnect sync
    if (event.message?.createdAt) {
      this.lastReceivedTimestamp = event.message.createdAt;
    }

    // WebRTC routing
    if (event.type === 'webrtc_signal') {
      this.handleWebRTCSignal(event);
    }

    const handlers = this.listeners.get(event.type);
    if (handlers) {
      handlers.forEach(h => h(event));
    }

    // Global listeners
    const wildcard = this.listeners.get('*');
    if (wildcard) {
      wildcard.forEach(h => h(event));
    }
  }

  // --- Send Message over WebSocket with Offline Safety ---
  sendMessage(params: {
    receiverId?: string;
    conversationId?: string;
    groupId?: string;
    content: string;
    mediaUrl?: string;
    mediaType?: ChatMessage['mediaType'];
    mediaName?: string;
    mediaSize?: number;
    location?: ChatMessage['location'];
    contact?: ChatMessage['contact'];
    replyTo?: ChatMessage['replyTo'];
    forwarded?: boolean;
    forwardedFrom?: string;
    idempotencyKey?: string;
  }): Promise<{ message: ChatMessage; conversation: ChatConversation }> {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const idempotencyKey = params.idempotencyKey || `idem_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const payload = {
      type: 'send_message',
      tempId,
      idempotencyKey,
      ...params
    };

    return new Promise((resolve, reject) => {
      if (this.state === 'connected' && this.ws?.readyState === WebSocket.OPEN) {
        // Setup one-shot confirmation listener
        const unsubscribeSent = this.subscribe('message_sent', (event) => {
          if (event.tempId === tempId) {
            unsubscribeSent();
            unsubscribeFailed();
            resolve({ message: event.message, conversation: event.conversation });
          }
        });

        const unsubscribeFailed = this.subscribe('message_failed', (event) => {
          if (event.tempId === tempId) {
            unsubscribeSent();
            unsubscribeFailed();
            reject(new Error(event.error || 'Message failed to send'));
          }
        });

        this.sendRaw(payload);
      } else {
        // Queue for safe delivery upon reconnect
        this.unsentQueue.push({ payload, resolve, reject });
      }
    });
  }

  private flushUnsentQueue() {
    while (this.unsentQueue.length > 0) {
      const item = this.unsentQueue.shift();
      if (!item) break;
      const { payload, resolve, reject } = item;

      const unsubscribeSent = this.subscribe('message_sent', (event) => {
        if (event.tempId === payload.tempId) {
          unsubscribeSent();
          unsubscribeFailed();
          resolve({ message: event.message, conversation: event.conversation });
        }
      });

      const unsubscribeFailed = this.subscribe('message_failed', (event) => {
        if (event.tempId === payload.tempId) {
          unsubscribeSent();
          unsubscribeFailed();
          reject(new Error(event.error || 'Message failed to send'));
        }
      });

      this.sendRaw(payload);
    }
  }

  sendRaw(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    }
    return false;
  }

  // --- Realtime Actions ---
  setActiveConversation(conversationId: string) {
    this.sendRaw({
      type: 'set_active_conversation',
      conversationId
    });
  }

  markDelivered(messageId: string) {
    this.sendRaw({
      type: 'message_delivered_ack',
      messageId
    });
  }

  markRead(conversationId: string) {
    this.sendRaw({
      type: 'mark_read',
      conversationId
    });
  }

  startTyping(conversationId: string) {
    this.sendRaw({
      type: 'typing_start',
      conversationId
    });
  }

  stopTyping(conversationId: string) {
    this.sendRaw({
      type: 'typing_stop',
      conversationId
    });
  }

  reactToMessage(messageId: string, emoji: string) {
    this.sendRaw({
      type: 'reaction',
      messageId,
      emoji
    });
  }

  editMessage(messageId: string, newContent: string) {
    this.sendRaw({
      type: 'edit_message',
      messageId,
      newContent
    });
  }

  deleteMessage(messageId: string, forEveryone: boolean) {
    this.sendRaw({
      type: 'delete_message',
      messageId,
      forEveryone
    });
  }

  // --- WebRTC Voice / Video Call Engine ---
  async initiateCall(receiverId: string, callType: 'voice' | 'video', onRemoteStream: (stream: MediaStream) => void): Promise<void> {
    this.onRemoteStreamCallback = onRemoteStream;

    // Acquire camera / microphone stream
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video'
      });
    } catch (err: any) {
      console.error('Failed to get media devices:', err);
      throw new Error(`Media access denied: ${err.message}`);
    }

    this.sendRaw({
      type: 'call_initiate',
      receiverId,
      callType
    });
  }

  async acceptCall(session: CallSession, onRemoteStream: (stream: MediaStream) => void): Promise<void> {
    this.activeCallSession = session;
    this.onRemoteStreamCallback = onRemoteStream;

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: session.type === 'video'
      });
    } catch (err: any) {
      console.error('Failed to get user media for call acceptance:', err);
      throw new Error(`Media access denied: ${err.message}`);
    }

    this.sendRaw({
      type: 'call_accept',
      sessionId: session.id
    });

    await this.setupPeerConnection(session.callerId, session.id, false);
  }

  declineCall(sessionId: string) {
    this.sendRaw({
      type: 'call_decline',
      sessionId
    });
    this.cleanupWebRTC();
  }

  endCall(sessionId: string) {
    this.sendRaw({
      type: 'call_end',
      sessionId
    });
    this.cleanupWebRTC();
  }

  private async setupPeerConnection(targetUserId: string, sessionId: string, isInitiator: boolean) {
    const config: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    };

    this.peerConnection = new RTCPeerConnection(config);

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection?.addTrack(track, this.localStream!);
      });
    }

    this.peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        if (this.onRemoteStreamCallback) {
          this.onRemoteStreamCallback(event.streams[0]);
        }
      }
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendRaw({
          type: 'webrtc_signal',
          targetUserId,
          sessionId,
          data: {
            candidate: event.candidate
          }
        });
      }
    };

    if (isInitiator) {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      this.sendRaw({
        type: 'webrtc_signal',
        targetUserId,
        sessionId,
        data: {
          sdp: offer
        }
      });
    }
  }

  private async handleWebRTCSignal(event: RealtimeMessageEvent) {
    if (!this.peerConnection) {
      if (event.senderUserId && event.sessionId) {
        await this.setupPeerConnection(event.senderUserId, event.sessionId, false);
      }
    }

    if (!this.peerConnection) return;

    if (event.data?.sdp) {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(event.data.sdp));
      if (event.data.sdp.type === 'offer') {
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        this.sendRaw({
          type: 'webrtc_signal',
          targetUserId: event.senderUserId,
          sessionId: event.sessionId,
          data: {
            sdp: answer
          }
        });
      }
    } else if (event.data?.candidate) {
      try {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(event.data.candidate));
      } catch (e) {
        console.warn('Error adding ICE candidate:', e);
      }
    }
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  toggleAudio(enabled?: boolean): boolean {
    if (!this.localStream) return false;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = enabled !== undefined ? enabled : !audioTrack.enabled;
      return audioTrack.enabled;
    }
    return false;
  }

  toggleVideo(enabled?: boolean): boolean {
    if (!this.localStream) return false;
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = enabled !== undefined ? enabled : !videoTrack.enabled;
      return videoTrack.enabled;
    }
    return false;
  }

  private cleanupWebRTC() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.remoteStream = null;
    this.activeCallSession = null;
    this.onRemoteStreamCallback = null;
  }
}

export const chatRealtimeClient = ChatRealtimeClient.getInstance();

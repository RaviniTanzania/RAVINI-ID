import { getDataStore } from '../db/fileDataStore';
import { 
  ChatMessage, 
  ChatConversation, 
  MessageRequest, 
  ChatPrivacySettings, 
  CallSession, 
  User,
  AuditLog
} from '../../src/types';

export class ChatService {
  private static instance: ChatService | null = null;

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  // --- Authorization & Privacy Checks ---
  async canUserMessageRecipient(senderId: string, receiverId: string): Promise<{ allowed: boolean; reason?: string; requiresRequest?: boolean }> {
    const dataStore = getDataStore();
    
    // Check blocking
    const isBlocked = await dataStore.isUserBlocked(senderId, receiverId);
    if (isBlocked) {
      return { allowed: false, reason: 'BLOCKED_BY_USER' };
    }

    // Check receiver's privacy settings
    const privacy = await dataStore.getUserPrivacySettings(receiverId);
    if (privacy.whoCanMessageMe === 'nobody') {
      return { allowed: false, reason: 'RECIPIENT_DOES_NOT_ACCEPT_MESSAGES' };
    }

    // Check if following, followed by, or existing conversation
    const sender = await dataStore.getUserById(senderId);
    const receiver = await dataStore.getUserById(receiverId);
    if (!sender || !receiver) {
      return { allowed: false, reason: 'USER_NOT_FOUND' };
    }

    const isFollowingOrFollower = (sender.followingUsers || []).includes(receiverId) || (receiver.followingUsers || []).includes(senderId);
    if (privacy.whoCanMessageMe === 'friends_only' && !isFollowingOrFollower) {
      // Check if existing accepted message request exists
      const requests = await dataStore.getMessageRequests(receiverId);
      const acceptedReq = requests.find(r => r.senderId === senderId && r.status === 'accepted');
      if (!acceptedReq) {
        return { allowed: true, requiresRequest: true, reason: 'REQUIRES_MESSAGE_REQUEST' };
      }
    }

    return { allowed: true };
  }

  // --- Send Message ---
  async sendMessage(params: {
    senderId: string;
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
  }): Promise<{ message: ChatMessage; conversation: ChatConversation; isRequest?: boolean }> {
    const dataStore = getDataStore();
    const sender = await dataStore.getUserById(params.senderId);
    if (!sender) throw new Error('Sender not found');

    // Global Communication Control Enforcement
    const requiredService = params.groupId ? 'groupChat' : (params.mediaUrl ? 'mediaSharing' : 'chat');
    const commPerm = await dataStore.isCommunicationServiceAllowed(requiredService, sender.role);
    if (!commPerm.allowed) {
      throw new Error(commPerm.reason || 'Huduma ya mawasiliano imezimwa kwa muda na Msimamizi Mkuu.');
    }

    let conv: ChatConversation;

    if (params.groupId) {
      const groupConv = await dataStore.getConversationById(params.groupId);
      if (!groupConv) throw new Error('Group conversation not found');
      if (!groupConv.participantIds.includes(params.senderId)) {
        throw new Error('Not a member of this group');
      }
      if (groupConv.onlyAdminsCanPost && !(groupConv.groupAdminIds || []).includes(params.senderId)) {
        throw new Error('Only admins can send messages in this group');
      }
      conv = groupConv;
    } else if (params.conversationId) {
      const existingConv = await dataStore.getConversationById(params.conversationId);
      if (!existingConv) throw new Error('Conversation not found');
      if (!existingConv.participantIds.includes(params.senderId)) {
        throw new Error('Unauthorized conversation access');
      }
      conv = existingConv;
    } else if (params.receiverId) {
      // Check permissions
      const check = await this.canUserMessageRecipient(params.senderId, params.receiverId);
      if (!check.allowed) {
        throw new Error(check.reason || 'Not allowed to message this user');
      }

      conv = await dataStore.getOrCreateDirectConversation(params.senderId, params.receiverId);

      if (check.requiresRequest) {
        // Create or update pending message request
        const reqId = `req_${params.senderId}_${params.receiverId}`;
        await dataStore.saveMessageRequest({
          id: reqId,
          senderId: params.senderId,
          senderName: sender.name,
          senderAvatar: sender.avatar,
          senderRaviniId: sender.raviniId,
          receiverId: params.receiverId,
          status: 'pending',
          initialMessage: params.content,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    } else {
      throw new Error('Missing conversation, receiver, or group target');
    }

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const newMsg: ChatMessage = {
      id: messageId,
      senderId: params.senderId,
      receiverId: params.receiverId || '',
      conversationId: conv.id,
      groupId: params.groupId,
      content: params.content,
      createdAt: new Date().toISOString(),
      read: false,
      status: 'sent',
      mediaUrl: params.mediaUrl,
      mediaType: params.mediaType,
      mediaName: params.mediaName,
      mediaSize: params.mediaSize,
      location: params.location,
      contact: params.contact,
      replyTo: params.replyTo,
      forwarded: params.forwarded,
      forwardedFrom: params.forwardedFrom,
      idempotencyKey: params.idempotencyKey
    };

    const saved = await dataStore.saveMessage(newMsg);
    const updatedConv = await dataStore.getConversationById(conv.id) || conv;

    return { message: saved, conversation: updatedConv };
  }

  // --- Mark Messages Delivered ---
  async markDelivered(messageId: string, recipientId: string): Promise<ChatMessage | null> {
    const dataStore = getDataStore();
    const msg = await dataStore.getMessageById(messageId);
    if (!msg || msg.status === 'read' || msg.status === 'delivered') return msg;

    return await dataStore.updateMessage(messageId, {
      status: 'delivered',
      deliveredAt: new Date().toISOString()
    });
  }

  // --- Mark Messages Read ---
  async markConversationRead(conversationId: string, readerId: string): Promise<{ updatedCount: number; messageIds: string[] }> {
    const dataStore = getDataStore();
    const conv = await dataStore.getConversationById(conversationId);
    if (!conv) return { updatedCount: 0, messageIds: [] };

    // Reset unread count for reader
    conv.unreadCounts[readerId] = 0;
    await dataStore.updateConversation(conv.id, { unreadCounts: conv.unreadCounts });

    // Mark unread messages in conversation as read
    const messages = await dataStore.getMessages(conversationId);
    const unreadMsgs = messages.filter(m => m.senderId !== readerId && !m.read);
    const readAt = new Date().toISOString();

    for (const m of unreadMsgs) {
      await dataStore.updateMessage(m.id, {
        read: true,
        status: 'read',
        readAt
      });
    }

    return { updatedCount: unreadMsgs.length, messageIds: unreadMsgs.map(m => m.id) };
  }

  // --- Group Chat Management ---
  async createGroup(params: {
    creatorId: string;
    groupName: string;
    groupDescription?: string;
    groupPhoto?: string;
    memberIds: string[];
    onlyAdminsCanPost?: boolean;
  }): Promise<ChatConversation> {
    const dataStore = getDataStore();
    const creator = await dataStore.getUserById(params.creatorId);
    if (!creator) throw new Error('Creator not found');

    const participantIds = Array.from(new Set([params.creatorId, ...params.memberIds]));
    const initialUnreads: Record<string, number> = {};
    participantIds.forEach(id => { initialUnreads[id] = 0; });

    const groupId = `grp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const groupConv: ChatConversation = {
      id: groupId,
      type: 'group',
      participantIds,
      groupName: params.groupName,
      groupDescription: params.groupDescription || '',
      groupPhoto: params.groupPhoto || '',
      groupAdminIds: [params.creatorId],
      groupCreatedBy: params.creatorId,
      onlyAdminsCanPost: !!params.onlyAdminsCanPost,
      unreadCounts: initialUnreads,
      pinnedByUserIds: [],
      archivedByUserIds: [],
      mutedByUserIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await dataStore.saveConversation(groupConv);

    // Add system message
    const sysMsg: ChatMessage = {
      id: `msg_sys_${Date.now()}`,
      senderId: 'system',
      receiverId: '',
      conversationId: groupId,
      groupId: groupId,
      content: `${creator.name} aliunda kundi "${params.groupName}"`,
      createdAt: new Date().toISOString(),
      read: true,
      status: 'delivered'
    };
    await dataStore.saveMessage(sysMsg);

    return groupConv;
  }

  async addGroupMembers(groupId: string, actorId: string, memberIdsToAdd: string[]): Promise<ChatConversation> {
    const dataStore = getDataStore();
    const group = await dataStore.getConversationById(groupId);
    if (!group || group.type !== 'group') throw new Error('Group not found');

    // Verify actor is admin or member
    if (!(group.groupAdminIds || []).includes(actorId) && !group.participantIds.includes(actorId)) {
      throw new Error('Not authorized to add members to this group');
    }

    const updatedParticipants = Array.from(new Set([...group.participantIds, ...memberIdsToAdd]));
    for (const id of memberIdsToAdd) {
      if (group.unreadCounts[id] === undefined) {
        group.unreadCounts[id] = 0;
      }
    }

    const updated = await dataStore.updateConversation(groupId, {
      participantIds: updatedParticipants,
      unreadCounts: group.unreadCounts
    });

    if (!updated) throw new Error('Failed to update group');
    return updated;
  }

  async removeGroupMember(groupId: string, actorId: string, memberIdToRemove: string): Promise<ChatConversation> {
    const dataStore = getDataStore();
    const group = await dataStore.getConversationById(groupId);
    if (!group || group.type !== 'group') throw new Error('Group not found');

    // Allowed if actor is admin OR actor is leaving themselves
    const isAdmin = (group.groupAdminIds || []).includes(actorId);
    const isSelfLeave = actorId === memberIdToRemove;

    if (!isAdmin && !isSelfLeave) {
      throw new Error('Only admins can remove members from this group');
    }

    const updatedParticipants = group.participantIds.filter(id => id !== memberIdToRemove);
    const updatedAdmins = (group.groupAdminIds || []).filter(id => id !== memberIdToRemove);

    const updated = await dataStore.updateConversation(groupId, {
      participantIds: updatedParticipants,
      groupAdminIds: updatedAdmins.length > 0 ? updatedAdmins : (updatedParticipants.length > 0 ? [updatedParticipants[0]] : [])
    });

    if (!updated) throw new Error('Failed to update group');
    return updated;
  }
}

export const chatService = ChatService.getInstance();

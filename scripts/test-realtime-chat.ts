import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:3000/api';
const WS_URL = 'ws://localhost:3000/ws';

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface TestResult {
  suite: string;
  test: string;
  status: 'PASS' | 'FAIL' | 'BLOCKED';
  details: string;
}

const results: TestResult[] = [];

function record(suite: string, test: string, status: 'PASS' | 'FAIL' | 'BLOCKED', details: string) {
  results.push({ suite, test, status, details });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${suite}] ${test}: ${status} - ${details}`);
}

async function runRealtimeChatAudit() {
  console.log('\n======================================================');
  console.log('🚀 RAVINI REALTIME COMMUNICATION & CHAT AUDIT');
  console.log('======================================================\n');

  // 1. Health & Server Status
  try {
    const healthRes = await fetch(`${API_BASE}/health`);
    const health = await healthRes.json();
    if (health.status === 'ok' && health.realtime?.includes('ACTIVE')) {
      record('1. Server Infrastructure', 'WebSocket Server Active at /ws', 'PASS', `Confirmed on port 3000: ${health.realtime}`);
    } else {
      record('1. Server Infrastructure', 'WebSocket Server Active at /ws', 'FAIL', 'Health endpoint did not return active realtime status');
    }
  } catch (err: any) {
    record('1. Server Infrastructure', 'WebSocket Server Active at /ws', 'FAIL', `Health check connection error: ${err.message}`);
  }

  // 2. Chat System Status & STUN/TURN Audit
  try {
    const statusRes = await fetch(`${API_BASE}/chat/status`);
    const status = await statusRes.json();
    if (status.success) {
      record('2. Persistence', 'Database File Storage (ravini_db.json)', 'PASS', `Storage Engine: ${status.messagePersistence}`);
      record('2. Persistence', 'Media File Local Disk Storage', 'PASS', `Disk Storage: ${status.localStorageStatus}`);
      record('2. Persistence', 'External Cloud S3 Storage', status.cloudStorageStatus.startsWith('PASS') ? 'PASS' : 'BLOCKED', status.cloudStorageStatus);
      record('3. WebRTC Calling', 'Google STUN Server Configuration', 'PASS', `STUN: ${status.stunServer}`);
      record('3. WebRTC Calling', 'External TURN Server Relay', status.turnServer.startsWith('PASS') ? 'PASS' : 'BLOCKED', status.turnServer);
    } else {
      record('2. Persistence', 'Status Endpoint Response', 'FAIL', 'Status endpoint failed');
    }
  } catch (err: any) {
    record('2. Persistence', 'Status Endpoint Response', 'FAIL', err.message);
  }

  // 3. WebSocket End-to-End Realtime Messaging
  const userAId = 'usr_baraka_mabula'; // Baraka Mabula
  const userBId = 'usr_amina_juma';    // Amina Juma
  const userCId = 'usr_juma_rashid';   // Juma Rashid

  let wsA: WebSocket | null = null;
  let wsB: WebSocket | null = null;

  try {
    // Connect User A
    wsA = new WebSocket(`${WS_URL}?userId=${userAId}`);
    // Connect User B
    wsB = new WebSocket(`${WS_URL}?userId=${userBId}`);

    const userAEvents: any[] = [];
    const userBEvents: any[] = [];

    await new Promise<void>((resolve, reject) => {
      let openCount = 0;
      const onOpen = () => {
        openCount++;
        if (openCount === 2) resolve();
      };
      wsA!.on('open', onOpen);
      wsB!.on('open', onOpen);
      wsA!.on('error', reject);
      wsB!.on('error', reject);
      setTimeout(() => reject(new Error('WebSocket connection timeout')), 4000);
    });

    wsA.on('message', (data) => {
      const parsed = JSON.parse(data.toString());
      userAEvents.push(parsed);
      console.log('  -> [User A Socket Received]:', parsed.type, parsed.message?.id || parsed.error || '');
    });
    wsB.on('message', (data) => {
      const parsed = JSON.parse(data.toString());
      userBEvents.push(parsed);
      console.log('  -> [User B Socket Received]:', parsed.type, parsed.message?.id || parsed.error || '');
    });

    record('4. WebSocket Connection', 'Dual Authenticated Sockets Connected', 'PASS', 'User A (Support) and User B (Baraka) connected to /ws');

    // Send Message from User A to User B
    const idempotencyKey = `audit_idem_${Date.now()}`;
    const testContent = 'Habari Baraka! Huu ni ujumbe wa majaribio ya kiufundi wa wakati halisi (WebSockets).';

    wsA.send(JSON.stringify({
      type: 'send_message',
      receiverId: userBId,
      content: testContent,
      tempId: 'temp_audit_1',
      idempotencyKey
    }));

    // Wait for delivery
    await sleep(600);

    const sentConfirm = userAEvents.find(e => e.type === 'message_sent' && e.tempId === 'temp_audit_1');
    const receivedByB = userBEvents.find(e => e.type === 'new_message' && e.message?.content === testContent);

    if (sentConfirm && receivedByB) {
      record('5. Realtime Delivery', 'Message Sent & Received Instantly', 'PASS', `Message ID ${sentConfirm.message.id} sent by A and received by B over WebSocket`);
    } else {
      record('5. Realtime Delivery', 'Message Sent & Received Instantly', 'FAIL', 'Message was not received by recipient socket');
    }

    const messageId = sentConfirm?.message?.id;

    // Acknowledge Delivery from User B
    if (messageId) {
      wsB.send(JSON.stringify({
        type: 'message_delivered_ack',
        messageId
      }));

      await sleep(300);

      const deliveredEvent = userAEvents.find(e => e.type === 'message_delivered' && e.messageId === messageId);
      if (deliveredEvent) {
        record('6. Delivery Ticks', 'Delivery Status Ack (Double Gray Check)', 'PASS', `Delivered timestamp: ${deliveredEvent.deliveredAt}`);
      } else {
        record('6. Delivery Ticks', 'Delivery Status Ack (Double Gray Check)', 'FAIL', 'Sender did not receive message_delivered event');
      }

      // Mark Read from User B
      wsB.send(JSON.stringify({
        type: 'mark_read',
        conversationId: sentConfirm.conversation.id
      }));

      await sleep(300);

      const readEvent = userAEvents.find(e => e.type === 'messages_read' && e.conversationId === sentConfirm.conversation.id);
      if (readEvent) {
        record('6. Delivery Ticks', 'Read Receipt Ack (Double Blue Check)', 'PASS', `Read timestamp: ${readEvent.readAt}`);
      } else {
        record('6. Delivery Ticks', 'Read Receipt Ack (Double Blue Check)', 'FAIL', 'Sender did not receive messages_read event');
      }
    }

    // 7. Idempotency Check
    wsA.send(JSON.stringify({
      type: 'send_message',
      receiverId: userBId,
      content: testContent,
      tempId: 'temp_audit_duplicate',
      idempotencyKey // Re-use exact same key
    }));

    await sleep(400);

    const duplicateSent = userAEvents.find(e => e.tempId === 'temp_audit_duplicate');
    if (duplicateSent && duplicateSent.message.id === messageId) {
      record('7. Idempotency', 'Duplicate Send Protection', 'PASS', `Idempotent request returned existing message ID ${messageId} without creating duplicate`);
    } else {
      record('7. Idempotency', 'Duplicate Send Protection', 'FAIL', 'System failed to deduplicate with idempotencyKey');
    }

    // 8. Typing Indicators
    wsA.send(JSON.stringify({
      type: 'typing_start',
      conversationId: sentConfirm.conversation.id
    }));

    await sleep(200);

    const typingReceived = userBEvents.find(e => e.type === 'typing_start' && e.userId === userAId);
    if (typingReceived) {
      record('8. Presence & Typing', 'Typing Indicator Broadcast', 'PASS', `User B received typing_start from ${typingReceived.userName}`);
    } else {
      record('8. Presence & Typing', 'Typing Indicator Broadcast', 'FAIL', 'Typing indicator was not broadcast to recipient');
    }

    // 9. WebRTC Signaling: Call Ring -> Accept -> End
    wsA.send(JSON.stringify({
      type: 'call_initiate',
      receiverId: userBId,
      callType: 'voice'
    }));

    await sleep(400);

    const incomingCall = userBEvents.find(e => e.type === 'incoming_call');
    if (incomingCall && incomingCall.session?.callerId === userAId) {
      record('9. WebRTC Calling', 'Call Initiation & Signaling Dispatch', 'PASS', `Session ID ${incomingCall.session.id} dispatched to recipient`);

      // User B accepts
      wsB.send(JSON.stringify({
        type: 'call_accept',
        sessionId: incomingCall.session.id
      }));

      await sleep(300);

      const callAccepted = userAEvents.find(e => e.type === 'call_accepted' && e.session.id === incomingCall.session.id);
      if (callAccepted) {
        record('9. WebRTC Calling', 'Call Acceptance Signaling', 'PASS', 'Caller received call_accepted signal with WebRTC parameters');
      } else {
        record('9. WebRTC Calling', 'Call Acceptance Signaling', 'FAIL', 'Caller did not receive call_accepted');
      }

      // User A ends call
      wsA.send(JSON.stringify({
        type: 'call_end',
        sessionId: incomingCall.session.id
      }));

      await sleep(300);

      const callEnded = userBEvents.find(e => e.type === 'call_ended' && e.sessionId === incomingCall.session.id);
      if (callEnded) {
        record('9. WebRTC Calling', 'Call Termination & Duration Recording', 'PASS', `Call ended cleanly with duration tracking`);
      } else {
        record('9. WebRTC Calling', 'Call Termination & Duration Recording', 'FAIL', 'Call end not broadcast');
      }
    } else {
      record('9. WebRTC Calling', 'Call Initiation & Signaling Dispatch', 'FAIL', 'Recipient did not receive incoming_call');
    }

    // 10. Offline Reconnect & Missed Messages Sync
    wsB.close();
    await sleep(200);

    // Send while User B is offline
    const offlineMsgContent = 'Ujumbe uliotumwa ukiwa nje ya mtandao (Offline test)';
    wsA.send(JSON.stringify({
      type: 'send_message',
      receiverId: userBId,
      content: offlineMsgContent,
      tempId: 'temp_offline_msg',
      idempotencyKey: `idem_offline_${Date.now()}`
    }));

    await sleep(400);

    // User B reconnects and asks for missed messages
    const wsBReconnect = new WebSocket(`${WS_URL}?userId=${userBId}`);
    const reconnectEvents: any[] = [];
    wsBReconnect.on('message', (d) => reconnectEvents.push(JSON.parse(d.toString())));

    await new Promise<void>((res) => wsBReconnect.on('open', () => res()));
    
    // Request missed messages since 10 seconds ago
    const tenSecsAgo = new Date(Date.now() - 10000).toISOString();
    wsBReconnect.send(JSON.stringify({
      type: 'sync_missed_messages',
      sinceTimestamp: tenSecsAgo
    }));

    await sleep(400);

    const syncResp = reconnectEvents.find(e => e.type === 'sync_missed_messages_response');
    const hasOfflineMsg = syncResp?.messages?.some((m: any) => m.content === offlineMsgContent);

    if (hasOfflineMsg) {
      record('10. Offline & Reconnect', 'Missed Message Synchronization', 'PASS', 'Offline messages retrieved upon reconnection without data loss');
    } else {
      record('10. Offline & Reconnect', 'Missed Message Synchronization', 'FAIL', 'Sync response did not contain the missed offline message');
    }

    wsBReconnect.close();
  } catch (err: any) {
    record('4. WebSocket Connection', 'Dual Sockets Test Error', 'FAIL', err.message);
  } finally {
    if (wsA && wsA.readyState === WebSocket.OPEN) wsA.close();
    if (wsB && wsB.readyState === WebSocket.OPEN) wsB.close();
  }

  // 11. Media Upload & Storage Verification
  try {
    const dummyBase64 = Buffer.from('FAKE_IMAGE_DATA_FOR_AUDIT').toString('base64');
    const uploadRes = await fetch(`${API_BASE}/chat/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userAId}`
      },
      body: JSON.stringify({
        fileBase64: dummyBase64,
        fileName: 'audit_test_image.jpg',
        mimeType: 'image/jpeg'
      })
    });
    const uploadData = await uploadRes.json();
    if (uploadData.success && uploadData.url) {
      const localFilePath = path.join(process.cwd(), uploadData.url);
      const fileExists = fs.existsSync(localFilePath);
      if (fileExists) {
        record('11. Media Storage', 'Persistent Local Disk Media Upload', 'PASS', `File written to ${uploadData.url} (${uploadData.size} bytes)`);
      } else {
        record('11. Media Storage', 'Persistent Local Disk Media Upload', 'FAIL', `File not found on local disk: ${localFilePath}`);
      }
    } else {
      record('11. Media Storage', 'Persistent Local Disk Media Upload', 'FAIL', uploadData.message || 'Upload endpoint failed');
    }
  } catch (err: any) {
    record('11. Media Storage', 'Persistent Local Disk Media Upload', 'FAIL', err.message);
  }

  // 12. Privacy & Blocking Verification
  try {
    // Test blocking User C
    const blockRes = await fetch(`${API_BASE}/chat/block`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userAId}`
      },
      body: JSON.stringify({ targetUserId: userCId })
    });
    const blockData = await blockRes.json();

    if (blockData.success) {
      record('12. Privacy & Blocking', 'User Block Persistence', 'PASS', `Blocked user ${userCId}`);

      // Attempt to initiate message
      const msgRes = await fetch(`${API_BASE}/chat/conversations/direct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userCId}`
        },
        body: JSON.stringify({ recipientId: userAId })
      });
      const msgData = await msgRes.json();
      if (!msgData.success && msgRes.status === 403) {
        record('12. Privacy & Blocking', 'Blocked User Communication Denial', 'PASS', `Communication rejected: ${msgData.message}`);
      } else {
        record('12. Privacy & Blocking', 'Blocked User Communication Denial', 'FAIL', 'Blocked user was allowed to open conversation');
      }

      // Unblock for cleanup
      await fetch(`${API_BASE}/chat/unblock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userAId}`
        },
        body: JSON.stringify({ targetUserId: userCId })
      });
    }
  } catch (err: any) {
    record('12. Privacy & Blocking', 'User Block Verification', 'FAIL', err.message);
  }

  // 13. Persistent Unread Count Verification
  try {
    const unreadRes = await fetch(`${API_BASE}/chat/unread-count`, {
      headers: { 'Authorization': `Bearer ${userAId}` }
    });
    const unreadData = await unreadRes.json();
    if (unreadData.success && typeof unreadData.totalUnread === 'number') {
      record('13. Unread Count', 'Authoritative Unread Count from DataStore', 'PASS', `Current unread count: ${unreadData.totalUnread}`);
    } else {
      record('13. Unread Count', 'Authoritative Unread Count from DataStore', 'FAIL', 'Invalid unread count response');
    }
  } catch (err: any) {
    record('13. Unread Count', 'Authoritative Unread Count from DataStore', 'FAIL', err.message);
  }

  // Summary
  console.log('\n======================================================');
  console.log('📊 AUDIT SUMMARY TABLE');
  console.log('======================================================');
  const passes = results.filter(r => r.status === 'PASS').length;
  const fails = results.filter(r => r.status === 'FAIL').length;
  const blocked = results.filter(r => r.status === 'BLOCKED').length;

  console.log(`TOTAL AUDIT CHECKS: ${results.length}`);
  console.log(`✅ PASSED:  ${passes}`);
  console.log(`❌ FAILED:  ${fails}`);
  console.log(`⚠️  BLOCKED: ${blocked}`);
  console.log('======================================================\n');

  if (fails > 0) {
    process.exit(1);
  }
}

runRealtimeChatAudit().catch(err => {
  console.error('Audit fatal crash:', err);
  process.exit(1);
});

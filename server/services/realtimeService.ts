import { Response } from 'express';

interface RealtimeClient {
  id: string;
  userId: string;
  role: string;
  res: Response;
  connectedAt: number;
}

export class RealtimeService {
  private static instance: RealtimeService;
  private clients: Map<string, RealtimeClient> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Keep connections alive through proxies and mobile NATs
    this.pingInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 25000);
  }

  public static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  public addClient(userId: string, role: string, res: Response): string {
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*'
    });

    res.write(`: connection established ${clientId}\n\n`);

    const client: RealtimeClient = {
      id: clientId,
      userId,
      role,
      res,
      connectedAt: Date.now()
    };

    this.clients.set(clientId, client);

    res.on('close', () => {
      this.clients.delete(clientId);
    });

    return clientId;
  }

  public notifyUser(userId: string, payload: { type: string; [key: string]: any }): void {
    const dataString = `data: ${JSON.stringify({ ...payload, timestamp: Date.now() })}\n\n`;
    for (const client of this.clients.values()) {
      if (client.userId === userId) {
        try {
          client.res.write(dataString);
        } catch {
          this.clients.delete(client.id);
        }
      }
    }
  }

  public notifyRole(role: string, payload: { type: string; [key: string]: any }): void {
    const dataString = `data: ${JSON.stringify({ ...payload, timestamp: Date.now() })}\n\n`;
    for (const client of this.clients.values()) {
      if (client.role === role) {
        try {
          client.res.write(dataString);
        } catch {
          this.clients.delete(client.id);
        }
      }
    }
  }

  public broadcast(payload: { type: string; [key: string]: any }): void {
    const dataString = `data: ${JSON.stringify({ ...payload, timestamp: Date.now() })}\n\n`;
    for (const client of this.clients.values()) {
      try {
        client.res.write(dataString);
      } catch {
        this.clients.delete(client.id);
      }
    }
  }

  private sendHeartbeat(): void {
    for (const [id, client] of this.clients.entries()) {
      try {
        client.res.write(': ping\n\n');
      } catch {
        this.clients.delete(id);
      }
    }
  }

  public getConnectedClientsCount(): number {
    return this.clients.size;
  }
}

export const realtimeService = RealtimeService.getInstance();

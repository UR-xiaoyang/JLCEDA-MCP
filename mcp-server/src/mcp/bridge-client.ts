/**
 * WebSocket服务器 - 接受来自EDA插件的连接
 * EDA插件连接到这个服务器并执行任务
 */

import { WebSocketServer, WebSocket } from 'ws';

interface BridgeRequest {
  requestId: string;
  path: string;
  payload: unknown;
}

interface BridgeResponse {
  requestId: string;
  result?: unknown;
  error?: string;
}

export class EdaBridgeServer {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private started = false;
  private pendingRequests = new Map<string, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }>();
  private requestIdCounter = 0;

  constructor(private readonly port: number = 8765) {}

  /**
   * 启动WebSocket服务器
   */
  public async start(): Promise<void> {
    if (this.started) {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        this.wss = new WebSocketServer({ 
          port: this.port,
          path: '/bridge/ws'
        });

        this.wss.on('listening', () => {
          this.started = true;
          process.stderr.write(`WebSocket server listening on ws://127.0.0.1:${this.port}/bridge/ws\n`);
          resolve();
        });

        this.wss.on('connection', (ws: WebSocket) => {
          this.handleConnection(ws);
        });

        this.wss.on('error', (error) => {
          process.stderr.write(`WebSocket server error: ${error.message}\n`);
          if (!this.started) {
            reject(error);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 处理新的客户端连接
   */
  private handleConnection(ws: WebSocket): void {
    this.clients.add(ws);
    process.stderr.write(`EDA client connected, total: ${this.clients.size}\n`);

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(message, ws);
      } catch (error) {
        process.stderr.write(`Failed to parse message: ${error}\n`);
      }
    });

    ws.on('close', () => {
      this.clients.delete(ws);
      process.stderr.write(`EDA client disconnected, remaining: ${this.clients.size}\n`);
    });

    ws.on('error', (error) => {
      process.stderr.write(`Client error: ${error.message}\n`);
    });
  }

  /**
   * 处理来自EDA插件的消息
   */
  private handleMessage(message: any, ws: WebSocket): void {
    if (message.type === 'bridge/result' && message.requestId) {
      // 这是任务执行结果
      const pending = this.pendingRequests.get(message.requestId);
      if (pending) {
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(message.requestId);

        if (message.error) {
          pending.reject(new Error(message.error));
        } else {
          pending.resolve(message.result);
        }
      }
    }
  }

  /**
   * 发送任务请求到EDA插件
   */
  public async request(path: string, payload: unknown, timeoutMs: number = 30000): Promise<unknown> {
    if (!this.started || this.clients.size === 0) {
      throw new Error('No EDA clients connected');
    }

    const requestId = `req_${++this.requestIdCounter}_${Date.now()}`;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Request timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      this.pendingRequests.set(requestId, { resolve, reject, timeout });

      const request = {
        type: 'bridge/task',
        requestId,
        path,
        payload,
      };

      // 发送到第一个客户端（通常只有一个）
      const client = Array.from(this.clients)[0];
      client.send(JSON.stringify(request));
    });
  }

  /**
   * 关闭服务器
   */
  public close(): void {
    if (this.wss) {
      this.clients.forEach(ws => ws.close());
      this.clients.clear();
      this.wss.close();
      this.wss = null;
      this.started = false;
    }
  }

  /**
   * 检查是否有客户端连接
   */
  public hasClients(): boolean {
    return this.clients.size > 0;
  }
}


interface BridgeRequest {
  requestId: string;
  path: string;
  payload: unknown;
}

interface BridgeResponse {
  requestId: string;
  result?: unknown;
  error?: string;
}

export class EdaBridgeClient {
  private ws: WebSocket | null = null;
  private connected = false;
  private pendingRequests = new Map<string, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }>();
  private requestIdCounter = 0;

  constructor(private readonly bridgeUrl: string = 'ws://127.0.0.1:8765/bridge/ws') {}

  /**
   * 连接到EDA插件
   */
  public async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.bridgeUrl);

      this.ws.on('open', () => {
        this.connected = true;
        process.stderr.write(`Connected to EDA bridge at ${this.bridgeUrl}\n`);
        resolve();
      });

      this.ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (error) {
          process.stderr.write(`Failed to parse bridge message: ${error}\n`);
        }
      });

      this.ws.on('close', () => {
        this.connected = false;
        process.stderr.write('Disconnected from EDA bridge\n');
        // 拒绝所有pending的请求
        for (const [requestId, pending] of this.pendingRequests.entries()) {
          pending.reject(new Error('Bridge connection closed'));
          clearTimeout(pending.timeout);
          this.pendingRequests.delete(requestId);
        }
      });

      this.ws.on('error', (error) => {
        process.stderr.write(`Bridge connection error: ${error.message}\n`);
        reject(error);
      });

      // 5秒连接超时
      setTimeout(() => {
        if (!this.connected) {
          reject(new Error('Connection timeout'));
        }
      }, 5000);
    });
  }

  /**
   * 发送请求到EDA插件
   */
  public async request(path: string, payload: unknown, timeoutMs: number = 30000): Promise<unknown> {
    if (!this.connected || !this.ws) {
      throw new Error('Not connected to EDA bridge');
    }

    const requestId = `req_${++this.requestIdCounter}_${Date.now()}`;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Bridge request timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      this.pendingRequests.set(requestId, { resolve, reject, timeout });

      const request: BridgeRequest = {
        requestId,
        path,
        payload,
      };

      this.ws!.send(JSON.stringify({
        type: 'bridge/task',
        ...request,
      }));
    });
  }

  /**
   * 处理来自EDA插件的消息
   */
  private handleMessage(message: any): void {
    if (message.type === 'bridge/result' && message.requestId) {
      const pending = this.pendingRequests.get(message.requestId);
      if (pending) {
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(message.requestId);

        if (message.error) {
          pending.reject(new Error(message.error));
        } else {
          pending.resolve(message.result);
        }
      }
    }
  }

  /**
   * 关闭连接
   */
  public close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.connected = false;
    }
  }

  /**
   * 检查是否已连接
   */
  public isConnected(): boolean {
    return this.connected;
  }
}

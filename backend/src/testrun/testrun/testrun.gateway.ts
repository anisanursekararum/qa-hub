import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

// Mirror HTTP CORS: restrict to Firebase Hosting origin(s) in production,
// allow all in development. CORS_ORIGIN is a comma-separated list of allowed origins.
const isProduction = process.env.NODE_ENV === 'production';
const wsOrigin = isProduction
  ? (process.env.CORS_ORIGIN || '').split(',').map((o) => o.trim()).filter(Boolean)
  : true;

@WebSocketGateway({
  cors: {
    origin: wsOrigin,
    credentials: true,
  },
})
export class TestRunGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('TestRunGateway');

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Called from Service to broadcast status change for a run (e.g. IN_PROGRESS -> AUTOMATION_RUNNING)
  broadcastRunStatus(runId: string, status: string) {
    this.server.emit(`run_status_${runId}`, { status });
  }

  // Called from Service to broadcast status change for a run item
  broadcastItemStatus(runId: string, testCaseId: string, executionStatus: string, notes?: string) {
    this.server.emit(`item_status_${runId}`, { testCaseId, executionStatus, notes });
  }

  // Called from Service to stream logs
  broadcastLog(runId: string, log: string) {
    this.server.emit(`telemetry_${runId}`, { timestamp: new Date().toISOString(), log });
  }

  // Broadcast AI test generation progress to all connected clients
  broadcastAiProgress(status: string, message: string) {
    if (this.server) {
      this.server.emit('ai-progress', { status, message });
    }
  }
}

import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*' },
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
}

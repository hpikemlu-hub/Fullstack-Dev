// WebSocket Real-time Server
// Replaces Supabase Realtime with custom WebSocket implementation

import { WebSocketServer, WebSocket } from 'ws'
import { createServer } from 'http'
import { parse } from 'url'
import { AuthService } from '@/lib/auth/jwt'

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string
  username?: string
  role?: 'ADMIN' | 'USER'
  rooms?: Set<string>
}

interface WebSocketMessage {
  type: string
  room?: string
  data?: any
  event?: string
}

export class RealtimeServer {
  private wss: WebSocketServer
  private clients: Map<string, AuthenticatedWebSocket> = new Map()
  private rooms: Map<string, Set<string>> = new Map()

  constructor(server?: any) {
    this.wss = new WebSocketServer({
      server,
      path: '/api/realtime',
      verifyClient: this.verifyClient.bind(this)
    })

    this.setupEventHandlers()
  }

  private async verifyClient(info: any): Promise<boolean> {
    try {
      const { query } = parse(info.req.url, true)
      const token = query.token as string

      if (!token) {
        console.log('WebSocket connection rejected: No token provided')
        return false
      }

      const payload = AuthService.verifyAccessToken(token)
      if (!payload) {
        console.log('WebSocket connection rejected: Invalid token')
        return false
      }

      // Store user info for later use
      info.req.user = payload
      return true

    } catch (error) {
      console.error('WebSocket verification error:', error)
      return false
    }
  }

  private setupEventHandlers(): void {
    this.wss.on('connection', (ws: AuthenticatedWebSocket, req: any) => {
      const user = req.user
      if (!user) {
        ws.close(1008, 'Authentication failed')
        return
      }

      // Initialize authenticated socket
      ws.userId = user.userId
      ws.username = user.username
      ws.role = user.role
      ws.rooms = new Set()

      this.clients.set(user.userId, ws)

      console.log(`WebSocket connected: ${user.username} (${user.userId})`)

      // Handle incoming messages
      ws.on('message', (rawMessage: Buffer) => {
        try {
          const message: WebSocketMessage = JSON.parse(rawMessage.toString())
          this.handleMessage(ws, message)
        } catch (error) {
          console.error('WebSocket message parse error:', error)
          ws.send(JSON.stringify({
            type: 'error',
            error: 'Invalid message format'
          }))
        }
      })

      // Handle disconnection
      ws.on('close', () => {
        this.handleDisconnect(ws)
      })

      // Handle errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for user ${user.username}:`, error)
      })

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Real-time connection established',
        userId: user.userId
      }))
    })
  }

  private handleMessage(ws: AuthenticatedWebSocket, message: WebSocketMessage): void {
    switch (message.type) {
      case 'join_room':
        this.joinRoom(ws, message.room!)
        break

      case 'leave_room':
        this.leaveRoom(ws, message.room!)
        break

      case 'calendar_update':
        this.handleCalendarUpdate(ws, message)
        break

      case 'workload_update':
        this.handleWorkloadUpdate(ws, message)
        break

      case 'dashboard_refresh':
        this.handleDashboardRefresh(ws, message)
        break

      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }))
        break

      default:
        ws.send(JSON.stringify({
          type: 'error',
          error: `Unknown message type: ${message.type}`
        }))
    }
  }

  private joinRoom(ws: AuthenticatedWebSocket, room: string): void {
    if (!room) return

    // Add user to room
    ws.rooms!.add(room)
    
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set())
    }
    this.rooms.get(room)!.add(ws.userId!)

    console.log(`User ${ws.username} joined room: ${room}`)

    ws.send(JSON.stringify({
      type: 'room_joined',
      room: room
    }))

    // Notify others in the room
    this.broadcastToRoom(room, {
      type: 'user_joined',
      room: room,
      user: {
        id: ws.userId,
        username: ws.username
      }
    }, ws.userId!)
  }

  private leaveRoom(ws: AuthenticatedWebSocket, room: string): void {
    if (!room || !ws.rooms!.has(room)) return

    ws.rooms!.delete(room)
    this.rooms.get(room)?.delete(ws.userId!)

    // Clean up empty rooms
    if (this.rooms.get(room)?.size === 0) {
      this.rooms.delete(room)
    }

    console.log(`User ${ws.username} left room: ${room}`)

    ws.send(JSON.stringify({
      type: 'room_left',
      room: room
    }))

    // Notify others in the room
    this.broadcastToRoom(room, {
      type: 'user_left',
      room: room,
      user: {
        id: ws.userId,
        username: ws.username
      }
    }, ws.userId!)
  }

  private handleCalendarUpdate(ws: AuthenticatedWebSocket, message: WebSocketMessage): void {
    // Broadcast calendar updates to all users
    this.broadcastToAll({
      type: 'calendar_updated',
      event: message.event,
      data: message.data,
      updatedBy: {
        id: ws.userId,
        username: ws.username
      }
    }, ws.userId!)
  }

  private handleWorkloadUpdate(ws: AuthenticatedWebSocket, message: WebSocketMessage): void {
    // Broadcast workload updates to relevant users
    this.broadcastToAll({
      type: 'workload_updated',
      event: message.event,
      data: message.data,
      updatedBy: {
        id: ws.userId,
        username: ws.username
      }
    }, ws.userId!)
  }

  private handleDashboardRefresh(ws: AuthenticatedWebSocket, message: WebSocketMessage): void {
    // Trigger dashboard refresh for all connected users
    this.broadcastToAll({
      type: 'dashboard_refresh',
      timestamp: Date.now(),
      triggeredBy: {
        id: ws.userId,
        username: ws.username
      }
    }, ws.userId!)
  }

  private handleDisconnect(ws: AuthenticatedWebSocket): void {
    if (!ws.userId) return

    // Leave all rooms
    ws.rooms?.forEach(room => {
      this.leaveRoom(ws, room)
    })

    // Remove from clients
    this.clients.delete(ws.userId)

    console.log(`WebSocket disconnected: ${ws.username} (${ws.userId})`)
  }

  // Public methods for triggering events from API routes
  public broadcastCalendarUpdate(event: string, data: any, excludeUserId?: string): void {
    this.broadcastToAll({
      type: 'calendar_updated',
      event,
      data,
      timestamp: Date.now()
    }, excludeUserId)
  }

  public broadcastWorkloadUpdate(event: string, data: any, excludeUserId?: string): void {
    this.broadcastToAll({
      type: 'workload_updated',
      event,
      data,
      timestamp: Date.now()
    }, excludeUserId)
  }

  public broadcastDashboardUpdate(excludeUserId?: string): void {
    this.broadcastToAll({
      type: 'dashboard_refresh',
      timestamp: Date.now()
    }, excludeUserId)
  }

  private broadcastToRoom(room: string, message: any, excludeUserId?: string): void {
    const roomUsers = this.rooms.get(room)
    if (!roomUsers) return

    roomUsers.forEach(userId => {
      if (userId === excludeUserId) return
      
      const client = this.clients.get(userId)
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message))
      }
    })
  }

  private broadcastToAll(message: any, excludeUserId?: string): void {
    this.clients.forEach((client, userId) => {
      if (userId === excludeUserId) return
      
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message))
      }
    })
  }

  public getStats(): any {
    return {
      connectedClients: this.clients.size,
      activeRooms: this.rooms.size,
      totalRoomMembers: Array.from(this.rooms.values()).reduce((sum, room) => sum + room.size, 0)
    }
  }
}

// Singleton instance
let realtimeServer: RealtimeServer | null = null

export function getRealtimeServer(): RealtimeServer {
  if (!realtimeServer) {
    realtimeServer = new RealtimeServer()
  }
  return realtimeServer
}

export function initializeRealtimeServer(server: any): RealtimeServer {
  if (!realtimeServer) {
    realtimeServer = new RealtimeServer(server)
  }
  return realtimeServer
}
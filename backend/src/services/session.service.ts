import redisClient from '../db/redis';
import { JwtPayload } from './token.service';
import { query } from '../db/pool';

/**
 * Session metadata stored in Redis
 */
export interface SessionMetadata {
  userId: string;
  email: string;
  role: string;
  device: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  lastActivity: string;
}

/**
 * Session Service
 * Manages user sessions with inactivity timeout and concurrent session limits
 */
export class SessionService {
  private readonly SESSION_PREFIX = 'session:';
  private readonly USER_SESSIONS_PREFIX = 'user:sessions:';
  private readonly MAX_CONCURRENT_SESSIONS = 3;
  private readonly SESSION_EXPIRY = 30 * 60; // 30 minutes in seconds

  /**
   * Create new session
   */
  async createSession(
    sessionId: string,
    payload: JwtPayload,
    metadata: Omit<SessionMetadata, 'userId' | 'email' | 'role' | 'createdAt' | 'lastActivity'>
  ): Promise<void> {
    const now = new Date().toISOString();

    const session: SessionMetadata = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      device: metadata.device,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      createdAt: now,
      lastActivity: now,
    };

    // Store session with expiry
    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    await redisClient.setex(sessionKey, this.SESSION_EXPIRY, JSON.stringify(session));

    // Add to user's session set
    const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${payload.userId}`;
    await redisClient.sadd(userSessionsKey, sessionId);

    await query(
      `INSERT INTO sessions (id, user_id, device, ip_address, user_agent, created_at, last_activity)
       VALUES ($1, $2, $3, $4, $5, $6, $6)
       ON CONFLICT (id) DO UPDATE SET last_activity = EXCLUDED.last_activity`,
      [sessionId, payload.userId, metadata.device, metadata.ipAddress, metadata.userAgent, now]
    );

    // Enforce max concurrent sessions
    await this.enforceSessionLimit(payload.userId);
  }

  /**
   * Update session activity (reset expiry timer)
   */
  async updateActivity(sessionId: string): Promise<void> {
    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    const data = await redisClient.get(sessionKey);

    if (!data) {
      return; // Session not found or expired
    }

    try {
      const session: SessionMetadata = JSON.parse(data);
      session.lastActivity = new Date().toISOString();

      // Update session with refreshed expiry
      await redisClient.setex(sessionKey, this.SESSION_EXPIRY, JSON.stringify(session));
      await query('UPDATE sessions SET last_activity = $1 WHERE id = $2', [
        session.lastActivity,
        sessionId,
      ]);
    } catch (error) {
      console.error('Error updating session activity:', error);
    }
  }

  /**
   * Get session data
   */
  async getSession(sessionId: string): Promise<SessionMetadata | null> {
    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    const data = await redisClient.get(sessionKey);

    if (!data) {
      return null;
    }

    try {
      return JSON.parse(data) as SessionMetadata;
    } catch (error) {
      console.error('Error parsing session data:', error);
      return null;
    }
  }

  /**
   * Get all sessions for user
   */
  async getUserSessions(userId: string): Promise<SessionMetadata[]> {
    const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
    const sessionIds = await redisClient.smembers(userSessionsKey);

    const sessions: SessionMetadata[] = [];

    for (const sessionId of sessionIds) {
      const session = await this.getSession(sessionId);
      if (session) {
        sessions.push(session);
      } else {
        // Remove expired session from user's set
        await redisClient.srem(userSessionsKey, sessionId);
      }
    }

    return sessions;
  }

  /**
   * Terminate session
   */
  async terminateSession(sessionId: string): Promise<void> {
    // Get session to find userId
    const session = await this.getSession(sessionId);

    if (session) {
      // Remove from user's session set
      const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${session.userId}`;
      await redisClient.srem(userSessionsKey, sessionId);
    }

    // Delete session
    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    await redisClient.del(sessionKey);
    await query('DELETE FROM sessions WHERE id = $1', [sessionId]);
  }

  /**
   * Terminate all sessions for user
   */
  async terminateAllUserSessions(userId: string): Promise<void> {
    const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
    const sessionIds = await redisClient.smembers(userSessionsKey);

    // Delete each session
    for (const sessionId of sessionIds) {
      const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
      await redisClient.del(sessionKey);
    }

    // Clear user's session set
    await redisClient.del(userSessionsKey);
    await query('DELETE FROM sessions WHERE user_id = $1', [userId]);
  }

  /**
   * Enforce maximum concurrent sessions per user
   * Terminates oldest sessions when limit is exceeded
   */
  async enforceSessionLimit(userId: string): Promise<void> {
    const sessions = await this.getUserSessions(userId);

    if (sessions.length <= this.MAX_CONCURRENT_SESSIONS) {
      return; // Within limit
    }

    // Sort by creation time (oldest first)
    sessions.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // Calculate how many sessions to terminate
    const sessionsToTerminate = sessions.length - this.MAX_CONCURRENT_SESSIONS;

    // Get all session IDs to find which ones to terminate
    const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
    const sessionIds = await redisClient.smembers(userSessionsKey);

    // Terminate oldest sessions
    for (let i = 0; i < sessionsToTerminate; i++) {
      const oldestSession = sessions[i];

      // Find matching session ID by comparing metadata
      for (const sessionId of sessionIds) {
        const sessionData = await this.getSession(sessionId);
        if (sessionData && sessionData.createdAt === oldestSession.createdAt) {
          await this.terminateSession(sessionId);
          break;
        }
      }
    }
  }
}

export default new SessionService();

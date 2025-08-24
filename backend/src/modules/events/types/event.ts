export interface Event {
  id: string;         // uuidv4 (time-ordered preferred but using existing uuid)
  tenant_id: string;  // e.g., "tenant_a" | "tenant_b" 
  message: string;
  timestamp: string;  // ISO 8601 (server-generated)
  author_id?: string; // optional, derived from token
}

export interface EventReplayRequest {
  sinceId?: string;
  limit?: number;
}

export interface EventReplayResponse {
  events: Event[];
}

export interface EventError {
  code: string;
  message: string;
}
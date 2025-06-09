/**
 * Simple event emitter for Monaco Error Lens
 */

export type EventListener<T = unknown> = (data?: T) => void;

/**
 * Simple event emitter
 */
export class SimpleEventEmitter {
  private listeners = new Map<string, Set<EventListener>>();

  /**
   * Add an event listener
   */
  public on(event: string, listener: EventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.add(listener);
    }

    // Return unsubscribe function
    return () => this.off(event, listener);
  }

  /**
   * Remove an event listener
   */
  public off(event: string, listener: EventListener): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Emit an event
   */
  public emit(event: string, data?: unknown): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const listeners = Array.from(eventListeners);
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch {
          // Silently handle event listener errors to avoid console spam
        }
      });
    }
  }

  /**
   * Remove all listeners
   */
  public removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

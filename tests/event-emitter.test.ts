/**
 * Tests for SimpleEventEmitter
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SimpleEventEmitter } from '../src/event-emitter';

describe('SimpleEventEmitter', () => {
  let eventEmitter: SimpleEventEmitter;

  beforeEach(() => {
    eventEmitter = new SimpleEventEmitter();
  });

  describe('constructor', () => {
    it('should create an empty event emitter', () => {
      expect(eventEmitter).toBeInstanceOf(SimpleEventEmitter);
    });
  });

  describe('on/off', () => {
    it('should add event listeners', () => {
      const listener = vi.fn();
      const unsubscribe = eventEmitter.on('test', listener);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should remove event listeners', () => {
      const listener = vi.fn();
      eventEmitter.on('test', listener);
      
      eventEmitter.off('test', listener);
      
      // Test that the listener was removed by emitting
      eventEmitter.emit('test', 'test-data');
      expect(listener).not.toHaveBeenCalled();
    });

    it('should return unsubscribe function that removes listener', () => {
      const listener = vi.fn();
      const unsubscribe = eventEmitter.on('test', listener);
      
      unsubscribe();
      
      eventEmitter.emit('test', 'test-data');
      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle multiple listeners for same event', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      eventEmitter.on('test', listener1);
      eventEmitter.on('test', listener2);
      
      eventEmitter.emit('test', 'test-data');
      
      expect(listener1).toHaveBeenCalledWith('test-data');
      expect(listener2).toHaveBeenCalledWith('test-data');
    });

    it('should handle multiple events', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      eventEmitter.on('event1', listener1);
      eventEmitter.on('event2', listener2);
      
      eventEmitter.emit('event1', 'data1');
      eventEmitter.emit('event2', 'data2');
      
      expect(listener1).toHaveBeenCalledWith('data1');
      expect(listener2).toHaveBeenCalledWith('data2');
    });
  });

  describe('emit', () => {
    it('should call all listeners for the event', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const testData = { test: 'value' };
      
      eventEmitter.on('test', listener1);
      eventEmitter.on('test', listener2);
      
      eventEmitter.emit('test', testData);
      
      expect(listener1).toHaveBeenCalledWith(testData);
      expect(listener2).toHaveBeenCalledWith(testData);
    });

    it('should do nothing if no listeners for event', () => {
      expect(() => {
        eventEmitter.emit('nonexistent', 'data');
      }).not.toThrow();
    });

    it('should handle listener exceptions gracefully', () => {
      const errorListener = vi.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      const normalListener = vi.fn();
      
      eventEmitter.on('test', errorListener);
      eventEmitter.on('test', normalListener);
      
      expect(() => {
        eventEmitter.emit('test', 'data');
      }).not.toThrow();
      
      expect(errorListener).toHaveBeenCalled();
      expect(normalListener).toHaveBeenCalled();
      // Note: Error handling is now silent, no console.error expected
    });
  });

  describe('removeAllListeners', () => {
    it('should remove all listeners for specific event', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const listener3 = vi.fn();
      
      eventEmitter.on('event1', listener1);
      eventEmitter.on('event1', listener2);
      eventEmitter.on('event2', listener3);
      
      eventEmitter.removeAllListeners('event1');
      
      eventEmitter.emit('event1', 'data1');
      eventEmitter.emit('event2', 'data2');
      
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
      expect(listener3).toHaveBeenCalledWith('data2');
    });

    it('should remove all listeners for all events when no event specified', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      eventEmitter.on('event1', listener1);
      eventEmitter.on('event2', listener2);
      
      eventEmitter.removeAllListeners();
      
      eventEmitter.emit('event1', 'data1');
      eventEmitter.emit('event2', 'data2');
      
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should not crash on duplicate removal', () => {
      const listener = vi.fn();
      
      eventEmitter.on('test', listener);
      eventEmitter.off('test', listener);
      
      // Should not throw
      expect(() => {
        eventEmitter.off('test', listener);
      }).not.toThrow();
    });

    it('should handle removing non-existent listener', () => {
      const listener = vi.fn();
      
      expect(() => {
        eventEmitter.off('nonexistent', listener);
      }).not.toThrow();
    });
  });

  describe('integration scenarios', () => {
    it('should handle Monaco Error Lens event types', () => {
      const decorationsListener = vi.fn();
      const configListener = vi.fn();
      const errorListener = vi.fn();
      
      eventEmitter.on('decorations-updated', decorationsListener);
      eventEmitter.on('config-updated', configListener);
      eventEmitter.on('error', errorListener);
      
      // Simulate Monaco Error Lens events
      eventEmitter.emit('decorations-updated', {
        decorationCount: 5,
        markerCount: 3,
        timestamp: new Date()
      });
      
      eventEmitter.emit('config-updated', {
        config: { enabled: true, maxMessageLength: 100 },
        timestamp: new Date()
      });
      
      eventEmitter.emit('error', {
        error: new Error('Test error'),
        context: 'test',
        timestamp: new Date()
      });
      
      expect(decorationsListener).toHaveBeenCalledWith(
        expect.objectContaining({
          decorationCount: 5,
          markerCount: 3,
          timestamp: expect.any(Date)
        })
      );
      
      expect(configListener).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.any(Object),
          timestamp: expect.any(Date)
        })
      );
      
      expect(errorListener).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(Error),
          context: 'test',
          timestamp: expect.any(Date)
        })
      );
    });
  });
});
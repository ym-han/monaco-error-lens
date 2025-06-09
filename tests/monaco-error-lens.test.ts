/**
 * Tests for MonacoErrorLens main class
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MonacoErrorLens } from '../src/monaco-error-lens';
import { DEFAULT_OPTIONS } from '../src/types';
import type { ErrorLensOptions } from '../src/types';
import {
  createMockEditor,
  createMockMarkers,
  MarkerSeverity,
  type IStandaloneCodeEditor,
} from '../tests/__mocks__/monaco-editor';

// Set up monaco mock
const mockOnDidChangeMarkers = vi.fn();
const mockGetModelMarkers = vi.fn();

const mockMonaco = {
  editor: {
    onDidChangeMarkers: mockOnDidChangeMarkers.mockReturnValue({
      dispose: vi.fn(),
    }),
    getModelMarkers: mockGetModelMarkers,
    TrackedRangeStickiness: {
      NeverGrowsWhenTypingAtEdges: 1,
    },
  },
  Range: class Range {
    constructor(
      public startLineNumber: number,
      public startColumn: number,
      public endLineNumber: number,
      public endColumn: number
    ) {}
  },
};

describe('MonacoErrorLens', () => {
  let mockEditor: IStandaloneCodeEditor;

  beforeEach(() => {
    mockEditor = createMockEditor();
    mockGetModelMarkers.mockReturnValue(createMockMarkers());
    mockOnDidChangeMarkers.mockClear();
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with default options', () => {
      const errorLens = new MonacoErrorLens(mockEditor, mockMonaco);
      
      expect(errorLens).toBeInstanceOf(MonacoErrorLens);
      expect(errorLens.isActive()).toBe(true);
    });

    it('should create instance with custom options', () => {
      const options: ErrorLensOptions = {
        enableInlineMessages: false,
        enableGutterIcons: false,
        maxMessageLength: 50,
      };

      const errorLens = new MonacoErrorLens(mockEditor, mockMonaco, options);
      const config = errorLens.getConfig();

      expect(config.enableInlineMessages).toBe(false);
      expect(config.enableGutterIcons).toBe(false);
      expect(config.maxMessageLength).toBe(50);
      expect(config.enableLineHighlights).toBe(DEFAULT_OPTIONS.enableLineHighlights);
    });

    it('should not initialize when disabled', () => {
      const options: ErrorLensOptions = {
        enabled: false,
      };

      const errorLens = new MonacoErrorLens(mockEditor, mockMonaco, options);
      
      expect(errorLens.isActive()).toBe(false);
    });
  });

  describe('configuration', () => {
    it('should return correct configuration', () => {
      const errorLens = new MonacoErrorLens(mockEditor, mockMonaco);
      const config = errorLens.getConfig();

      expect(config.enabled).toBe(true);
      expect(config.enableInlineMessages).toBe(DEFAULT_OPTIONS.enableInlineMessages);
      expect(config.enableLineHighlights).toBe(DEFAULT_OPTIONS.enableLineHighlights);
      expect(config.enableGutterIcons).toBe(DEFAULT_OPTIONS.enableGutterIcons);
    });

    it('should return immutable config copy', () => {
      const errorLens = new MonacoErrorLens(mockEditor, mockMonaco);
      const config1 = errorLens.getConfig();
      const config2 = errorLens.getConfig();

      expect(config1).not.toBe(config2); // Different objects
      expect(config1).toEqual(config2); // Same content
    });
  });

  describe('updateOptions', () => {
    it('should update configuration options', () => {
      const errorLens = new MonacoErrorLens(mockEditor, mockMonaco);
      
      errorLens.updateOptions({
        enableInlineMessages: false,
        maxMessageLength: 100,
      });

      const config = errorLens.getConfig();
      expect(config.enableInlineMessages).toBe(false);
      expect(config.maxMessageLength).toBe(100);
    });

    it('should handle enabling/disabling', () => {
      const errorLens = new MonacoErrorLens(mockEditor, mockMonaco, { enabled: false });
      expect(errorLens.isActive()).toBe(false);
      
      errorLens.updateOptions({ enabled: true });
      expect(errorLens.isActive()).toBe(true);
      
      errorLens.updateOptions({ enabled: false });
      expect(errorLens.isActive()).toBe(false);
    });
  });

  describe('enable/disable/toggle', () => {
    it('should enable Error Lens', () => {
      const errorLens = new MonacoErrorLens(mockEditor, mockMonaco, { enabled: false });
      
      errorLens.enable();
      
      expect(errorLens.getConfig().enabled).toBe(true);
      expect(errorLens.isActive()).toBe(true);
    });

    it('should disable Error Lens', () => {
      const errorLens = new MonacoErrorLens(mockEditor, mockMonaco);
      
      errorLens.disable();
      
      expect(errorLens.getConfig().enabled).toBe(false);
      expect(errorLens.isActive()).toBe(false);
    });

    it('should toggle Error Lens on and off', () => {
      const errorLens = new MonacoErrorLens(mockEditor, mockMonaco);
      
      const result1 = errorLens.toggle();
      expect(result1).toBe(false);
      expect(errorLens.getConfig().enabled).toBe(false);
      
      const result2 = errorLens.toggle();
      expect(result2).toBe(true);
      expect(errorLens.getConfig().enabled).toBe(true);
    });
  });

  describe('refresh', () => {
    it('should force update decorations', () => {
      const errorLens = new MonacoErrorLens(mockEditor, mockMonaco);
      const deltaDecorationsSpy = vi.spyOn(mockEditor, 'deltaDecorations');
      
      errorLens.refresh();
      
      expect(deltaDecorationsSpy).toHaveBeenCalled();
    });
  });

  describe('event system', () => {
    it('should provide event emitter', () => {
      const errorLens = new MonacoErrorLens(mockEditor, mockMonaco);
      const eventEmitter = errorLens.getEventEmitter();
      
      expect(eventEmitter).toBeDefined();
      expect(typeof eventEmitter.on).toBe('function');
      expect(typeof eventEmitter.emit).toBe('function');
    });

    it('should emit events on configuration changes', () => {
      const errorLens = new MonacoErrorLens(mockEditor, mockMonaco);
      const eventEmitter = errorLens.getEventEmitter();
      
      const mockListener = vi.fn();
      eventEmitter.on('config-updated', mockListener);
      
      errorLens.updateOptions({ enableInlineMessages: false });
      
      expect(mockListener).toHaveBeenCalled();
    });
  });

  describe('dispose', () => {
    it('should dispose cleanly', () => {
      const errorLens = new MonacoErrorLens(mockEditor, mockMonaco);
      
      expect(errorLens.isActive()).toBe(true);
      
      errorLens.dispose();
      
      expect(errorLens.isActive()).toBe(false);
      expect(mockEditor.deltaDecorations).toHaveBeenCalledWith(expect.any(Array), []);
    });

    it('should be safe to call dispose multiple times', () => {
      const errorLens = new MonacoErrorLens(mockEditor, mockMonaco);
      
      errorLens.dispose();
      errorLens.dispose(); // Should not throw
      
      expect(errorLens.isActive()).toBe(false);
    });
  });
});
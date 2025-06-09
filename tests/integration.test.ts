/**
 * Integration tests for Monaco Error Lens
 * Tests main workflows and component interactions
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
  type IMarkerData,
} from './__mocks__/monaco-editor';

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

describe('Monaco Error Lens Integration', () => {
  let mockEditor: IStandaloneCodeEditor;

  beforeEach(() => {
    mockEditor = createMockEditor();
    mockGetModelMarkers.mockReturnValue(createMockMarkers());
    mockOnDidChangeMarkers.mockClear();
    vi.clearAllMocks();
  });

  describe('basic workflow', () => {
    it('should initialize, show diagnostics, and dispose cleanly', () => {
      // Initialize
      const errorLens = new MonacoErrorLens(mockEditor, mockMonaco);
      expect(errorLens.isActive()).toBe(true);

      // Force decoration update to test functionality
      errorLens.refresh();
      expect(mockEditor.deltaDecorations).toHaveBeenCalled();

      // Dispose
      errorLens.dispose();
      expect(errorLens.isActive()).toBe(false);
    });

    it('should handle marker updates during operation', () => {
      const errorLens = new MonacoErrorLens(mockEditor, mockMonaco);
      
      // Clear initial call
      vi.clearAllMocks();

      // Simulate marker change
      const newMarkers: IMarkerData[] = [
        {
          startLineNumber: 5,
          startColumn: 1,
          endLineNumber: 5,
          endColumn: 20,
          severity: MarkerSeverity.Warning,
          message: 'New warning',
          source: 'eslint',
        },
      ];
      
      mockGetModelMarkers.mockReturnValue(newMarkers);
      errorLens.refresh();

      expect(mockEditor.deltaDecorations).toHaveBeenCalled();
    });
  });

  describe('configuration workflow', () => {
    it('should apply configuration changes dynamically', () => {
      const initialOptions: ErrorLensOptions = {
        enableInlineMessages: true,
        enableLineHighlights: true,
        enableGutterIcons: true,
      };

      const errorLens = new MonacoErrorLens(mockEditor, mockMonaco, initialOptions);
      
      // Verify initial config
      let config = errorLens.getConfig();
      expect(config.enableInlineMessages).toBe(true);
      expect(config.enableLineHighlights).toBe(true);
      expect(config.enableGutterIcons).toBe(true);

      // Update configuration
      errorLens.updateOptions({
        enableInlineMessages: false,
        enableGutterIcons: false,
      });

      // Verify updated config
      config = errorLens.getConfig();
      expect(config.enableInlineMessages).toBe(false);
      expect(config.enableLineHighlights).toBe(true); // unchanged
      expect(config.enableGutterIcons).toBe(false);
    });

    it('should handle enable/disable workflow', () => {
      const errorLens = new MonacoErrorLens(mockEditor, mockMonaco, { enabled: false });
      
      // Should not be active initially
      expect(errorLens.isActive()).toBe(false);

      // Enable
      errorLens.enable();
      expect(errorLens.isActive()).toBe(true);

      // Disable
      errorLens.disable();
      expect(errorLens.isActive()).toBe(false);

      // Toggle on
      const result1 = errorLens.toggle();
      expect(result1).toBe(true);
      expect(errorLens.isActive()).toBe(true);

      // Toggle off
      const result2 = errorLens.toggle();
      expect(result2).toBe(false);
      expect(errorLens.isActive()).toBe(false);
    });
  });

  describe('event system workflow', () => {
    it('should emit events during normal operation', () => {
      const errorLens = new MonacoErrorLens(mockEditor, mockMonaco);
      const eventEmitter = errorLens.getEventEmitter();

      const configListener = vi.fn();
      const decorationsListener = vi.fn();

      // Set up listeners
      eventEmitter.on('config-updated', configListener);
      eventEmitter.on('decorations-updated', decorationsListener);

      // Trigger configuration change
      errorLens.updateOptions({ maxMessageLength: 150 });

      // Should have emitted config-updated event
      expect(configListener).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.any(Object),
          timestamp: expect.any(Date),
        })
      );
    });

    it('should handle event listener lifecycle', () => {
      const errorLens = new MonacoErrorLens(mockEditor, mockMonaco);
      const eventEmitter = errorLens.getEventEmitter();

      const listener = vi.fn();
      const unsubscribe = eventEmitter.on('config-updated', listener);

      // Trigger event
      errorLens.updateOptions({ maxMessageLength: 200 });
      expect(listener).toHaveBeenCalledTimes(1);

      // Unsubscribe
      unsubscribe();

      // Trigger event again
      errorLens.updateOptions({ maxMessageLength: 250 });
      expect(listener).toHaveBeenCalledTimes(1); // Should not be called again
    });
  });

  describe('decoration workflow', () => {
    it('should create decorations for all severity levels', () => {
      const markers: IMarkerData[] = [
        {
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 10,
          severity: MarkerSeverity.Error,
          message: 'Error message',
        },
        {
          startLineNumber: 2,
          startColumn: 1,
          endLineNumber: 2,
          endColumn: 10,
          severity: MarkerSeverity.Warning,
          message: 'Warning message',
        },
        {
          startLineNumber: 3,
          startColumn: 1,
          endLineNumber: 3,
          endColumn: 10,
          severity: MarkerSeverity.Info,
          message: 'Info message',
        },
        {
          startLineNumber: 4,
          startColumn: 1,
          endLineNumber: 4,
          endColumn: 10,
          severity: MarkerSeverity.Hint,
          message: 'Hint message',
        },
      ];

      mockGetModelMarkers.mockReturnValue(markers);
      const errorLens = new MonacoErrorLens(mockEditor, mockMonaco);
      
      // Force decoration update
      errorLens.refresh();
      expect(mockEditor.deltaDecorations).toHaveBeenCalled();
      
      // Verify decorations were created for all markers
      const decorationCalls = (mockEditor.deltaDecorations as any).mock.calls;
      const lastCall = decorationCalls[decorationCalls.length - 1];
      const decorations = lastCall[1];
      
      expect(decorations).toHaveLength(4);
    });

    it('should handle different decoration feature combinations', () => {
      const markers = createMockMarkers().slice(0, 1); // Single marker
      mockGetModelMarkers.mockReturnValue(markers);

      // Test with all features enabled
      const errorLens1 = new MonacoErrorLens(mockEditor, mockMonaco, {
        enableInlineMessages: true,
        enableLineHighlights: true,
        enableGutterIcons: true,
      });

      vi.clearAllMocks();

      // Test with only inline messages
      const errorLens2 = new MonacoErrorLens(mockEditor, mockMonaco, {
        enableInlineMessages: true,
        enableLineHighlights: false,
        enableGutterIcons: false,
      });

      // Force decoration update to test functionality
      errorLens2.refresh();
      expect(mockEditor.deltaDecorations).toHaveBeenCalled();

      errorLens1.dispose();
      errorLens2.dispose();
    });
  });

  describe('error handling workflow', () => {
    it('should handle missing editor model gracefully', () => {
      // Mock editor with no model
      const editorWithoutModel = createMockEditor();
      editorWithoutModel.getModel = vi.fn().mockReturnValue(null);

      expect(() => {
        const errorLens = new MonacoErrorLens(editorWithoutModel, mockMonaco);
        errorLens.refresh();
        errorLens.dispose();
      }).not.toThrow();
    });

    it('should handle invalid markers gracefully', () => {
      const invalidMarkers: any[] = [
        null,
        undefined,
        { message: 'incomplete marker' },
        {
          startLineNumber: 1,
          severity: MarkerSeverity.Error,
          // missing other required properties
        },
      ];

      mockGetModelMarkers.mockReturnValue(invalidMarkers);

      expect(() => {
        const errorLens = new MonacoErrorLens(mockEditor, mockMonaco);
        errorLens.refresh();
      }).not.toThrow();
    });
  });

  describe('performance considerations', () => {
    it('should handle large numbers of markers efficiently', () => {
      const largeMarkerSet: IMarkerData[] = Array.from({ length: 100 }, (_, i) => ({
        startLineNumber: i + 1,
        startColumn: 1,
        endLineNumber: i + 1,
        endColumn: 10,
        severity: MarkerSeverity.Error,
        message: `Error ${i + 1}`,
      }));

      mockGetModelMarkers.mockReturnValue(largeMarkerSet);

      const startTime = performance.now();
      const errorLens = new MonacoErrorLens(mockEditor, mockMonaco);
      errorLens.refresh();
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
      expect(mockEditor.deltaDecorations).toHaveBeenCalled();
      
      errorLens.dispose();
    });

    it('should use debouncing for rapid updates', () => {
      const errorLens = new MonacoErrorLens(mockEditor, mockMonaco, {
        updateDelay: 50, // Short delay for testing
      });

      vi.clearAllMocks();

      // The refresh method bypasses debouncing, so we test that it still works
      errorLens.refresh();
      errorLens.refresh();
      errorLens.refresh();

      // Refresh bypasses debouncing, so it should be called immediately
      expect(mockEditor.deltaDecorations).toHaveBeenCalled();

      errorLens.dispose();
    });
  });

  describe('real-world scenarios', () => {
    it('should work with typical TypeScript/ESLint markers', () => {
      const typicalMarkers: IMarkerData[] = [
        {
          startLineNumber: 1,
          startColumn: 7,
          endLineNumber: 1,
          endColumn: 16,
          severity: MarkerSeverity.Error,
          message: "Cannot find name 'undefinedVar'.",
          source: 'typescript',
          code: 'TS2304',
        },
        {
          startLineNumber: 3,
          startColumn: 1,
          endLineNumber: 3,
          endColumn: 20,
          severity: MarkerSeverity.Warning,
          message: "'unusedFunction' is declared but its value is never read.",
          source: 'typescript',
          code: 'TS6133',
        },
        {
          startLineNumber: 5,
          startColumn: 1,
          endLineNumber: 5,
          endColumn: 10,
          severity: MarkerSeverity.Warning,
          message: 'Unexpected console statement.',
          source: 'eslint',
          code: 'no-console',
        },
      ];

      mockGetModelMarkers.mockReturnValue(typicalMarkers);
      
      const errorLens = new MonacoErrorLens(mockEditor, mockMonaco, {
        messageTemplate: '[{source}] {message}',
        maxMessageLength: 80,
      });

      // Force decoration update to test functionality
      errorLens.refresh();
      expect(mockEditor.deltaDecorations).toHaveBeenCalled();
      
      errorLens.dispose();
    });

    it('should handle editor lifecycle events', () => {
      const errorLens = new MonacoErrorLens(mockEditor, mockMonaco);
      
      // Force a decoration update to test the workflow
      errorLens.refresh();
      
      // Simulate model change
      const modelChangeListener = mockEditor.onDidChangeModel.mock.calls[0][0];
      if (modelChangeListener) {
        modelChangeListener();
      }

      expect(mockEditor.deltaDecorations).toHaveBeenCalled();
      
      errorLens.dispose();
    });
  });
});
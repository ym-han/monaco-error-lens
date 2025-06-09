/**
 * Comprehensive tests for DecorationManager
 * Tests decoration creation, management, and Monaco integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DecorationManager } from '../src/decorations';
import { DEFAULT_OPTIONS, CSS_CLASSES } from '../src/types';
import type { ErrorLensConfig } from '../src/types';
import {
  createMockEditor,
  createMockMarkers,
  MarkerSeverity,
  Range,
  type IStandaloneCodeEditor,
  type IMarkerData,
  type IModelDeltaDecoration,
} from './__mocks__/monaco-editor';

// Mock global monaco
(global as any).monaco = {
  editor: {
    TrackedRangeStickiness: {
      NeverGrowsWhenTypingAtEdges: 1,
    },
  },
  Range: Range,
};

describe('DecorationManager', () => {
  let mockEditor: IStandaloneCodeEditor;
  let config: ErrorLensConfig;
  let decorationManager: DecorationManager;

  beforeEach(() => {
    mockEditor = createMockEditor();
    config = { ...DEFAULT_OPTIONS };
    decorationManager = new DecorationManager(mockEditor, config);
  });

  describe('constructor', () => {
    it('should initialize with correct dependencies', () => {
      expect(decorationManager).toBeInstanceOf(DecorationManager);
      expect(decorationManager.getDecorationCount()).toBe(0);
    });
  });

  describe('updateDecorations', () => {
    it('should create decorations from markers', () => {
      const markers = createMockMarkers();
      decorationManager.updateDecorations(markers);

      expect(mockEditor.deltaDecorations).toHaveBeenCalledWith(
        [],
        expect.arrayContaining([
          expect.objectContaining({
            range: expect.objectContaining({
              startLineNumber: expect.any(Number),
              startColumn: expect.any(Number),
              endLineNumber: expect.any(Number),
              endColumn: expect.any(Number),
            }),
            options: expect.objectContaining({
              stickiness: 1,
            }),
          }),
        ])
      );
      expect(decorationManager.getDecorationCount()).toBeGreaterThan(0);
    });

    it('should handle empty markers array', () => {
      decorationManager.updateDecorations([]);

      expect(mockEditor.deltaDecorations).toHaveBeenCalledWith([], []);
      expect(decorationManager.getDecorationCount()).toBe(0);
    });

    it('should update existing decorations', () => {
      const markers1 = createMockMarkers();
      const markers2: IMarkerData[] = [
        {
          startLineNumber: 5,
          startColumn: 1,
          endLineNumber: 5,
          endColumn: 20,
          severity: MarkerSeverity.Error,
          message: 'New error',
          source: 'test',
        },
      ];

      // First update
      decorationManager.updateDecorations(markers1);
      const firstCall = (mockEditor.deltaDecorations as any).mock.calls[0];

      // Second update
      decorationManager.updateDecorations(markers2);
      const secondCall = (mockEditor.deltaDecorations as any).mock.calls[1];

      expect(secondCall[0]).toEqual(['decoration-1', 'decoration-2']); // Previous decorations
      expect(secondCall[1]).toHaveLength(1); // New decorations
    });

    it('should group markers by line correctly', () => {
      const markers: IMarkerData[] = [
        {
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 10,
          severity: MarkerSeverity.Error,
          message: 'Error 1',
        },
        {
          startLineNumber: 1,
          startColumn: 11,
          endLineNumber: 1,
          endColumn: 20,
          severity: MarkerSeverity.Warning,
          message: 'Warning 1',
        },
        {
          startLineNumber: 2,
          startColumn: 1,
          endLineNumber: 2,
          endColumn: 10,
          severity: MarkerSeverity.Info,
          message: 'Info 1',
        },
      ];

      decorationManager.updateDecorations(markers);

      const decorations = (mockEditor.deltaDecorations as any).mock.calls[0][1];
      
      // Should have decorations for lines 1 and 2
      expect(decorations).toHaveLength(2);
      expect(decorations[0].range.startLineNumber).toBe(1);
      expect(decorations[1].range.startLineNumber).toBe(2);
    });
  });

  describe('decoration options', () => {
    it('should include line highlighting when enabled', () => {
      config.enableLineHighlights = true;
      decorationManager = new DecorationManager(mockEditor, config);
      
      const markers = createMockMarkers().slice(0, 1); // Single marker
      decorationManager.updateDecorations(markers);

      const decorations = (mockEditor.deltaDecorations as any).mock.calls[0][1];
      const decoration = decorations[0];

      expect(decoration.options.isWholeLine).toBe(true);
      expect(decoration.options.className).toContain(CSS_CLASSES.LINE);
      expect(decoration.options.className).toContain('error');
    });

    it('should not include line highlighting when disabled', () => {
      config.enableLineHighlights = false;
      decorationManager = new DecorationManager(mockEditor, config);
      
      const markers = createMockMarkers().slice(0, 1);
      decorationManager.updateDecorations(markers);

      const decorations = (mockEditor.deltaDecorations as any).mock.calls[0][1];
      const decoration = decorations[0];

      expect(decoration.options.isWholeLine).toBeUndefined();
      expect(decoration.options.className).toBeUndefined();
    });

    it('should include inline messages when enabled', () => {
      config.enableInlineMessages = true;
      decorationManager = new DecorationManager(mockEditor, config);
      
      const markers = createMockMarkers().slice(0, 1);
      decorationManager.updateDecorations(markers);

      const decorations = (mockEditor.deltaDecorations as any).mock.calls[0][1];
      const decoration = decorations[0];

      expect(decoration.options.after).toBeDefined();
      expect(decoration.options.after.content).toContain('Test error message');
      expect(decoration.options.after.inlineClassName).toContain(CSS_CLASSES.MESSAGE);
    });

    it('should not include inline messages when disabled', () => {
      config.enableInlineMessages = false;
      decorationManager = new DecorationManager(mockEditor, config);
      
      const markers = createMockMarkers().slice(0, 1);
      decorationManager.updateDecorations(markers);

      const decorations = (mockEditor.deltaDecorations as any).mock.calls[0][1];
      const decoration = decorations[0];

      expect(decoration.options.after).toBeUndefined();
    });

    it('should include gutter icons when enabled', () => {
      config.enableGutterIcons = true;
      decorationManager = new DecorationManager(mockEditor, config);
      
      const markers = createMockMarkers().slice(0, 1);
      decorationManager.updateDecorations(markers);

      const decorations = (mockEditor.deltaDecorations as any).mock.calls[0][1];
      const decoration = decorations[0];

      expect(decoration.options.glyphMarginClassName).toContain(CSS_CLASSES.GUTTER);
      expect(decoration.options.glyphMarginClassName).toContain('error');
    });


    it('should create hover messages', () => {
      const markers = createMockMarkers().slice(0, 1);
      decorationManager.updateDecorations(markers);

      const decorations = (mockEditor.deltaDecorations as any).mock.calls[0][1];
      const decoration = decorations[0];

      expect(decoration.options.hoverMessage).toBeDefined();
      expect(decoration.options.hoverMessage.value).toContain('**Error**');
      expect(decoration.options.hoverMessage.value).toContain('Test error message');
    });

    it('should create multi-marker hover messages', () => {
      const markers: IMarkerData[] = [
        {
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 10,
          severity: MarkerSeverity.Error,
          message: 'Error message',
          source: 'typescript',
        },
        {
          startLineNumber: 1,
          startColumn: 11,
          endLineNumber: 1,
          endColumn: 20,
          severity: MarkerSeverity.Warning,
          message: 'Warning message',
          source: 'eslint',
        },
      ];

      decorationManager.updateDecorations(markers);

      const decorations = (mockEditor.deltaDecorations as any).mock.calls[0][1];
      const decoration = decorations[0];

      expect(decoration.options.hoverMessage.value).toContain('**Error**');
      expect(decoration.options.hoverMessage.value).toContain('**Warning**');
      expect(decoration.options.hoverMessage.value).toContain('[typescript]');
      expect(decoration.options.hoverMessage.value).toContain('[eslint]');
    });
  });


  describe('severity handling', () => {
    it('should handle all severity levels', () => {
      const markers: IMarkerData[] = [
        {
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 10,
          severity: MarkerSeverity.Error,
          message: 'Error',
        },
        {
          startLineNumber: 2,
          startColumn: 1,
          endLineNumber: 2,
          endColumn: 10,
          severity: MarkerSeverity.Warning,
          message: 'Warning',
        },
        {
          startLineNumber: 3,
          startColumn: 1,
          endLineNumber: 3,
          endColumn: 10,
          severity: MarkerSeverity.Info,
          message: 'Info',
        },
        {
          startLineNumber: 4,
          startColumn: 1,
          endLineNumber: 4,
          endColumn: 10,
          severity: MarkerSeverity.Hint,
          message: 'Hint',
        },
      ];

      decorationManager.updateDecorations(markers);

      const decorations = (mockEditor.deltaDecorations as any).mock.calls[0][1];
      
      expect(decorations).toHaveLength(4);
      expect(decorations[0].options.className).toContain('error');
      expect(decorations[1].options.className).toContain('warning');
      expect(decorations[2].options.className).toContain('info');
      expect(decorations[3].options.className).toContain('hint');
    });

    it('should prioritize higher severity markers on same line', () => {
      const markers: IMarkerData[] = [
        {
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 10,
          severity: MarkerSeverity.Info,
          message: 'Info',
        },
        {
          startLineNumber: 1,
          startColumn: 11,
          endLineNumber: 1,
          endColumn: 20,
          severity: MarkerSeverity.Error,
          message: 'Error',
        },
        {
          startLineNumber: 1,
          startColumn: 21,
          endLineNumber: 1,
          endColumn: 30,
          severity: MarkerSeverity.Warning,
          message: 'Warning',
        },
      ];

      decorationManager.updateDecorations(markers);

      const decorations = (mockEditor.deltaDecorations as any).mock.calls[0][1];
      
      // Should only have one decoration for the line, using highest severity (Error)
      expect(decorations).toHaveLength(1);
      expect(decorations[0].options.className).toContain('error');
      
      // Hover message should contain all markers
      expect(decorations[0].options.hoverMessage.value).toContain('Error');
      expect(decorations[0].options.hoverMessage.value).toContain('Warning');
      expect(decorations[0].options.hoverMessage.value).toContain('Info');
    });
  });

  describe('message formatting', () => {
    it('should format messages according to template', () => {
      config.messageTemplate = '[{source}] {message}';
      decorationManager = new DecorationManager(mockEditor, config);

      const markers: IMarkerData[] = [
        {
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 10,
          severity: MarkerSeverity.Error,
          message: 'Test error',
          source: 'typescript',
        },
      ];

      decorationManager.updateDecorations(markers);

      const decorations = (mockEditor.deltaDecorations as any).mock.calls[0][1];
      const decoration = decorations[0];

      expect(decoration.options.after.content).toBe('[typescript] Test error');
    });

    it('should truncate long messages', () => {
      config.maxMessageLength = 20;
      decorationManager = new DecorationManager(mockEditor, config);

      const markers: IMarkerData[] = [
        {
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 10,
          severity: MarkerSeverity.Error,
          message: 'This is a very long error message that should be truncated',
        },
      ];

      decorationManager.updateDecorations(markers);

      const decorations = (mockEditor.deltaDecorations as any).mock.calls[0][1];
      const decoration = decorations[0];

      expect(decoration.options.after.content.length).toBeLessThanOrEqual(20);
      expect(decoration.options.after.content).toContain('...');
    });
  });

  describe('clearDecorations', () => {
    it('should clear all decorations', () => {
      const markers = createMockMarkers();
      decorationManager.updateDecorations(markers);
      
      expect(decorationManager.getDecorationCount()).toBeGreaterThan(0);
      
      decorationManager.clearDecorations();
      
      expect(mockEditor.deltaDecorations).toHaveBeenLastCalledWith(
        ['decoration-1', 'decoration-2'],
        []
      );
      expect(decorationManager.getDecorationCount()).toBe(0);
    });
  });

  describe('configuration updates', () => {
    it('should update configuration', () => {
      const newConfig = { ...config, enableInlineMessages: false };
      
      decorationManager.updateConfig(newConfig);
      
      // Verify that subsequent decoration updates use new config
      const markers = createMockMarkers().slice(0, 1);
      decorationManager.updateDecorations(markers);

      const decorations = (mockEditor.deltaDecorations as any).mock.calls[0][1];
      const decoration = decorations[0];

      expect(decoration.options.after).toBeUndefined();
    });

  });

  describe('edge cases', () => {
    it('should handle markers with missing properties', () => {
      const incompleteMarkers: Partial<IMarkerData>[] = [
        {
          startLineNumber: 1,
          severity: MarkerSeverity.Error,
          message: 'Error without complete range',
        },
        {
          startLineNumber: 2,
          startColumn: 1,
          endLineNumber: 2,
          endColumn: 10,
          severity: MarkerSeverity.Warning,
          // Missing message
        },
      ];

      expect(() => {
        decorationManager.updateDecorations(incompleteMarkers as IMarkerData[]);
      }).not.toThrow();
    });

    it('should handle zero-length ranges', () => {
      const markers: IMarkerData[] = [
        {
          startLineNumber: 1,
          startColumn: 5,
          endLineNumber: 1,
          endColumn: 5,
          severity: MarkerSeverity.Error,
          message: 'Zero-length range',
        },
      ];

      expect(() => {
        decorationManager.updateDecorations(markers);
      }).not.toThrow();
    });

    it('should handle multi-line ranges', () => {
      const markers: IMarkerData[] = [
        {
          startLineNumber: 1,
          startColumn: 5,
          endLineNumber: 3,
          endColumn: 10,
          severity: MarkerSeverity.Error,
          message: 'Multi-line error',
        },
      ];

      decorationManager.updateDecorations(markers);

      const decorations = (mockEditor.deltaDecorations as any).mock.calls[0][1];
      expect(decorations).toHaveLength(1);
      expect(decorations[0].range.startLineNumber).toBe(1);
    });

    it('should handle markers with object-style code', () => {
      const markers: IMarkerData[] = [
        {
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 10,
          severity: MarkerSeverity.Error,
          message: 'Error with object code',
          code: { value: 'TS2304' },
        },
      ];

      expect(() => {
        decorationManager.updateDecorations(markers);
      }).not.toThrow();
    });
  });

  describe('performance considerations', () => {
    it('should handle large numbers of markers efficiently', () => {
      const largeMarkerSet: IMarkerData[] = Array.from({ length: 1000 }, (_, i) => ({
        startLineNumber: i + 1,
        startColumn: 1,
        endLineNumber: i + 1,
        endColumn: 10,
        severity: MarkerSeverity.Error,
        message: `Error ${i + 1}`,
      }));

      const startTime = performance.now();
      decorationManager.updateDecorations(largeMarkerSet);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
      expect(decorationManager.getDecorationCount()).toBe(1000);
    });

    it('should not create unnecessary decorations for duplicate line markers', () => {
      const duplicateLineMarkers: IMarkerData[] = Array.from({ length: 10 }, (_, i) => ({
        startLineNumber: 1, // All on same line
        startColumn: i * 5 + 1,
        endLineNumber: 1,
        endColumn: i * 5 + 5,
        severity: MarkerSeverity.Error,
        message: `Error ${i + 1}`,
      }));

      decorationManager.updateDecorations(duplicateLineMarkers);

      const decorations = (mockEditor.deltaDecorations as any).mock.calls[0][1];
      
      // Should only have one line decoration despite 10 markers
      expect(decorations).toHaveLength(1);
    });
  });
});
/**
 * Tests for utility functions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getSeverityClass,
  formatMessage,
  debounce,
  throttle,
  escapeHtml,
  createId,
  mergeOptions,
  sortMarkers,
  groupMarkersByLine,
  countMarkersBySeverity,
} from '../src/utils';
import { DEFAULT_OPTIONS, SEVERITY_LEVELS } from '../src/types';
import type { ErrorLensOptions } from '../src/types';
import { Range, MarkerSeverity, type IMarkerData } from '../tests/__mocks__/monaco-editor';

describe('utils', () => {
  describe('getSeverityClass', () => {
    it('should return correct class for each severity level', () => {
      expect(getSeverityClass(SEVERITY_LEVELS.ERROR)).toBe('error');
      expect(getSeverityClass(SEVERITY_LEVELS.WARNING)).toBe('warning');
      expect(getSeverityClass(SEVERITY_LEVELS.INFO)).toBe('info');
      expect(getSeverityClass(SEVERITY_LEVELS.HINT)).toBe('hint');
    });

    it('should return unknown for invalid severity', () => {
      expect(getSeverityClass(999 as any)).toBe('unknown');
    });
  });

  describe('formatMessage', () => {
    const mockMarker: IMarkerData = {
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: 1,
      endColumn: 10,
      severity: MarkerSeverity.Error,
      message: 'Test error message',
      source: 'typescript',
      code: 'TS2304',
    };

    it('should format message with default template', () => {
      const result = formatMessage(mockMarker);
      expect(result).toBe('Test error message');
    });

    it('should format message with custom template', () => {
      const result = formatMessage(mockMarker, '[{source}] {message} ({code})');
      expect(result).toBe('[typescript] Test error message (TS2304)');
    });

    it('should handle missing source and code', () => {
      const markerWithoutSourceCode = { ...mockMarker, source: undefined, code: undefined };
      const result = formatMessage(markerWithoutSourceCode, '[{source}] {message} ({code})');
      expect(result).toBe('[] Test error message ()');
    });

    it('should truncate long messages', () => {
      const longMessage = 'This is a very long error message that should be truncated';
      const markerWithLongMessage = { ...mockMarker, message: longMessage };
      const result = formatMessage(markerWithLongMessage, '{message}', 20);
      expect(result).toBe('This is a very lo...');
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.useRealTimers();
    });

    it('should debounce function calls', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.useRealTimers();
    });

    it('should throttle function calls', () => {
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(mockFn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);
      throttledFn();
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
      expect(escapeHtml('&amp;')).toBe('&amp;amp;');
      expect(escapeHtml('"quotes"')).toBe('"quotes"');
    });
  });

  describe('createId', () => {
    it('should create unique IDs', () => {
      const id1 = createId();
      const id2 = createId();
      
      expect(id1).toMatch(/^error-lens-\d+-[a-z0-9]+$/);
      expect(id2).toMatch(/^error-lens-\d+-[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('mergeOptions', () => {
    it('should merge options correctly', () => {
      const userOptions: ErrorLensOptions = {
        enableInlineMessages: false,
        maxMessageLength: 100,
        colors: {
          error: {
            foreground: '#ff0000',
          },
        },
      };

      const merged = mergeOptions(DEFAULT_OPTIONS, userOptions);

      expect(merged.enableInlineMessages).toBe(false);
      expect(merged.maxMessageLength).toBe(100);
      expect(merged.enableLineHighlights).toBe(DEFAULT_OPTIONS.enableLineHighlights);
      expect(merged.colors.error.foreground).toBe('#ff0000');
      expect(merged.colors.error.background).toBe(DEFAULT_OPTIONS.colors.error.background);
    });
  });


  describe('sortMarkers', () => {
    it('should sort markers by line number and severity', () => {
      const markers: IMarkerData[] = [
        {
          startLineNumber: 2,
          startColumn: 1,
          endLineNumber: 2,
          endColumn: 10,
          severity: MarkerSeverity.Warning,
          message: 'Warning on line 2',
        },
        {
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 10,
          severity: MarkerSeverity.Error,
          message: 'Error on line 1',
        },
        {
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 10,
          severity: MarkerSeverity.Info,
          message: 'Info on line 1',
        },
      ];

      const sorted = sortMarkers(markers);

      expect(sorted[0].startLineNumber).toBe(1);
      expect(sorted[0].severity).toBe(MarkerSeverity.Error);
      expect(sorted[1].startLineNumber).toBe(1);
      expect(sorted[1].severity).toBe(MarkerSeverity.Info);
      expect(sorted[2].startLineNumber).toBe(2);
      expect(sorted[2].severity).toBe(MarkerSeverity.Warning);
    });
  });

  describe('groupMarkersByLine', () => {
    it('should group markers by line number', () => {
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
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 10,
          severity: MarkerSeverity.Warning,
          message: 'Warning 1',
        },
        {
          startLineNumber: 2,
          startColumn: 1,
          endLineNumber: 2,
          endColumn: 10,
          severity: MarkerSeverity.Info,
          message: 'Info 2',
        },
      ];

      const grouped = groupMarkersByLine(markers);

      expect(grouped.size).toBe(2);
      expect(grouped.get(1)).toHaveLength(2);
      expect(grouped.get(2)).toHaveLength(1);
      expect(grouped.get(1)?.[0].message).toBe('Error 1');
      expect(grouped.get(2)?.[0].message).toBe('Info 2');
    });
  });

  describe('countMarkersBySeverity', () => {
    it('should count markers by severity', () => {
      const markers: IMarkerData[] = [
        { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1, severity: MarkerSeverity.Error, message: 'Error 1' },
        { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1, severity: MarkerSeverity.Error, message: 'Error 2' },
        { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1, severity: MarkerSeverity.Warning, message: 'Warning 1' },
        { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1, severity: MarkerSeverity.Info, message: 'Info 1' },
        { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1, severity: MarkerSeverity.Hint, message: 'Hint 1' },
      ];

      const counts = countMarkersBySeverity(markers);

      expect(counts.errors).toBe(2);
      expect(counts.warnings).toBe(1);
      expect(counts.infos).toBe(1);
      expect(counts.hints).toBe(1);
    });
  });
});
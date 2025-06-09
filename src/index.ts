/**
 * Monaco Error Lens - Visual diagnostic enhancements for Monaco Editor
 *
 * This package provides Error Lens functionality for Monaco Editor, making
 * diagnostics more visually prominent through inline messages, line highlighting,
 * and gutter icons.
 *
 * @packageDocumentation
 */

// Main exports
export { MonacoErrorLens } from './monaco-error-lens';

// Type exports
export type {
  ErrorLensOptions,
  ErrorLensConfig,
  ErrorLensColors,
  MonacoEditor,
  MonacoMarkerData,
  MonacoDisposable,
  MonacoModule,
} from './types';

// Import types for internal use
import type { ErrorLensOptions } from './types';
import { MonacoErrorLens } from './monaco-error-lens';

// Utility exports
export {
  getSeverityClass,
  formatMessage,
  debounce,
  throttle,
  mergeOptions,
  sortMarkers,
  groupMarkersByLine,
  countMarkersBySeverity,
} from './utils';

// Component exports
export { DecorationManager } from './decorations';
export { SimpleEventEmitter } from './event-emitter';

// Constants
export {
  DEFAULT_OPTIONS,
  SEVERITY_LEVELS,
  CSS_CLASSES,
} from './types';

// Version information
export const VERSION = '1.0.0';

/**
 * Check if Monaco Editor is available
 */
export function isMonacoAvailable(): boolean {
  return typeof window !== 'undefined' && !!(window as { monaco?: unknown }).monaco;
}

/**
 * Get Monaco Editor instance (if available)
 */
export function getMonaco(): unknown | null {
  return typeof window !== 'undefined' ? (window as { monaco?: unknown }).monaco ?? null : null;
}

/**
 * Default factory function for easy instantiation
 */
export function createErrorLens(
  editor: import('./types').MonacoEditor,
  monaco: import('./types').MonacoModule,
  options?: ErrorLensOptions,
): MonacoErrorLens {
  return new MonacoErrorLens(editor, monaco, options);
}

/**
 * Quick setup function that applies default configuration
 */
export function setupErrorLens(
  editor: import('./types').MonacoEditor,
  monaco: import('./types').MonacoModule,
  options?: ErrorLensOptions,
): MonacoErrorLens {
  const errorLens = new MonacoErrorLens(editor, monaco, {
    enableInlineMessages: true,
    enableLineHighlights: true,
    enableGutterIcons: true,
    followCursor: 'allLines',
    ...options,
  });

  return errorLens;
}

/**
 * Create Error Lens with minimal features for better performance
 */
export function createMinimalErrorLens(
  editor: import('./types').MonacoEditor,
  monaco: import('./types').MonacoModule,
  options?: ErrorLensOptions,
): MonacoErrorLens {
  return new MonacoErrorLens(editor, monaco, {
    enableInlineMessages: true,
    enableLineHighlights: false,
    enableGutterIcons: false,
    maxMarkersPerLine: 1,
    followCursor: 'activeLine',
    ...options,
  });
}

// Default export
export default MonacoErrorLens;

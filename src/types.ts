// Monaco types for compatibility
export interface MonacoEditor {
  getModel(): MonacoEditorModel | null;
  getPosition(): { lineNumber: number; column: number } | null;
  deltaDecorations(oldDecorations: string[], newDecorations: MonacoDecoration[]): string[];
  onDidChangeCursorPosition(listener: () => void): MonacoDisposable;
  onDidChangeModel(listener: () => void): MonacoDisposable;
}

export interface MonacoEditorModel {
  uri: { toString(): string };
}

export interface MonacoRange {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

export interface MonacoMarkerData {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
  message: string;
  severity: number;
  source?: string;
  code?: string | number;
}

export interface MonacoDecoration {
  range: MonacoRange;
  options: MonacoDecorationOptions;
}

export interface MonacoDecorationOptions {
  isWholeLine?: boolean;
  className?: string;
  glyphMarginClassName?: string;
  after?: {
    content: string;
    inlineClassName: string;
  };
  hoverMessage?: { value: string };
  stickiness?: number;
}

export type MonacoMarkerSeverity = number;
export type MonacoDisposable = { dispose(): void };

/**
 * Configuration options for Monaco Error Lens
 */
export interface ErrorLensOptions {
  /** Enable inline diagnostic messages at the end of lines */
  enableInlineMessages?: boolean;
  /** Enable line background highlighting */
  enableLineHighlights?: boolean;
  /** Enable gutter icons for diagnostics */
  enableGutterIcons?: boolean;
  /** Template for formatting diagnostic messages */
  messageTemplate?: string;
  /** Control which lines to show diagnostics for */
  followCursor?: 'allLines' | 'activeLine';
  /** Maximum number of characters to show in inline messages */
  maxMessageLength?: number;
  /** Maximum number of markers to display per line */
  maxMarkersPerLine?: number;
  /** Filter which severity levels to show */
  severityFilter?: number[];
  /** Custom colors for different diagnostic severities */
  colors?: Partial<ErrorLensColors>;
  /** Delay in milliseconds before updating decorations */
  updateDelay?: number;
  /** Enable or disable the extension */
  enabled?: boolean;
}

/**
 * Color configuration for different diagnostic severities
 */
export interface ErrorLensColors {
  error: {
    background: string;
    foreground: string;
  };
  warning: {
    background: string;
    foreground: string;
  };
  info: {
    background: string;
    foreground: string;
  };
  hint: {
    background: string;
    foreground: string;
  };
}

/**
 * Internal configuration state
 */
export type ErrorLensConfig = Required<ErrorLensOptions>;

/**
 * Severity levels as constants
 */
export const SEVERITY_LEVELS = {
  ERROR: 8,
  WARNING: 4,
  INFO: 2,
  HINT: 1,
} as const;

/**
 * CSS class names used by Error Lens
 */
export const CSS_CLASSES = {
  MESSAGE: 'monaco-error-lens-message',
  LINE: 'monaco-error-lens-line',
  GUTTER: 'monaco-error-lens-gutter',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  HINT: 'hint',
} as const;

/**
 * Default configuration values
 */
export const DEFAULT_OPTIONS: Required<ErrorLensOptions> = {
  enableInlineMessages: true,
  enableLineHighlights: true,
  enableGutterIcons: true,
  messageTemplate: '{message}',
  followCursor: 'allLines',
  maxMessageLength: 200,
  maxMarkersPerLine: 3,
  severityFilter: [8, 4, 2, 1], // All severities
  updateDelay: 100,
  enabled: true,
  colors: {
    error: {
      background: 'rgba(228, 85, 84, 0.15)',
      foreground: '#ff6464',
    },
    warning: {
      background: 'rgba(255, 148, 47, 0.15)',
      foreground: '#fa973a',
    },
    info: {
      background: 'rgba(0, 183, 228, 0.15)',
      foreground: '#00b7e4',
    },
    hint: {
      background: 'rgba(119, 136, 153, 0.15)',
      foreground: '#778899',
    },
  },
} as const;

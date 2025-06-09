/**
 * Mock implementation of Monaco Editor for testing
 */
import { vi } from 'vitest';

export const MarkerSeverity = {
  Hint: 1,
  Info: 2,
  Warning: 4,
  Error: 8,
} as const;

export const TrackedRangeStickiness = {
  AlwaysGrowsWhenTypingAtEdges: 0,
  NeverGrowsWhenTypingAtEdges: 1,
  GrowsOnlyWhenTypingBefore: 2,
  GrowsOnlyWhenTypingAfter: 3,
} as const;

export class Range {
  public startLineNumber: number;
  public startColumn: number;
  public endLineNumber: number;
  public endColumn: number;

  constructor(
    startLineNumber: number,
    startColumn: number,
    endLineNumber: number,
    endColumn: number
  ) {
    this.startLineNumber = startLineNumber;
    this.startColumn = startColumn;
    this.endLineNumber = endLineNumber;
    this.endColumn = endColumn;
  }
}

export class Uri {
  private _path: string;

  constructor(path: string) {
    this._path = path;
  }

  toString(): string {
    return this._path;
  }

  static parse(path: string): Uri {
    return new Uri(path);
  }
}

export interface IMarkerData {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
  severity: number;
  message: string;
  source?: string;
  code?: string | number | { value: string | number };
}

export interface IModelDeltaDecoration {
  range: Range;
  options: IModelDecorationOptions;
}

export interface IModelDecorationOptions {
  stickiness?: number;
  className?: string;
  glyphMarginClassName?: string;
  isWholeLine?: boolean;
  afterContentClassName?: string;
  after?: {
    content: string;
    inlineClassName?: string;
  };
  hoverMessage?: {
    value: string;
  };
}

export interface IDisposable {
  dispose(): void;
}

export interface IStandaloneCodeEditor {
  getModel(): ITextModel | null;
  deltaDecorations(oldDecorations: string[], newDecorations: IModelDeltaDecoration[]): string[];
  onDidChangeCursorPosition(listener: () => void): IDisposable;
  onDidChangeModel(listener: () => void): IDisposable;
  getPosition(): { lineNumber: number } | null;
}

export interface ITextModel {
  uri: Uri;
}

// Mock editor instance
export const createMockEditor = (): IStandaloneCodeEditor => {
  const mockModel: ITextModel = {
    uri: new Uri('file:///test.ts'),
  };

  const mockEditor: IStandaloneCodeEditor = {
    getModel: vi.fn().mockReturnValue(mockModel),
    deltaDecorations: vi.fn().mockReturnValue(['decoration-1', 'decoration-2']),
    onDidChangeCursorPosition: vi.fn().mockReturnValue({
      dispose: vi.fn(),
    }),
    onDidChangeModel: vi.fn().mockReturnValue({
      dispose: vi.fn(),
    }),
    getPosition: vi.fn().mockReturnValue({ lineNumber: 1 }),
  };

  return mockEditor;
};

// Mock markers
export const createMockMarkers = (): IMarkerData[] => [
  {
    startLineNumber: 1,
    startColumn: 1,
    endLineNumber: 1,
    endColumn: 10,
    severity: MarkerSeverity.Error,
    message: 'Test error message',
    source: 'typescript',
    code: 'TS2304',
  },
  {
    startLineNumber: 2,
    startColumn: 5,
    endLineNumber: 2,
    endColumn: 15,
    severity: MarkerSeverity.Warning,
    message: 'Test warning message',
    source: 'eslint',
    code: 'no-unused-vars',
  },
  {
    startLineNumber: 3,
    startColumn: 1,
    endLineNumber: 3,
    endColumn: 20,
    severity: MarkerSeverity.Info,
    message: 'Test info message',
    source: 'prettier',
  },
];

// Mock editor namespace
export const editor = {
  onDidChangeMarkers: vi.fn().mockReturnValue({
    dispose: vi.fn(),
  }),
  getModelMarkers: vi.fn().mockReturnValue(createMockMarkers()),
  setModelMarkers: vi.fn(),
  TrackedRangeStickiness,
  MarkerSeverity,
};

// Mock global monaco object
const monaco = {
  editor,
  Range,
  Uri,
  MarkerSeverity,
};

// Set up global monaco mock if not already set
if (typeof globalThis !== 'undefined' && !globalThis.monaco) {
  (globalThis as any).monaco = monaco;
}
if (typeof global !== 'undefined' && !(global as any).monaco) {
  (global as any).monaco = monaco;
}
if (typeof window !== 'undefined' && !(window as any).monaco) {
  (window as any).monaco = monaco;
}

export default monaco;
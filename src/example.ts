/**
 * Simple example usage of Monaco Error Lens
 */

import { MonacoErrorLens, setupErrorLens, createMinimalErrorLens } from './index';

// Note: This assumes monaco-editor is available globally as window.monaco
declare const monaco: {
  editor: {
    create: (container: HTMLElement | null, options: unknown) => unknown;
    setModelMarkers: (model: unknown, owner: string, markers: unknown[]) => void;
  };
  MarkerSeverity: {
    Error: number;
    Warning: number;
    Info: number;
    Hint: number;
  };
};

/**
 * Basic usage example
 */
export function basicExample(): void {
  // Create Monaco editor
  const editor = monaco.editor.create(document.getElementById('container'), {
    value: [
      'function example() {',
      '  var unused = "variable";',
      '  console.log("Hello, world!");',
      '  return 42;',
      '}',
    ].join('\n'),
    language: 'typescript',
    glyphMargin: true, // Enable gutter icons
  });

  // Create Error Lens with default options
  const errorLens = new MonacoErrorLens(editor, monaco);

  // Add some sample markers to demonstrate
  monaco.editor.setModelMarkers(editor.getModel(), 'sample', [
    {
      startLineNumber: 2,
      startColumn: 7,
      endLineNumber: 2,
      endColumn: 13,
      message: 'Variable is declared but never used',
      severity: monaco.MarkerSeverity.Warning,
      source: 'typescript',
    },
    {
      startLineNumber: 3,
      startColumn: 3,
      endLineNumber: 3,
      endColumn: 14,
      message: 'Unexpected console statement',
      severity: monaco.MarkerSeverity.Info,
      source: 'eslint',
    },
  ]);

  // Listen to events
  const eventEmitter = errorLens.getEventEmitter();
  eventEmitter.on('decorations-updated', () => {
    // Decorations updated event fired
  });
}

/**
 * Custom configuration example
 */
export function customConfigExample(): void {
  const editor = monaco.editor.create(document.getElementById('container'), {
    value: 'const example = "custom config";',
    language: 'typescript',
    glyphMargin: true,
  });

  // Custom configuration
  new MonacoErrorLens(editor, monaco, {
    enableInlineMessages: true,
    enableLineHighlights: true,
    enableGutterIcons: true,
    messageTemplate: '{message} [{source}]',
    followCursor: 'allLines',
    maxMessageLength: 100,
    maxMarkersPerLine: 2,
    updateDelay: 150,
    colors: {
      error: {
        background: 'rgba(255, 0, 0, 0.1)',
        foreground: '#ff0000',
      },
      warning: {
        background: 'rgba(255, 165, 0, 0.1)',
        foreground: '#ffa500',
      },
    },
  });

  // Add some markers
  monaco.editor.setModelMarkers(editor.getModel(), 'custom', [
    {
      startLineNumber: 1,
      startColumn: 7,
      endLineNumber: 1,
      endColumn: 14,
      message: 'This is a custom error message',
      severity: monaco.MarkerSeverity.Error,
      source: 'custom-linter',
    },
  ]);
}

/**
 * Factory function examples
 */
export function factoryExamples(): void {
  const container = document.getElementById('container');

  // Using setupErrorLens for quick setup
  const editor1 = monaco.editor.create(container, {
    value: 'const setup = "quick";',
    language: 'typescript',
    glyphMargin: true,
  });

  setupErrorLens(editor1, monaco);

  // Using createMinimalErrorLens for performance
  const editor2 = monaco.editor.create(container, {
    value: 'const minimal = "performance";',
    language: 'typescript',
    glyphMargin: true,
  });

  createMinimalErrorLens(editor2, monaco);

  // Add markers to both
  const markers = [
    {
      startLineNumber: 1,
      startColumn: 7,
      endLineNumber: 1,
      endColumn: 12,
      message: 'Sample warning',
      severity: monaco.MarkerSeverity.Warning,
      source: 'sample',
    },
  ];

  monaco.editor.setModelMarkers(editor1.getModel(), 'sample', markers);
  monaco.editor.setModelMarkers(editor2.getModel(), 'sample', markers);
}

/**
 * Dynamic configuration example
 */
export function dynamicConfigExample(): void {
  const editor = monaco.editor.create(document.getElementById('container'), {
    value: 'let dynamic = "configuration";',
    language: 'typescript',
    glyphMargin: true,
  });

  const errorLens = new MonacoErrorLens(editor, monaco);

  // Create UI controls
  const controls = document.createElement('div');
  controls.innerHTML = `
    <div style="padding: 10px; border: 1px solid #ccc; margin: 10px 0;">
      <h3>Error Lens Controls</h3>
      <label>
        <input type="checkbox" id="enable-inline" checked> Inline Messages
      </label><br>
      <label>
        <input type="checkbox" id="enable-highlights" checked> Line Highlights
      </label><br>
      <label>
        <input type="checkbox" id="enable-gutter" checked> Gutter Icons
      </label><br>
      <button id="toggle-error-lens">Toggle Error Lens</button>
      <button id="refresh">Refresh</button>
    </div>
  `;
  document.body.appendChild(controls);

  // Event handlers
  controls.addEventListener('change', () => {
    const inlineMessages = (document.getElementById('enable-inline') as HTMLInputElement).checked;
    const lineHighlights = (document.getElementById('enable-highlights') as HTMLInputElement).checked;
    const gutterIcons = (document.getElementById('enable-gutter') as HTMLInputElement).checked;

    errorLens.updateOptions({
      enableInlineMessages: inlineMessages,
      enableLineHighlights: lineHighlights,
      enableGutterIcons: gutterIcons,
    });
  });

  document.getElementById('toggle-error-lens')?.addEventListener('click', () => {
    errorLens.toggle();
  });

  document.getElementById('refresh')?.addEventListener('click', () => {
    errorLens.refresh();
  });

  // Add sample markers
  monaco.editor.setModelMarkers(editor.getModel(), 'dynamic', [
    {
      startLineNumber: 1,
      startColumn: 5,
      endLineNumber: 1,
      endColumn: 12,
      message: 'Variable should be const instead of let',
      severity: monaco.MarkerSeverity.Warning,
      source: 'eslint',
    },
  ]);
}

/**
 * Run all examples (commented out by default)
 */
export function runExamples(): void {
  // Monaco Error Lens Examples

  // Uncomment the example you want to run:
  // basicExample();
  // customConfigExample();
  // factoryExamples();
  // dynamicConfigExample();
}

// Make examples available globally for testing (in browser environments)
if (typeof globalThis !== 'undefined' && typeof globalThis.window !== 'undefined') {
  (globalThis.window as { MonacoErrorLensExamples?: unknown }).MonacoErrorLensExamples = {
    basicExample,
    customConfigExample,
    factoryExamples,
    dynamicConfigExample,
    runExamples,
  };
}

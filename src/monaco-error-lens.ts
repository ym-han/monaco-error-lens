import type {
  ErrorLensOptions,
  ErrorLensConfig,
  MonacoEditor,
  MonacoMarkerData,
  MonacoDisposable,
  MonacoModule,
} from './types';
import {
  DEFAULT_OPTIONS,
} from './types';
import {
  debounce,
  mergeOptions,
  sortMarkers,
  groupMarkersByLine,
} from './utils';
import { DecorationManager } from './decorations';
import { SimpleEventEmitter } from './event-emitter';

/**
 * Main Monaco Error Lens class that provides visual diagnostic enhancements
 */
export class MonacoErrorLens {
  private editor: MonacoEditor;
  private monaco: MonacoModule;
  private config: ErrorLensConfig;
  private disposables: MonacoDisposable[] = [];
  private isDisposed = false;
  private updateDecorations: () => void;
  private cancelUpdateDecorations: () => void;

  // Component managers
  private decorationManager: DecorationManager;
  private eventEmitter: SimpleEventEmitter;

  constructor(
    editor: MonacoEditor,
    monaco: MonacoModule,
    options: ErrorLensOptions = {},
  ) {
    this.editor = editor;
    this.monaco = monaco;
    this.config = mergeOptions(DEFAULT_OPTIONS, options);

    // Initialize component managers
    this.eventEmitter = new SimpleEventEmitter();
    this.decorationManager = new DecorationManager(this.editor, this.config);

    // Create debounced update function
    const { debouncedFn, cancel } = debounce(
      () => this.updateDecorationsInternal(),
      this.config.updateDelay,
    );
    this.updateDecorations = debouncedFn;
    this.cancelUpdateDecorations = cancel;

    this.initialize();
  }

  /**
   * Initialize the Error Lens instance
   */
  private initialize(): void {
    if (!this.config.enabled) return;

    this.injectStyles();
    this.setupEventListeners();

    // Initial decoration update - only if Monaco is fully initialized
    if (this.isMonacoInitialized()) {
      this.updateDecorations();
    }
  }

  /**
   * Check if Monaco Editor is fully initialized with required APIs
   */
  private isMonacoInitialized(): boolean {
    // Check that Monaco APIs are available and editor has a model
    return !!(
      typeof this.monaco?.editor?.getModelMarkers === 'function' &&
      typeof this.monaco?.editor?.onDidChangeMarkers === 'function' &&
      this.editor.getModel()
    );
  }

  /**
   * Inject CSS styles for Error Lens
   */
  private injectStyles(): void {
    if (typeof document === 'undefined') return;

    const existingStyle = document.getElementById('monaco-error-lens-styles');
    if (existingStyle) return;

    const style = document.createElement('style');
    style.id = 'monaco-error-lens-styles';
    style.textContent = this.generateCSS();
    document.head.appendChild(style);
  }

  /**
   * Generate CSS styles for Error Lens
   */
  private generateCSS(): string {
    const { colors } = this.config;

    // Set CSS custom properties for user-defined colors
    const customProps = this.generateCustomProperties(colors);

    return `
      ${customProps}
      
      /* Monaco Error Lens Styles */
      .monaco-error-lens-message {
        opacity: 0.8;
        font-style: italic;
        margin-left: 1ch;
        pointer-events: none;
      }

      .monaco-error-lens-line-error {
        background-color: var(--monaco-error-lens-error-bg, rgba(228, 85, 84, 0.15));
      }

      .monaco-error-lens-line-warning {
        background-color: var(--monaco-error-lens-warning-bg, rgba(255, 148, 47, 0.15));
      }

      .monaco-error-lens-line-info {
        background-color: var(--monaco-error-lens-info-bg, rgba(0, 183, 228, 0.15));
      }

      .monaco-error-lens-line-hint {
        background-color: var(--monaco-error-lens-hint-bg, rgba(119, 136, 153, 0.15));
      }

      .monaco-error-lens-message-error {
        color: var(--monaco-error-lens-error-fg, #ff6464);
      }

      .monaco-error-lens-message-warning {
        color: var(--monaco-error-lens-warning-fg, #fa973a);
      }

      .monaco-error-lens-message-info {
        color: var(--monaco-error-lens-info-fg, #00b7e4);
      }

      .monaco-error-lens-message-hint {
        color: var(--monaco-error-lens-hint-fg, #778899);
      }

      .monaco-error-lens-gutter-error::before {
        content: '✖';
        font-weight: bold;
        font-size: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background-color: var(--monaco-error-lens-error-fg, #ff6464);
        color: white;
        line-height: 1;
        margin: auto;
      }

      .monaco-error-lens-gutter-warning::before {
        content: '⚠';
        color: var(--monaco-error-lens-warning-fg, #fa973a);
        font-weight: bold;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        margin: auto;
      }

      .monaco-error-lens-gutter-info::before {
        content: 'ⓘ';
        color: var(--monaco-error-lens-info-fg, #00b7e4);
        font-weight: bold;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        margin: auto;
      }

      .monaco-error-lens-gutter-hint::before {
        content: '●';
        color: var(--monaco-error-lens-hint-fg, #778899);
        font-weight: bold;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        margin: auto;
        opacity: 0.7;
      }
    `;
  }

  /**
   * Generate CSS custom properties for user-defined colors
   */
  private generateCustomProperties(colors: ErrorLensConfig['colors']): string {
    const props: string[] = [];

    if (colors.error?.background) {
      props.push(`--monaco-error-lens-error-bg: ${colors.error.background};`);
    }
    if (colors.error?.foreground) {
      props.push(`--monaco-error-lens-error-fg: ${colors.error.foreground};`);
    }
    if (colors.warning?.background) {
      props.push(`--monaco-error-lens-warning-bg: ${colors.warning.background};`);
    }
    if (colors.warning?.foreground) {
      props.push(`--monaco-error-lens-warning-fg: ${colors.warning.foreground};`);
    }
    if (colors.info?.background) {
      props.push(`--monaco-error-lens-info-bg: ${colors.info.background};`);
    }
    if (colors.info?.foreground) {
      props.push(`--monaco-error-lens-info-fg: ${colors.info.foreground};`);
    }
    if (colors.hint?.background) {
      props.push(`--monaco-error-lens-hint-bg: ${colors.hint.background};`);
    }
    if (colors.hint?.foreground) {
      props.push(`--monaco-error-lens-hint-fg: ${colors.hint.foreground};`);
    }

    return props.length > 0 ? `:root {\n        ${props.join('\n        ')}\n      }` : '';
  }

  /**
   * Set up Monaco editor event listeners
   */
  private setupEventListeners(): void {
    if (!this.isMonacoInitialized()) return;

    // Listen for marker changes
    const markerListener = this.monaco.editor.onDidChangeMarkers(
      (resources: { toString(): string }[]) => {
        const model = this.editor.getModel();
        if (model && resources.some(resource => resource.toString() === model.uri.toString())) {
          this.updateDecorations();
        }
      },
    );
    this.disposables.push(markerListener);

    // Listen for cursor position changes if following cursor
    if (this.config.followCursor === 'activeLine') {
      const cursorListener = this.editor.onDidChangeCursorPosition(() => {
        this.updateDecorations();
      });
      this.disposables.push(cursorListener);
    }

    // Listen for model changes
    const modelListener = this.editor.onDidChangeModel(() => {
      this.clearDecorations();
      this.updateDecorations();
    });
    this.disposables.push(modelListener);
  }

  /**
   * Update decorations based on current markers
   */
  private updateDecorationsInternal(): void {
    if (this.isDisposed || !this.config.enabled) return;

    const model = this.editor.getModel();
    if (!model) return;

    if (!this.isMonacoInitialized()) return;

    try {
      // Get current markers
      const markers = this.monaco.editor.getModelMarkers({
        resource: model.uri,
      });

      const markersArray = markers ?? [];

      // Filter markers
      const filteredMarkers = this.filterMarkers(markersArray);

      // Update decorations through decoration manager
      this.decorationManager.updateDecorations(filteredMarkers);

      // Emit decorations updated event
      this.eventEmitter.emit('decorations-updated', {
        decorationCount: this.decorationManager.getDecorationCount(),
        markerCount: markersArray.length,
        timestamp: new Date(),
      });

    } catch (error) {
      this.eventEmitter.emit('error', {
        error: error instanceof Error ? error : new Error(String(error)),
        context: 'updateDecorationsInternal',
        timestamp: new Date(),
      });
    }
  }

  /**
   * Filter markers based on configuration
   */
  private filterMarkers(markers: MonacoMarkerData[]): MonacoMarkerData[] {
    let filtered = [...markers];

    // Filter by severity
    filtered = filtered.filter(marker =>
      this.config.severityFilter.includes(marker.severity),
    );

    // Sort markers by line and severity
    filtered = sortMarkers(filtered);

    // Apply cursor-based filtering
    if (this.config.followCursor === 'activeLine') {
      const currentLine = this.editor.getPosition()?.lineNumber;
      if (currentLine) {
        filtered = filtered.filter(marker => marker.startLineNumber === currentLine);
      }
    }

    // Limit markers per line
    if (this.config.maxMarkersPerLine > 0) {
      const lineGroups = groupMarkersByLine(filtered);
      filtered = [];

      for (const lineMarkers of lineGroups.values()) {
        const limited = lineMarkers.slice(0, this.config.maxMarkersPerLine);
        filtered.push(...limited);
      }
    }

    return filtered;
  }

  /**
   * Clear all decorations
   */
  private clearDecorations(): void {
    this.decorationManager.clearDecorations();
  }

  /**
   * Update configuration options
   */
  public updateOptions(newOptions: Partial<ErrorLensOptions>): void {
    const oldEnabled = this.config.enabled;

    this.config = {
      ...this.config,
      ...mergeOptions(this.config, newOptions),
    };

    // Update component managers
    this.decorationManager.updateConfig(this.config);

    // Update debounce delay if changed
    if (newOptions.updateDelay !== undefined) {
      // Cancel existing debounced function
      this.cancelUpdateDecorations();

      const { debouncedFn, cancel } = debounce(
        () => this.updateDecorationsInternal(),
        this.config.updateDelay,
      );
      this.updateDecorations = debouncedFn;
      this.cancelUpdateDecorations = cancel;
    }

    // Re-initialize if needed
    if (newOptions.enabled !== undefined) {
      if (newOptions.enabled && !oldEnabled) {
        this.initialize();
        this.eventEmitter.emit('status-changed', { enabled: true, timestamp: new Date() });
      } else if (!newOptions.enabled && oldEnabled) {
        this.clearDecorations();
        this.eventEmitter.emit('status-changed', { enabled: false, timestamp: new Date() });
      }
    } else {
      this.updateDecorations();
    }

    this.eventEmitter.emit('config-updated', { config: this.config, timestamp: new Date() });
  }

  /**
   * Enable the Error Lens
   */
  public enable(): void {
    if (!this.config.enabled) {
      this.config.enabled = true;
      this.initialize();
    }
  }

  /**
   * Disable the Error Lens
   */
  public disable(): void {
    if (this.config.enabled) {
      this.config.enabled = false;
      this.clearDecorations();
    }
  }

  /**
   * Toggle Error Lens on/off
   */
  public toggle(): boolean {
    if (this.config.enabled) {
      this.disable();
    } else {
      this.enable();
    }
    return this.config.enabled;
  }

  /**
   * Force update decorations immediately
   */
  public refresh(): void {
    this.updateDecorationsInternal();
  }

  /**
   * Get current configuration
   */
  public getConfig(): Readonly<ErrorLensConfig> {
    return { ...this.config };
  }

  /**
   * Get the event emitter for listening to Error Lens events
   */
  public getEventEmitter(): SimpleEventEmitter {
    return this.eventEmitter;
  }

  /**
   * Check if Error Lens is currently active
   */
  public isActive(): boolean {
    return !this.isDisposed && this.config.enabled;
  }

  /**
   * Dispose of the Error Lens instance
   */
  public dispose(): void {
    if (this.isDisposed) return;

    this.isDisposed = true;

    // Cancel any pending debounced updates
    this.cancelUpdateDecorations();

    this.clearDecorations();

    // Dispose of all event listeners
    this.disposables.forEach(disposable => disposable.dispose());
    this.disposables = [];

    // Clean up event emitter
    this.eventEmitter.removeAllListeners();
  }
}

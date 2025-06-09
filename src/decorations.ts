import type {
  ErrorLensConfig,
  MonacoEditor,
  MonacoMarkerData,
  MonacoDecoration,
  MonacoDecorationOptions,
} from './types';
import { CSS_CLASSES } from './types';
import { getSeverityClass, formatMessage } from './utils';

/**
 * Decoration manager for Monaco Error Lens
 * Handles the creation and management of Monaco editor decorations
 */
export class DecorationManager {
  private decorations: string[] = [];
  private lastDecorationCount = 0;

  constructor(
    private editor: MonacoEditor,
    private config: ErrorLensConfig,
  ) {}

  /**
   * Update all decorations based on current markers
   */
  public updateDecorations(markers: MonacoMarkerData[]): void {
    const decorations = this.createDecorations(markers);
    this.decorations = this.editor.deltaDecorations(this.decorations, decorations);
    this.lastDecorationCount = decorations.length;
  }

  /**
   * Clear all decorations
   */
  public clearDecorations(): void {
    this.decorations = this.editor.deltaDecorations(this.decorations, []);
    this.lastDecorationCount = 0;
  }

  /**
   * Get the current decoration count
   */
  public getDecorationCount(): number {
    return this.lastDecorationCount;
  }

  /**
   * Create Monaco decorations from markers
   */
  private createDecorations(markers: MonacoMarkerData[]): MonacoDecoration[] {
    const decorations: MonacoDecoration[] = [];
    const groupedMarkers = this.groupMarkersByLine(markers);

    for (const [lineNumber, lineMarkers] of groupedMarkers) {
      const primaryMarker = lineMarkers[0];
      if (!primaryMarker) continue;

      const decoration = this.createLineDecoration(lineNumber, lineMarkers);
      if (decoration) {
        decorations.push(decoration);
      }
    }

    return decorations;
  }

  /**
   * Create a decoration for an entire line
   */
  private createLineDecoration(lineNumber: number, markers: MonacoMarkerData[]): MonacoDecoration | null {
    const primaryMarker = markers[0];
    if (!primaryMarker) return null;

    const severityClass = getSeverityClass(primaryMarker.severity);
    const options: MonacoDecorationOptions = {
      stickiness: 1, // NeverGrowsWhenTypingAtEdges
    };

    // Add line highlighting
    if (this.config.enableLineHighlights) {
      options.isWholeLine = true;
      options.className = `${CSS_CLASSES.LINE} ${CSS_CLASSES.LINE}-${severityClass}`;
    }

    // Add inline message
    if (this.config.enableInlineMessages) {
      const formattedMessage = formatMessage(
        primaryMarker,
        this.config.messageTemplate,
        this.config.maxMessageLength,
      );

      options.after = {
        content: formattedMessage,
        inlineClassName: `${CSS_CLASSES.MESSAGE} ${CSS_CLASSES.MESSAGE}-${severityClass}`,
      };
    }

    // Add gutter icon
    if (this.config.enableGutterIcons) {
      options.glyphMarginClassName = `${CSS_CLASSES.GUTTER} ${CSS_CLASSES.GUTTER}-${severityClass}`;
    }

    // Add hover message
    options.hoverMessage = {
      value: this.createHoverMessage(markers),
    };

    // Create range using plain object (compatible with Monaco editor API)
    return {
      range: {
        startLineNumber: lineNumber,
        startColumn: 1,
        endLineNumber: lineNumber,
        endColumn: 1,
      },
      options,
    };
  }

  /**
   * Create hover message for multiple markers on the same line
   */
  private createHoverMessage(markers: MonacoMarkerData[]): string {
    if (markers.length === 1) {
      const marker = markers[0];
      if (!marker) return '';
      return marker.message;
    }

    const lines = markers.map(marker => marker.message);
    return lines.join('\n\n');
  }



  /**
   * Group markers by line number with sorted markers per line
   */
  private groupMarkersByLine(markers: MonacoMarkerData[]): Map<number, MonacoMarkerData[]> {
    const grouped = new Map<number, MonacoMarkerData[]>();

    for (const marker of markers) {
      const line = marker.startLineNumber;
      if (!grouped.has(line)) {
        grouped.set(line, []);
      }
      const lineMarkers = grouped.get(line);
      if (lineMarkers) {
        lineMarkers.push(marker);
      }
    }

    // Sort markers within each line by severity (highest first)
    for (const lineMarkers of grouped.values()) {
      lineMarkers.sort((a, b) => b.severity - a.severity);
    }

    return grouped;
  }

  /**
   * Update configuration
   */
  public updateConfig(config: ErrorLensConfig): void {
    this.config = config;
  }
}

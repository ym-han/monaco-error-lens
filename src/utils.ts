import type { ErrorLensOptions, MonacoMarkerData } from './types';
import { SEVERITY_LEVELS } from './types';

/**
 * Converts Monaco marker severity to a CSS class suffix
 */
export function getSeverityClass(severity: number): string {
  switch (severity) {
    case SEVERITY_LEVELS.ERROR:
      return 'error';
    case SEVERITY_LEVELS.WARNING:
      return 'warning';
    case SEVERITY_LEVELS.INFO:
      return 'info';
    case SEVERITY_LEVELS.HINT:
      return 'hint';
    default:
      return 'unknown';
  }
}

/**
 * Formats a diagnostic message according to the template
 */
export function formatMessage(
  marker: MonacoMarkerData,
  template: string = '{message}',
  maxLength?: number,
): string {
  let formatted = template
    .replace('{message}', marker.message ?? '')
    .replace('{source}', marker.source ?? '')
    .replace('{code}', marker.code ? String(marker.code) : '');

  if (maxLength && formatted.length > maxLength) {
    formatted = `${formatted.substring(0, maxLength - 3)}...`;
  }

  return formatted;
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Escapes HTML special characters
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Creates a unique identifier
 */
export function createId(): string {
  return `error-lens-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Merges default options with user options
 */
export function mergeOptions(
  defaultOptions: Required<ErrorLensOptions>,
  userOptions: ErrorLensOptions = {},
): Required<ErrorLensOptions> {
  return {
    ...defaultOptions,
    ...userOptions,
    colors: {
      error: {
        background: userOptions.colors?.error?.background ??
          defaultOptions.colors.error?.background ??
          'rgba(228, 85, 84, 0.15)',
        foreground: userOptions.colors?.error?.foreground ??
          defaultOptions.colors.error?.foreground ??
          '#ff6464',
      },
      warning: {
        background: userOptions.colors?.warning?.background ??
          defaultOptions.colors.warning?.background ??
          'rgba(255, 148, 47, 0.15)',
        foreground: userOptions.colors?.warning?.foreground ??
          defaultOptions.colors.warning?.foreground ??
          '#fa973a',
      },
      info: {
        background: userOptions.colors?.info?.background ??
          defaultOptions.colors.info?.background ??
          'rgba(0, 183, 228, 0.15)',
        foreground: userOptions.colors?.info?.foreground ??
          defaultOptions.colors.info?.foreground ??
          '#00b7e4',
      },
      hint: {
        background: userOptions.colors?.hint?.background ??
          defaultOptions.colors.hint?.background ??
          'rgba(119, 136, 153, 0.15)',
        foreground: userOptions.colors?.hint?.foreground ??
          defaultOptions.colors.hint?.foreground ??
          '#778899',
      },
    },
  };
}


/**
 * Sorts markers by line number and then by severity
 */
export function sortMarkers(markers: MonacoMarkerData[]): MonacoMarkerData[] {
  return markers.sort((a, b) => {
    if (a.startLineNumber !== b.startLineNumber) {
      return a.startLineNumber - b.startLineNumber;
    }
    // Higher severity first (Error = 8, Warning = 4, Info = 2, Hint = 1)
    return b.severity - a.severity;
  });
}

/**
 * Groups markers by line number
 */
export function groupMarkersByLine(markers: MonacoMarkerData[]): Map<number, MonacoMarkerData[]> {
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

  return grouped;
}

/**
 * Counts markers by severity
 */
export function countMarkersBySeverity(markers: MonacoMarkerData[]): {
  errors: number;
  warnings: number;
  infos: number;
  hints: number;
} {
  return markers.reduce(
    (acc, marker) => {
      switch (marker.severity) {
        case SEVERITY_LEVELS.ERROR:
          acc.errors++;
          break;
        case SEVERITY_LEVELS.WARNING:
          acc.warnings++;
          break;
        case SEVERITY_LEVELS.INFO:
          acc.infos++;
          break;
        case SEVERITY_LEVELS.HINT:
          acc.hints++;
          break;
      }
      return acc;
    },
    { errors: 0, warnings: 0, infos: 0, hints: 0 },
  );
}

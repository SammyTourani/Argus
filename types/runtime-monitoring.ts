/**
 * Runtime monitoring type definitions for Playwright integration
 */

/**
 * Type of runtime error detected
 */
export type RuntimeErrorType =
    | 'console-error'      // JavaScript console.error()
    | 'console-warning'    // JavaScript console.warn()
    | 'network-404'        // HTTP 404 Not Found
    | 'network-500'        // HTTP 500+ Server Error
    | 'exception'          // Uncaught JavaScript exception
    | 'network-other';     // Other network errors (4XX)

/**
 * Severity level of the error
 */
export type RuntimeErrorSeverity = 'critical' | 'error' | 'warning' | 'info';

/**
 * Individual runtime error
 */
export interface RuntimeError {
    /** Unique identifier for this error instance */
    id: string;

    /** Type of error */
    type: RuntimeErrorType;

    /** Severity level */
    severity: RuntimeErrorSeverity;

    /** Error message */
    message: string;

    /** Stack trace (if available) */
    stack?: string;

    /** URL where error occurred (for network errors) */
    url?: string;

    /** HTTP status code (for network errors) */
    statusCode?: number;

    /** Timestamp when error was detected */
    timestamp: number;

    /** File/line number where error occurred (if parseable) */
    source?: {
        file: string;
        line?: number;
        column?: number;
    };
}

/**
 * Result of runtime monitoring
 */
export interface RuntimeMonitorResult {
    /** Whether monitoring was successful */
    success: boolean;

    /** Sandbox ID that was monitored */
    sandboxId: string;

    /** Whether critical errors were detected */
    hasErrors: boolean;

    /** All detected errors */
    errors: RuntimeError[];

    /** Warnings (non-critical) */
    warnings: RuntimeError[];

    /** Summary statistics */
    summary: {
        totalErrors: number;
        consoleErrors: number;
        networkErrors: number;
        exceptions: number;
    };

    /** Time taken to monitor (ms) */
    monitorDuration: number;

    /** Any monitoring errors that occurred */
    monitoringError?: string;
}

/**
 * Configuration for runtime monitoring
 */
export interface RuntimeMonitorConfig {
    /** Sandbox URL to monitor */
    sandboxUrl: string;

    /** Sandbox ID for tracking */
    sandboxId: string;

    /** Maximum time to wait for monitoring (ms) */
    timeout?: number;

    /** Types of errors to capture */
    errorTypes?: RuntimeErrorType[];

    /** Whether to capture screenshots on error */
    captureScreenshots?: boolean;
}

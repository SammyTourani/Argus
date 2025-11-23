/**
 * Runtime Monitoring API Route
 * 
 * Monitors E2B sandbox for runtime errors using Playwright
 * Phase 1: Detection only (no auto-fix)
 */

import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright-core';
import chromiumPkg from '@sparticuz/chromium';
import { nanoid } from 'nanoid';
import type { RuntimeError, RuntimeMonitorResult, RuntimeMonitorConfig } from '@/types/runtime-monitoring';
import { appConfig } from '@/config/app.config';

/**
 * POST /api/monitor-runtime
 * 
 * Monitors a sandbox URL for runtime errors
 * 
 * Request Body:
 * {
 *   sandboxUrl: string,
 *   sandboxId: string,
 *   timeout?: number
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   hasErrors: boolean,
 *   errors: RuntimeError[],
 *   warnings: RuntimeError[],
 *   summary: {...}
 * }
 */
export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        // Parse request
        const body = await request.json().catch(() => ({}));
        const { sandboxUrl, sandboxId, timeout } = body as Partial<RuntimeMonitorConfig>;

        // Validate request
        if (!sandboxUrl || !sandboxId) {
            console.error('[monitor-runtime] Missing required fields:', { sandboxUrl, sandboxId });
            return NextResponse.json({
                success: false,
                monitoringError: 'Missing required fields: sandboxUrl and sandboxId'
            }, { status: 400 });
        }

        console.log('[monitor-runtime] Starting monitoring:', {
            sandboxUrl,
            sandboxId,
            timeout: timeout || appConfig.runtimeMonitoring.monitorTimeout
        });

        // Monitor the sandbox
        const result = await monitorSandbox({
            sandboxUrl,
            sandboxId,
            timeout: timeout || appConfig.runtimeMonitoring.monitorTimeout,
            errorTypes: appConfig.runtimeMonitoring.errorTypes as any
        });

        const duration = Date.now() - startTime;
        console.log('[monitor-runtime] Monitoring complete:', {
            duration,
            hasErrors: result.hasErrors,
            errorCount: result.errors.length,
            warningCount: result.warnings.length
        });

        return NextResponse.json(result);

    } catch (error) {
        const duration = Date.now() - startTime;
        console.error('[monitor-runtime] Fatal error:', error);
        console.error('[monitor-runtime] Error stack:', (error as Error).stack);

        return NextResponse.json({
            success: false,
            sandboxId: '',
            hasErrors: false,
            errors: [],
            warnings: [],
            summary: {
                totalErrors: 0,
                consoleErrors: 0,
                networkErrors: 0,
                exceptions: 0
            },
            monitorDuration: duration,
            monitoringError: (error as Error).message
        } as RuntimeMonitorResult, { status: 500 });
    }
}

/**
 * Monitor a sandbox for runtime errors using Playwright
 */
async function monitorSandbox(config: RuntimeMonitorConfig): Promise<RuntimeMonitorResult> {
    const startTime = Date.now();
    const errors: RuntimeError[] = [];
    const warnings: RuntimeError[] = [];
    let browser: any = null;

    try {
        // Launch headless browser with environment-aware configuration
        console.log('[monitorSandbox] Launching Chromium...');

        // Determine if we're in serverless environment (production) or local (development)
        const isProduction = process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL;

        if (isProduction) {
            // Production: Use @sparticuz/chromium (serverless-optimized)
            console.log('[monitorSandbox]Uses @sparticuz/chromium for serverless');
            browser = await chromium.launch({
                args: chromiumPkg.args,
                executablePath: await chromiumPkg.executablePath(),
                headless: true
            });
        } else {
            // Development: Use locally-installed Playwright Chromium
            console.log('[monitorSandbox] Using local Playwright Chromium');
            browser = await chromium.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage'
                ]
            });
        }

        const context = await browser.newContext({
            viewport: { width: 1920, height: 1080 },
            ignoreHTTPSErrors: true // E2B uses valid certs, but just in case
        });

        const page = await context.newPage();

        // Set up error listeners BEFORE navigating
        setupErrorListeners(page, errors, warnings, config.errorTypes);

        // Navigate to sandbox
        console.log('[monitorSandbox] Navigating to:', config.sandboxUrl);
        let navigationSucceeded = false;
        try {
            await page.goto(config.sandboxUrl, {
                waitUntil: 'domcontentloaded', // Changed from 'networkidle' - more reliable
                timeout: config.timeout || appConfig.runtimeMonitoring.monitorTimeout
            });
            navigationSucceeded = true;
        } catch (navError) {
            console.error('[monitorSandbox] Navigation failed:', (navError as Error).message);
            // Navigation failed - close browser and return error
            await browser.close();
            browser = null;

            return {
                success: false,
                sandboxId: config.sandboxId,
                hasErrors: true,
                errors: [{
                    id: nanoid(),
                    type: 'network-other',
                    severity: 'critical',
                    message: `Failed to navigate to sandbox: ${(navError as Error).message}`,
                    url: config.sandboxUrl,
                    timestamp: Date.now()
                }],
                warnings: [],
                summary: {
                    totalErrors: 1,
                    consoleErrors: 0,
                    networkErrors: 1,
                    exceptions: 0
                },
                monitorDuration: Date.now() - startTime
            };
        }

        // Wait for React to render (only if navigation succeeded)
        console.log('[monitorSandbox] Waiting for page to settle...');
        try {
            await page.waitForTimeout(appConfig.runtimeMonitoring.pageLoadWait);
        } catch (waitError) {
            console.error('[monitorSandbox] Wait timeout failed:', (waitError as Error).message);
            // Page might be closed, but we can still try to get content
        }

        // Check if page has content
        let hasContent = false;
        try {
            hasContent = await page.evaluate(() => {
                const root = document.getElementById('root');
                return root && root.children.length > 0;
            });
        } catch (evalError) {
            console.error('[monitorSandbox] Page evaluate failed:', (evalError as Error).message);
        }

        if (!hasContent) {
            warnings.push({
                id: nanoid(),
                type: 'console-warning',
                severity: 'warning',
                message: 'React root is empty - page may not have rendered',
                timestamp: Date.now()
            });
        }

        // Close browser
        await browser.close();
        browser = null;

        // Classify errors
        const criticalErrors = errors.filter(e =>
            e.severity === 'critical' || e.severity === 'error'
        );

        const summary = {
            totalErrors: errors.length + warnings.length,
            consoleErrors: errors.filter(e => e.type.startsWith('console-')).length,
            networkErrors: errors.filter(e => e.type.startsWith('network-')).length,
            exceptions: errors.filter(e => e.type === 'exception').length
        };

        console.log('[monitorSandbox] Results:', {
            errors: errors.length,
            warnings: warnings.length,
            summary
        });

        return {
            success: true,
            sandboxId: config.sandboxId,
            hasErrors: criticalErrors.length > 0,
            errors,
            warnings,
            summary,
            monitorDuration: Date.now() - startTime
        };

    } catch (error) {
        // Clean up browser if error occurred
        if (browser) {
            try {
                await browser.close();
            } catch (closeError) {
                console.error('[monitorSandbox] Failed to close browser:', closeError);
            }
        }

        throw error;
    }
}

/**
 * Set up Playwright event listeners to capture errors
 */
function setupErrorListeners(
    page: any,
    errors: RuntimeError[],
    warnings: RuntimeError[],
    errorTypes?: string[]
) {
    const shouldCapture = (type: string) => {
        if (!errorTypes || errorTypes.length === 0) return true;
        return errorTypes.includes(type);
    };

    // 1. Capture console messages
    page.on('console', (msg: any) => {
        const type = msg.type();
        const text = msg.text();

        // Console errors
        if (type === 'error' && shouldCapture('console-error')) {
            errors.push({
                id: nanoid(),
                type: 'console-error',
                severity: 'error',
                message: text,
                timestamp: Date.now(),
                source: parseErrorSource(text)
            });
            console.log('[console-error]', text);
        }

        // Console warnings
        else if (type === 'warning' && shouldCapture('console-warning')) {
            warnings.push({
                id: nanoid(),
                type: 'console-warning',
                severity: 'warning',
                message: text,
                timestamp: Date.now()
            });
            console.log('[console-warning]', text);
        }
    });

    // 2. Capture uncaught exceptions
    page.on('pageerror', (error: Error) => {
        if (shouldCapture('exception')) {
            errors.push({
                id: nanoid(),
                type: 'exception',
                severity: 'critical',
                message: error.message,
                stack: error.stack,
                timestamp: Date.now(),
                source: parseErrorSource(error.stack || error.message)
            });
            console.log('[exception]', error.message);
        }
    });

    // 3. Capture network errors
    page.on('response', (response: any) => {
        const status = response.status();
        const url = response.url();

        // 404 errors
        if (status === 404 && shouldCapture('network-404')) {
            errors.push({
                id: nanoid(),
                type: 'network-404',
                severity: 'error',
                message: `404 Not Found: ${url}`,
                url,
                statusCode: 404,
                timestamp: Date.now()
            });
            console.log('[network-404]', url);
        }

        // 500+ errors
        else if (status >= 500 && shouldCapture('network-500')) {
            errors.push({
                id: nanoid(),
                type: 'network-500',
                severity: 'critical',
                message: `HTTP ${status}: ${url}`,
                url,
                statusCode: status,
                timestamp: Date.now()
            });
            console.log('[network-500]', status, url);
        }

        // Other 4XX errors
        else if (status >= 400 && status < 500 && status !== 404) {
            warnings.push({
                id: nanoid(),
                type: 'network-other',
                severity: 'warning',
                message: `HTTP ${status}: ${url}`,
                url,
                statusCode: status,
                timestamp: Date.now()
            });
        }
    });

    // 4. Capture request failures
    page.on('requestfailed', (request: any) => {
        const url = request.url();
        const failure = request.failure();

        warnings.push({
            id: nanoid(),
            type: 'network-other',
            severity: 'warning',
            message: `Request failed: ${failure?.errorText || 'Unknown error'} - ${url}`,
            url,
            timestamp: Date.now()
        });
        console.log('[request-failed]', url, failure?.errorText);
    });
}

/**
 * Parse error source (file, line, column) from error message/stack
 */
function parseErrorSource(errorText: string): { file: string; line?: number; column?: number } | undefined {
    // Try to parse error location like "at Component (App.jsx:42:15)"
    const match = errorText.match(/\(([^)]+):(\d+):(\d+)\)/);
    if (match) {
        return {
            file: match[1],
            line: parseInt(match[2]),
            column: parseInt(match[3])
        };
    }

    // Try simpler format like "App.jsx:42"
    const simpleMatch = errorText.match(/([^\s]+\.jsx?):(\d+)/);
    if (simpleMatch) {
        return {
            file: simpleMatch[1],
            line: parseInt(simpleMatch[2])
        };
    }

    return undefined;
}

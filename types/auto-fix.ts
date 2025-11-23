import { RuntimeError } from './runtime-monitoring';

export interface AutoFixRequest {
    sandboxId: string;
    errors: RuntimeError[];
    // Optional: specific files to focus on if known
    focusFiles?: string[];
}

export interface AutoFixResponse {
    success: boolean;
    explanation: string;
    // XML-formatted code block ready for parsing
    fixedCode: string;
    // List of files that were modified
    modifiedFiles: string[];
    error?: string;
}

export interface ErrorContext {
    file: string;
    content: string;
    relatedErrors: RuntimeError[];
}

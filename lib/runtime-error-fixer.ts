import { createGroq } from '@ai-sdk/groq';
import { streamText } from 'ai';
import { SandboxProvider } from '@/lib/sandbox/types';
import { RuntimeError } from '@/types/runtime-monitoring';
import { appConfig } from '@/config/app.config';

// Initialize Groq client
const groq = createGroq({
    apiKey: process.env.GROQ_API_KEY,
});

export async function fixRuntimeErrors(
    errors: RuntimeError[],
    provider: SandboxProvider,
    focusFiles: string[] = []
) {
    // 1. Identify relevant files from errors
    const relevantFiles = new Set<string>(focusFiles);

    // Always include critical configuration files
    relevantFiles.add('package.json');
    relevantFiles.add('index.html');
    relevantFiles.add('src/index.css'); // Common source of styling errors
    relevantFiles.add('src/main.jsx'); // Entry point

    // Parse errors to find file references
    errors.forEach(error => {
        if (error.source?.file) {
            // Normalize path (remove leading slash or ./ if present)
            let path = error.source.file;
            if (path.startsWith('/')) path = path.slice(1);
            if (path.startsWith('./')) path = path.slice(2);

            // Ensure it's in src if it looks like a component
            if (!path.startsWith('src/') && (path.endsWith('.jsx') || path.endsWith('.tsx'))) {
                path = 'src/' + path;
            }

            relevantFiles.add(path);
        }

        // Also look for filenames in the error message itself
        const fileMatch = error.message.match(/([a-zA-Z0-9_-]+\.(jsx|tsx|js|ts|css))/);
        if (fileMatch) {
            const filename = fileMatch[1];
            // We don't know the full path, but we can guess it's likely in src/components or src
            // For now, we'll rely on the file search or just add it if we can find it
            // This is a simplification; a robust solution would search the file tree
        }
    });

    // 2. Read file contents
    const fileContexts: { path: string; content: string }[] = [];

    for (const filePath of Array.from(relevantFiles)) {
        try {
            const content = await provider.readFile(filePath);
            fileContexts.push({ path: filePath, content });
        } catch (err) {
            console.warn(`[AutoFix] Failed to read file ${filePath}:`, err);
            // Ignore missing files, they might be the error cause (missing file)
        }
    }

    // 3. Construct Prompt
    const errorList = errors.map(e =>
        `[${e.type.toUpperCase()}] ${e.message}\n${e.source ? `Location: ${e.source.file}:${e.source.line}` : ''}`
    ).join('\n\n');

    const fileContextString = fileContexts.map(f =>
        `<file path="${f.path}">\n${f.content}\n</file>`
    ).join('\n\n');

    const systemPrompt = `You are an expert React/Vite debugger. 
Your task is to fix the runtime errors detected in the application.

RULES:
1. Analyze the provided errors and file contents.
2. Fix the errors by modifying the code.
3. Return ONLY the fixed code blocks wrapped in <file path="..."> tags.
4. Do NOT remove existing functionality, only fix the specific errors.
5. If a file is missing (e.g., 404 error), create it.
6. If a package is missing, add it to package.json (but prefer using existing packages).
7. Be concise. Do not explain your reasoning, just provide the fixes.

Common Fixes:
- Missing Tailwind classes: Add them to index.css or check configuration.
- Missing imports: Add the import statement.
- Undefined variables: Define them or fix the reference.
- 404s: Create the missing file or fix the path.
`;

    const userPrompt = `
The following runtime errors were detected:

${errorList}

Here is the current code context:

${fileContextString}

Please fix these errors. Return the full content of any modified files.
`;

    // 4. Call AI
    const result = await streamText({
        model: groq(appConfig.runtimeMonitoring.autoFixModel),
        system: systemPrompt,
        messages: [
            { role: 'user', content: userPrompt }
        ],
        temperature: 0.2, // Low temperature for precise fixes
    });

    return result;
}

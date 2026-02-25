import { NextResponse } from 'next/server';
import { parseJavaScriptFile, buildComponentTree } from '@/lib/file-parser';
import { FileManifest, FileInfo, RouteInfo } from '@/types/file-manifest';
import { createClient } from '@/lib/supabase/server';
import { getSandbox } from '@/lib/sandbox/registry';

export async function GET() {
  try {
    // Auth — resolve the current user's sandbox
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const entry = getSandbox(user.id);
    const sandbox = entry.sandbox;

    if (!sandbox) {
      return NextResponse.json({
        success: false,
        error: 'No active sandbox'
      }, { status: 404 });
    }

    console.log('[get-sandbox-files] Fetching and analyzing file structure...');

    // Get list of all relevant files
    const findResult = await sandbox.runCommand({
      cmd: 'find',
      args: [
        '.',
        '-name', 'node_modules', '-prune', '-o',
        '-name', '.git', '-prune', '-o',
        '-name', 'dist', '-prune', '-o',
        '-name', 'build', '-prune', '-o',
        '-type', 'f',
        '(',
        '-name', '*.jsx',
        '-o', '-name', '*.js',
        '-o', '-name', '*.tsx',
        '-o', '-name', '*.ts',
        '-o', '-name', '*.css',
        '-o', '-name', '*.json',
        ')',
        '-print'
      ]
    });

    if (findResult.exitCode !== 0) {
      throw new Error('Failed to list files');
    }

    const fileList = (await findResult.stdout()).split('\n').filter((f: string) => f.trim());
    console.log('[get-sandbox-files] Found', fileList.length, 'files');

    // Read content of each file (limit to reasonable sizes)
    const filesContent: Record<string, string> = {};

    for (const filePath of fileList) {
      try {
        const statResult = await sandbox.runCommand({
          cmd: 'stat',
          args: ['-f', '%z', filePath]
        });

        if (statResult.exitCode === 0) {
          const fileSize = parseInt(await statResult.stdout());

          if (fileSize < 10000) {
            const catResult = await sandbox.runCommand({
              cmd: 'cat',
              args: [filePath]
            });

            if (catResult.exitCode === 0) {
              const content = await catResult.stdout();
              const relativePath = filePath.replace(/^\.\//, '');
              filesContent[relativePath] = content;
            }
          }
        }
      } catch (parseError) {
        console.debug('Error parsing component info:', parseError);
        continue;
      }
    }

    // Get directory structure
    const treeResult = await sandbox.runCommand({
      cmd: 'find',
      args: ['.', '-type', 'd', '-not', '-path', '*/node_modules*', '-not', '-path', '*/.git*']
    });

    let structure = '';
    if (treeResult.exitCode === 0) {
      const dirs = (await treeResult.stdout()).split('\n').filter((d: string) => d.trim());
      structure = dirs.slice(0, 50).join('\n');
    }

    // Build enhanced file manifest
    const fileManifest: FileManifest = {
      files: {},
      routes: [],
      componentTree: {},
      entryPoint: '',
      styleFiles: [],
      timestamp: Date.now(),
    };

    for (const [relativePath, content] of Object.entries(filesContent)) {
      const fullPath = `/${relativePath}`;

      const fileInfo: FileInfo = {
        content: content,
        type: 'utility',
        path: fullPath,
        relativePath,
        lastModified: Date.now(),
      };

      if (relativePath.match(/\.(jsx?|tsx?)$/)) {
        const parseResult = parseJavaScriptFile(content, fullPath);
        Object.assign(fileInfo, parseResult);

        if (relativePath === 'src/main.jsx' || relativePath === 'src/index.jsx') {
          fileManifest.entryPoint = fullPath;
        }

        if (relativePath === 'src/App.jsx' || relativePath === 'App.jsx') {
          fileManifest.entryPoint = fileManifest.entryPoint || fullPath;
        }
      }

      if (relativePath.endsWith('.css')) {
        fileManifest.styleFiles.push(fullPath);
        fileInfo.type = 'style';
      }

      fileManifest.files[fullPath] = fileInfo;
    }

    fileManifest.componentTree = buildComponentTree(fileManifest.files);
    fileManifest.routes = extractRoutes(fileManifest.files);

    // Update file cache in user's sandbox state
    if (entry.sandboxState?.fileCache) {
      entry.sandboxState.fileCache.manifest = fileManifest;
    }

    return NextResponse.json({
      success: true,
      files: filesContent,
      structure,
      fileCount: Object.keys(filesContent).length,
      manifest: fileManifest,
    });

  } catch (error) {
    console.error('[get-sandbox-files] Error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}

function extractRoutes(files: Record<string, FileInfo>): RouteInfo[] {
  const routes: RouteInfo[] = [];

  for (const [path, fileInfo] of Object.entries(files)) {
    if (fileInfo.content.includes('<Route') || fileInfo.content.includes('createBrowserRouter')) {
      const routeMatches = fileInfo.content.matchAll(/path=["']([^"']+)["'].*(?:element|component)={([^}]+)}/g);

      for (const match of routeMatches) {
        const [, routePath] = match;
        routes.push({
          path: routePath,
          component: path,
        });
      }
    }

    if (fileInfo.relativePath.startsWith('pages/') || fileInfo.relativePath.startsWith('src/pages/')) {
      const routePath = '/' + fileInfo.relativePath
        .replace(/^(src\/)?pages\//, '')
        .replace(/\.(jsx?|tsx?)$/, '')
        .replace(/index$/, '');

      routes.push({
        path: routePath,
        component: path,
      });
    }
  }

  return routes;
}

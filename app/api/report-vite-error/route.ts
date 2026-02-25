import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { pushViteError } from '@/lib/vite/per-user-errors';

export async function POST(request: NextRequest) {
  try {
    // Auth check — require authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { error, file, type = 'runtime-error' } = await request.json();

    if (!error) {
      return NextResponse.json({
        success: false,
        error: 'Error message is required'
      }, { status: 400 });
    }

    // Parse the error to extract useful information
    const errorObj: any = {
      type,
      message: error,
      file: file || 'unknown',
      timestamp: new Date().toISOString()
    };

    // Extract import information if it's an import error
    const importMatch = error.match(/Failed to resolve import ['"]([^'"]+)['"] from ['"]([^'"]+)['"]/);
    if (importMatch) {
      errorObj.type = 'import-error';
      errorObj.import = importMatch[1];
      errorObj.file = importMatch[2];
    }

    // Add to per-user errors (automatically capped at 50)
    pushViteError(user.id, errorObj);

    console.log('[report-vite-error] Error reported for user', user.id, ':', errorObj);

    return NextResponse.json({
      success: true,
      message: 'Error reported successfully',
      error: errorObj
    });

  } catch (error) {
    console.error('[report-vite-error] Error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}

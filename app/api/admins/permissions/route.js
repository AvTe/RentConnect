import { NextResponse } from 'next/server';
import { getAdminPermissions } from '@/lib/database';

/**
 * GET /api/admins/permissions - Get all available permissions
 */
export async function GET() {
  try {
    const result = await getAdminPermissions();

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      grouped: result.grouped
    });
  } catch (error) {
    console.error('Error in GET /api/admins/permissions:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

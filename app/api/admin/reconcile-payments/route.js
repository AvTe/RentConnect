import { NextResponse } from 'next/server';
import pg from 'pg';

// PostgreSQL connection
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// This endpoint returns payments that are completed but not yet fulfilled
// Admins can use this data to manually fulfill payments or trigger fulfillment
export async function GET(request) {
  try {
    // Get the authorization header for admin access
    const authHeader = request.headers.get('authorization');
    const adminKey = process.env.ADMIN_API_KEY;
    
    // Simple API key check for admin access
    if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all payments that are completed but not fulfilled
    const result = await pool.query(
      `SELECT * FROM pending_payments 
       WHERE status = 'completed' 
       ORDER BY completed_at DESC 
       LIMIT 100`
    );

    // Also get recently fulfilled payments for audit
    const fulfilledResult = await pool.query(
      `SELECT * FROM pending_payments 
       WHERE status = 'fulfilled' 
       ORDER BY completed_at DESC 
       LIMIT 50`
    );

    // Get failed payments
    const failedResult = await pool.query(
      `SELECT * FROM pending_payments 
       WHERE status = 'failed' 
       ORDER BY created_at DESC 
       LIMIT 50`
    );

    return NextResponse.json({
      success: true,
      data: {
        pendingFulfillment: result.rows.map(row => ({
          orderId: row.order_id,
          trackingId: row.order_tracking_id,
          metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
          amount: row.amount,
          email: row.email,
          status: row.status,
          createdAt: row.created_at,
          completedAt: row.completed_at,
          pesapalStatus: row.pesapal_status
        })),
        recentlyFulfilled: fulfilledResult.rows.map(row => ({
          orderId: row.order_id,
          trackingId: row.order_tracking_id,
          amount: row.amount,
          email: row.email,
          completedAt: row.completed_at
        })),
        failedPayments: failedResult.rows.map(row => ({
          orderId: row.order_id,
          amount: row.amount,
          email: row.email,
          createdAt: row.created_at
        })),
        summary: {
          pendingFulfillmentCount: result.rows.length,
          recentlyFulfilledCount: fulfilledResult.rows.length,
          failedCount: failedResult.rows.length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching payment reconciliation data:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST endpoint to mark a payment as manually fulfilled
export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const adminKey = process.env.ADMIN_API_KEY;
    
    if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { orderId, action } = await request.json();

    if (!orderId || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing orderId or action' },
        { status: 400 }
      );
    }

    if (action === 'mark_fulfilled') {
      // Mark a completed payment as fulfilled (after manual verification)
      const result = await pool.query(
        `UPDATE pending_payments 
         SET status = 'fulfilled' 
         WHERE order_id = $1 AND status = 'completed'
         RETURNING *`,
        [orderId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Payment not found or not in completed status' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Payment marked as fulfilled',
        data: result.rows[0]
      });
    }

    return NextResponse.json(
      { success: false, error: 'Unknown action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error processing reconciliation action:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

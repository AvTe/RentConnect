/**
 * M-Pesa Query API Route
 * Query the status of an STK Push transaction
 */

import { NextResponse } from 'next/server';
import { querySTKStatus, isMpesaConfigured } from '@/lib/mpesa';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    if (!isMpesaConfigured()) {
      return NextResponse.json(
        { success: false, error: 'M-Pesa is not configured' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const checkoutRequestId = searchParams.get('checkoutRequestId');
    const orderId = searchParams.get('orderId');

    if (!checkoutRequestId && !orderId) {
      return NextResponse.json(
        { success: false, error: 'checkoutRequestId or orderId is required' },
        { status: 400 }
      );
    }

    // First check our database for the payment status
    let payment = null;
    if (orderId) {
      const { data } = await supabase
        .from('pending_payments')
        .select('*')
        .eq('order_id', orderId)
        .single();
      payment = data;
    } else if (checkoutRequestId) {
      const { data } = await supabase
        .from('pending_payments')
        .select('*')
        .eq('order_tracking_id', checkoutRequestId)
        .single();
      payment = data;
    }

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    // If already completed or failed, return stored status
    if (payment.status === 'completed') {
      return NextResponse.json({
        success: true,
        status: 'completed',
        data: {
          orderId: payment.order_id,
          checkoutRequestId: payment.order_tracking_id,
          amount: payment.amount,
          mpesaReceiptNumber: payment.metadata?.mpesaReceiptNumber,
          fulfillmentStatus: payment.fulfillment_status,
        }
      });
    }

    if (payment.status === 'failed') {
      return NextResponse.json({
        success: false,
        status: 'failed',
        error: payment.metadata?.resultDesc || 'Payment failed',
        data: {
          orderId: payment.order_id,
          resultCode: payment.metadata?.resultCode,
        }
      });
    }

    // For pending payments, query M-Pesa directly
    const requestId = payment.order_tracking_id || checkoutRequestId;
    if (!requestId) {
      return NextResponse.json({
        success: false,
        status: 'pending',
        message: 'Payment is being processed',
        data: { orderId: payment.order_id }
      });
    }

    const queryResult = await querySTKStatus(requestId);

    // ResultCode 0 = Success
    if (queryResult.ResultCode === '0' || queryResult.ResultCode === 0) {
      return NextResponse.json({
        success: true,
        status: 'completed',
        data: {
          orderId: payment.order_id,
          checkoutRequestId: requestId,
          resultDesc: queryResult.ResultDesc,
        }
      });
    } else if (queryResult.ResultCode) {
      // Non-zero result code means failure or pending
      const isPending = queryResult.ResultCode === '1032' || 
                        queryResult.ResultDesc?.includes('pending');
      
      return NextResponse.json({
        success: !isPending ? false : undefined,
        status: isPending ? 'pending' : 'failed',
        message: queryResult.ResultDesc,
        data: {
          orderId: payment.order_id,
          resultCode: queryResult.ResultCode,
        }
      });
    }

    // If we can't determine status
    return NextResponse.json({
      success: false,
      status: 'unknown',
      message: 'Unable to determine payment status',
      data: { orderId: payment.order_id }
    });

  } catch (error) {
    console.error('M-Pesa query error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


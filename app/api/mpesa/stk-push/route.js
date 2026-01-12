/**
 * M-Pesa STK Push API Route
 * Initiates Lipa Na M-Pesa Online payment
 */

import { NextResponse } from 'next/server';
import { initiateSTKPush, isMpesaConfigured, formatPhoneNumber } from '@/lib/mpesa';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    // Check if M-Pesa is configured
    if (!isMpesaConfigured()) {
      return NextResponse.json(
        { success: false, error: 'M-Pesa is not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { phoneNumber, amount, metadata } = body;

    // Validate required fields
    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    // Generate unique order ID
    const orderId = `MPESA_${Date.now()}_${uuidv4().substring(0, 8)}`;
    
    // Format phone number
    const formattedPhone = formatPhoneNumber(phoneNumber);

    // Create pending payment record
    const { error: insertError } = await supabase
      .from('pending_payments')
      .insert({
        order_id: orderId,
        amount: amount,
        currency: 'KES',
        status: 'pending',
        payment_method: 'mpesa_stk',
        metadata: {
          ...metadata,
          phone: formattedPhone,
          amount: amount,
        },
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error creating pending payment:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to create payment record' },
        { status: 500 }
      );
    }

    // Initiate STK Push
    const stkResponse = await initiateSTKPush({
      phoneNumber: formattedPhone,
      amount: amount,
      accountReference: orderId.substring(0, 12),
      transactionDesc: metadata?.description?.substring(0, 13) || 'Yoombaa',
    });

    // Check response
    if (stkResponse.ResponseCode === '0') {
      // Success - update payment record with checkout request ID
      await supabase
        .from('pending_payments')
        .update({
          order_tracking_id: stkResponse.CheckoutRequestID,
          metadata: {
            ...metadata,
            phone: formattedPhone,
            amount: amount,
            merchantRequestId: stkResponse.MerchantRequestID,
            checkoutRequestId: stkResponse.CheckoutRequestID,
          }
        })
        .eq('order_id', orderId);

      return NextResponse.json({
        success: true,
        message: 'STK Push sent successfully. Check your phone.',
        orderId: orderId,
        checkoutRequestId: stkResponse.CheckoutRequestID,
        merchantRequestId: stkResponse.MerchantRequestID,
      });
    } else {
      // Failed - update payment status
      await supabase
        .from('pending_payments')
        .update({ 
          status: 'failed',
          metadata: {
            ...metadata,
            error: stkResponse.errorMessage || stkResponse.ResponseDescription,
          }
        })
        .eq('order_id', orderId);

      return NextResponse.json({
        success: false,
        error: stkResponse.errorMessage || stkResponse.ResponseDescription || 'Failed to initiate STK Push',
        responseCode: stkResponse.ResponseCode,
      }, { status: 400 });
    }
  } catch (error) {
    console.error('M-Pesa STK Push error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


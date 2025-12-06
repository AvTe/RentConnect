'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Button } from './ui/Button';
import { X, AlertCircle, Loader2, CheckCircle } from 'lucide-react';

/**
 * PersonaVerification Component
 * 
 * Replaces SmileIDVerification with Persona (withpersona.com) identity verification.
 * Uses Persona's embedded inquiry flow for agent identity verification.
 * 
 * Required Environment Variables:
 * - NEXT_PUBLIC_PERSONA_TEMPLATE_ID: Your Persona template ID (starts with itmpl_)
 * - NEXT_PUBLIC_PERSONA_ENVIRONMENT_ID: Your Persona environment ID (starts with env_)
 * 
 * @param {Object} props
 * @param {string} props.userId - The unique identifier for the user being verified
 * @param {Function} props.onClose - Callback when the verification modal is closed
 * @param {Function} props.onComplete - Callback when verification is complete (success or failure)
 */
export const PersonaVerification = ({ onClose, onComplete, userId }) => {
  const [status, setStatus] = useState('loading'); // loading, ready, verifying, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const [personaClient, setPersonaClient] = useState(null);

  // Persona configuration from environment variables
  const templateId = process.env.NEXT_PUBLIC_PERSONA_TEMPLATE_ID;
  const environmentId = process.env.NEXT_PUBLIC_PERSONA_ENVIRONMENT_ID;

  const initializePersona = useCallback(async () => {
    try {
      // Check for required environment variables
      if (!templateId || !environmentId) {
        throw new Error(
          'Persona configuration missing. Please set NEXT_PUBLIC_PERSONA_TEMPLATE_ID and NEXT_PUBLIC_PERSONA_ENVIRONMENT_ID in your environment variables.'
        );
      }

      // Dynamically import Persona to avoid SSR issues
      const Persona = (await import('persona')).default;

      const client = new Persona.Client({
        templateId: templateId,
        environmentId: environmentId,
        referenceId: userId, // Link verification to user
        
        onReady: () => {
          console.log('Persona client ready');
          setStatus('ready');
        },
        
        onComplete: ({ inquiryId, status: inquiryStatus, fields }) => {
          console.log('Persona verification complete:', { inquiryId, status: inquiryStatus });
          
          if (inquiryStatus === 'completed' || inquiryStatus === 'approved') {
            setStatus('success');
            // Call the parent's onComplete callback
            onComplete({ 
              success: true, 
              inquiryId,
              status: inquiryStatus,
              fields 
            });
          } else if (inquiryStatus === 'failed' || inquiryStatus === 'declined') {
            setStatus('error');
            setErrorMessage('Verification was not successful. Please try again.');
            onComplete({ 
              success: false, 
              inquiryId,
              status: inquiryStatus 
            });
          } else {
            // For other statuses (pending, needs_review, etc.)
            setStatus('success');
            onComplete({ 
              success: true, 
              inquiryId,
              status: inquiryStatus,
              pending: true 
            });
          }
        },
        
        onCancel: ({ inquiryId, sessionToken }) => {
          console.log('Persona verification cancelled');
          setStatus('ready');
        },
        
        onError: (error) => {
          console.error('Persona error:', error);
          setStatus('error');
          setErrorMessage(error?.message || 'An error occurred during verification. Please try again.');
        },
      });

      setPersonaClient(client);
    } catch (error) {
      console.error('Failed to initialize Persona:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Failed to initialize verification. Please try again.');
    }
  }, [templateId, environmentId, userId, onComplete]);

  useEffect(() => {
    initializePersona();
    
    // Cleanup on unmount
    return () => {
      if (personaClient) {
        try {
          personaClient.destroy?.();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, [initializePersona]);

  const handleStartVerification = () => {
    if (personaClient) {
      setStatus('verifying');
      personaClient.open();
    }
  };

  const handleRetry = () => {
    setStatus('loading');
    setErrorMessage('');
    initializePersona();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden relative flex flex-col">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
          aria-label="Close verification"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          {/* Loading State */}
          {status === 'loading' && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 text-[#FE9200] animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">Initializing Verification...</h3>
              <p className="text-sm text-gray-500 mt-2">Please wait while we set up identity verification.</p>
            </div>
          )}

          {/* Ready State - Show Start Button */}
          {status === 'ready' && (
            <div className="text-center space-y-6 py-4">
              <div className="w-20 h-20 bg-[#FFE4C4] rounded-full flex items-center justify-center mx-auto text-3xl">
                🆔
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Identity Verification</h2>
                <p className="text-gray-600 mt-2">
                  To verify your agent account, we&apos;ll need to verify your identity using a government-issued ID.
                </p>
              </div>
              <ul className="text-left text-sm text-gray-600 space-y-2 max-w-xs mx-auto">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>Take a selfie photo</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>Capture your ID document</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>Verification usually takes &lt; 1 minute</span>
                </li>
              </ul>
              <div className="flex flex-col gap-3 pt-4">
                <Button
                  onClick={handleStartVerification}
                  className="w-full bg-[#FE9200] hover:bg-[#E58300] text-white py-3"
                >
                  Start Verification
                </Button>
                <Button
                  onClick={onClose}
                  variant="ghost"
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Verifying State */}
          {status === 'verifying' && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 text-[#FE9200] animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">Verification in Progress</h3>
              <p className="text-sm text-gray-500 mt-2">
                Complete the verification in the popup window.
              </p>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Verification Submitted!</h3>
              <p className="text-gray-500 mt-2 mb-6">
                Your identity verification has been submitted successfully.
                You&apos;ll be notified once it&apos;s reviewed.
              </p>
              <Button
                onClick={onClose}
                className="bg-green-600 hover:bg-green-700 text-white px-8"
              >
                Continue
              </Button>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Verification Failed</h3>
              <p className="text-gray-500 mt-2 mb-6 max-w-xs mx-auto">
                {errorMessage || "We couldn't complete your verification. Please try again."}
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={onClose} variant="outline">
                  Close
                </Button>
                <Button
                  onClick={handleRetry}
                  className="bg-[#FE9200] hover:bg-[#E58300] text-white"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


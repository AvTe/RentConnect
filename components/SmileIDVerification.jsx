import React, { useEffect, useRef, useState } from 'react';
import { Button } from './ui/Button';
import { X } from 'lucide-react';

export const SmileIDVerification = ({ onClose, onComplete, userId }) => {
  const [step, setStep] = useState('intro'); // intro, selfie, id, processing, success, error
  const selfieRef = useRef(null);
  const idRef = useRef(null);
  const [images, setImages] = useState({ selfie: null, idFront: null, idBack: null });

  useEffect(() => {
    // Dynamically import the web components to avoid SSR issues
    import('@smileid/web-components');

    // Handle Selfie Capture Events
    const handleSelfieSuccess = (e) => {
      console.log('Selfie captured:', e.detail);
      setImages(prev => ({ ...prev, selfie: e.detail.image }));
      setStep('id');
    };

    // Handle ID Capture Events
    const handleIDSuccess = (e) => {
      console.log('ID captured:', e.detail);
      // Depending on ID type, might need back. For now assuming front only or handling logic later
      setImages(prev => ({ ...prev, idFront: e.detail.image }));
      setStep('processing');
      processVerification(e.detail.image);
    };

    const selfieElement = selfieRef.current;
    const idElement = idRef.current;

    if (selfieElement) {
      selfieElement.addEventListener('images-computed', handleSelfieSuccess);
    }
    if (idElement) {
      idElement.addEventListener('images-computed', handleIDSuccess);
    }

    return () => {
      if (selfieElement) {
        selfieElement.removeEventListener('images-computed', handleSelfieSuccess);
      }
      if (idElement) {
        idElement.removeEventListener('images-computed', handleIDSuccess);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const processVerification = async (idImage) => {
    try {
      // Here we would call our backend API which calls Smile ID
      // const response = await fetch('/api/verify-identity', { ... });
      
      // Simulating API call
      setTimeout(() => {
        onComplete({ success: true });
        setStep('success');
      }, 2000);
    } catch (error) {
      console.error('Verification failed:', error);
      setStep('error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/20 hover:bg-white/40 rounded-full text-gray-800 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-6 flex-1 overflow-y-auto">
          {step === 'intro' && (
            <div className="text-center space-y-6 py-8">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-3xl">
                🆔
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Identity Verification</h2>
              <p className="text-gray-600 max-w-md mx-auto">
                To verify your agent account, we need to capture a selfie and a photo of your government-issued ID.
              </p>
              <div className="flex flex-col gap-3 max-w-xs mx-auto">
                <Button onClick={() => setStep('selfie')} className="w-full bg-blue-600 text-white">
                  Start Verification
                </Button>
                <Button onClick={onClose} variant="ghost" className="w-full">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {step === 'selfie' && (
            <div className="flex flex-col items-center">
              <h3 className="text-lg font-semibold mb-4">Take a Selfie</h3>
              <div className="w-full max-w-md aspect-[3/4] bg-black rounded-lg overflow-hidden relative">
                {/* @ts-ignore */}
                <smart-camera-web ref={selfieRef} />
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Position your face within the oval and ensure good lighting.
              </p>
            </div>
          )}

          {step === 'id' && (
            <div className="flex flex-col items-center">
              <h3 className="text-lg font-semibold mb-4">Capture ID Document</h3>
              <div className="w-full max-w-md aspect-[4/3] bg-black rounded-lg overflow-hidden relative">
                {/* @ts-ignore */}
                <smart-camera-web ref={idRef} capture-id />
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Place your ID card within the frame. Ensure text is readable.
              </p>
            </div>
          )}

          {step === 'processing' && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
              <h3 className="text-xl font-semibold text-gray-900">Verifying Identity...</h3>
              <p className="text-gray-500 mt-2">This usually takes less than a minute.</p>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-[#FFE4C4] rounded-full flex items-center justify-center mx-auto mb-6 text-[#16A34A]">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Verification Successful!</h3>
              <p className="text-gray-500 mt-2 mb-8">Your account has been verified.</p>
              <Button onClick={onClose} className="bg-[#16A34A] text-white px-8">
                Continue
              </Button>
            </div>
          )}

          {step === 'error' && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
                <X className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Verification Failed</h3>
              <p className="text-gray-500 mt-2 mb-8">We couldn&apos;t verify your identity. Please try again.</p>
              <div className="flex gap-4 justify-center">
                <Button onClick={onClose} variant="outline">Close</Button>
                <Button onClick={() => setStep('intro')} className="bg-blue-600 text-white">Try Again</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

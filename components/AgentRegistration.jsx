import React, { useState } from 'react';
import { ArrowLeft, Building2, User, Phone, Mail, MapPin, Lock, Upload } from 'lucide-react';
import { Button } from './ui/Button';

export const AgentRegistration = ({ onNavigate, onSubmit }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    agencyName: '',
    email: '',
    phone: '',
    location: '',
    password: '',
    referralCode: '',
    idDocument: null
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-white font-sans">
      {/* Left Side - Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-24 relative z-10 overflow-y-auto">
        {/* Logo/Back */}
        <div className="absolute top-8 left-8 sm:left-12 lg:left-24 flex items-center gap-4">
          <button 
            onClick={() => onNavigate('landing')} 
            className="flex items-center text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
        </div>

        <div className="max-w-md w-full mx-auto mt-20 md:mt-0">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Agent Registration</h2>
          <p className="text-gray-500 mb-8">Join our network of verified agents and connect with serious tenants.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FE9200] focus:border-[#FE9200] outline-none transition-all bg-white text-gray-900 placeholder-gray-400"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agency Name</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FE9200] focus:border-[#FE9200] outline-none transition-all bg-white text-gray-900 placeholder-gray-400"
                  placeholder="Nairobi Homes Ltd."
                  value={formData.agencyName}
                  onChange={(e) => setFormData({...formData, agencyName: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FE9200] focus:border-[#FE9200] outline-none transition-all bg-white text-gray-900 placeholder-gray-400"
                    placeholder="agent@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FE9200] focus:border-[#FE9200] outline-none transition-all bg-white text-gray-900 placeholder-gray-400"
                    placeholder="+254..."
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FE9200] focus:border-[#FE9200] outline-none transition-all bg-white text-gray-900 placeholder-gray-400"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FE9200] focus:border-[#FE9200] outline-none transition-all bg-white text-gray-900 placeholder-gray-400"
                  placeholder="e.g. Lekki, Lagos"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Referral Code (Optional)</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FE9200] focus:border-[#FE9200] outline-none transition-all bg-white text-gray-900 placeholder-gray-400"
                  placeholder="e.g. JOH1234"
                  value={formData.referralCode}
                  onChange={(e) => setFormData({...formData, referralCode: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Government ID (NIN, Passport, or Driver&apos;s License)</label>
              <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-[#FE9200] transition-colors text-center cursor-pointer">
                <input
                  type="file"
                  required
                  accept="image/*,.pdf"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => setFormData({...formData, idDocument: e.target.files[0]})}
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <Upload className="w-8 h-8 text-gray-400" />
                  <p className="text-sm text-gray-500">
                    {formData.idDocument ? (
                      <span className="text-[#FE9200] font-medium">{formData.idDocument.name}</span>
                    ) : (
                      <span>Click to upload or drag and drop</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">PDF, JPG, PNG up to 5MB</p>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full py-3 bg-[#FE9200] hover:bg-[#E58300] text-white rounded-lg font-medium shadow-lg shadow-[#FFE4C4] transition-all mt-4"
            >
              Create Agent Account
            </Button>
            
            <p className="text-center text-sm text-gray-500 mt-4">
              Already have an account? 
              <button onClick={() => onNavigate('login')} className="ml-1 font-semibold text-[#FE9200] hover:underline">
                Sign In
              </button>
            </p>
          </form>
        </div>
      </div>

      {/* Right Side - Image/Testimonial */}
      <div className="hidden md:flex md:w-1/2 bg-[#0f172a] relative items-center justify-center p-12 text-white overflow-hidden">
         {/* Background Gradient/Image */}
         <div className="absolute inset-0 bg-gradient-to-br from-[#7A00AA] to-slate-900 z-0"></div>
         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1073&q=80')] opacity-20 bg-cover bg-center mix-blend-overlay"></div>
         
         <div className="relative z-10 max-w-lg">
            <h2 className="text-4xl font-bold mb-6 leading-tight">
               Grow your real estate business with Yoombaa.
            </h2>
            <div className="space-y-4">
               <p className="text-lg text-gray-300 italic leading-relaxed">
                  &quot;Since joining Yoombaa, my lead conversion rate has doubled. The quality of tenants is unmatched and the platform is so easy to use.&quot;
               </p>
               <div className="flex items-center gap-4 mt-8">
                  <div className="w-12 h-12 rounded-full bg-[#FE9200] flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-[#7A00AA]/20">D</div>
                  <div>
                     <p className="font-semibold text-white">David Okon</p>
                     <p className="text-sm text-[#FFD4A3]">Agent in Ikeja</p>
                  </div>
               </div>
            </div>
            
            {/* Logos at bottom */}
            <div className="mt-16 pt-8 border-t border-white/10 flex gap-8 opacity-40 grayscale">
               <div className="flex items-center gap-2">
                 <Building2 className="w-6 h-6" />
                 <span className="font-bold text-lg">Yoombaa</span>
               </div>
               <div className="flex items-center gap-2">
                 <span className="font-bold text-lg">Paystack</span>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { ArrowLeft, Building2, User, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from './ui/Button';

export const AgentRegistration = ({ onNavigate, onSubmit }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    agencyName: '',
    email: '',
    phone: '',
    location: ''
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="Lagos Homes Ltd."
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
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
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
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    placeholder="+234..."
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="e.g. Lekki, Lagos"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-lg shadow-emerald-100 transition-all mt-4"
            >
              Create Agent Account
            </Button>
            
            <p className="text-center text-sm text-gray-500 mt-4">
              Already have an account? 
              <button onClick={() => onNavigate('login')} className="ml-1 font-semibold text-emerald-600 hover:underline">
                Sign In
              </button>
            </p>
          </form>
        </div>
      </div>

      {/* Right Side - Image/Testimonial */}
      <div className="hidden md:flex md:w-1/2 bg-[#0f172a] relative items-center justify-center p-12 text-white overflow-hidden">
         {/* Background Gradient/Image */}
         <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 to-slate-900 z-0"></div>
         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1073&q=80')] opacity-20 bg-cover bg-center mix-blend-overlay"></div>
         
         <div className="relative z-10 max-w-lg">
            <h2 className="text-4xl font-bold mb-6 leading-tight">
               Grow your real estate business with RentConnect.
            </h2>
            <div className="space-y-4">
               <p className="text-lg text-gray-300 italic leading-relaxed">
                  &quot;Since joining RentConnect, my lead conversion rate has doubled. The quality of tenants is unmatched and the platform is so easy to use.&quot;
               </p>
               <div className="flex items-center gap-4 mt-8">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-emerald-900/20">D</div>
                  <div>
                     <p className="font-semibold text-white">David Okon</p>
                     <p className="text-sm text-emerald-200">Agent in Ikeja</p>
                  </div>
               </div>
            </div>
            
            {/* Logos at bottom */}
            <div className="mt-16 pt-8 border-t border-white/10 flex gap-8 opacity-40 grayscale">
               <div className="flex items-center gap-2">
                 <Building2 className="w-6 h-6" />
                 <span className="font-bold text-lg">RentConnect</span>
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

import React from 'react';
import { Building2, Users, ShieldCheck } from 'lucide-react';
import { Button } from './ui/Button';
import { Header } from './Header';
import { SearchFilter } from './SearchFilter';

export const LandingPage = ({ onNavigate, onSearch }) => {
  return (
    <div className="min-h-screen bg-white font-sans">
      
      {/* Hero Section */}
      <div className="relative bg-[#E6F4F1] min-h-[600px] lg:min-h-[700px] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full relative">
          <div className="grid lg:grid-cols-2 gap-12 h-full items-center pt-20 pb-32">
            
            {/* Left Content */}
            <div className="relative z-10 max-w-2xl">
              <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 leading-[1.1] mb-6 tracking-tight">
                Let&apos;s find your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-700">Dream Home!</span>
              </h1>
              <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-lg">
                We can help you rent, sell, or buy accommodation, take a mortgage, invest in real estate, and a lot more.
              </p>
              
              {/* Search Filter - Desktop Position */}
              <div className="hidden lg:block relative z-20">
                <SearchFilter onSearch={onSearch} />
              </div>
            </div>

            {/* Right Image */}
            <div className="relative h-full min-h-[400px] lg:min-h-[600px] flex items-end justify-end">
              <div className="absolute top-0 right-0 w-[150%] h-full bg-gradient-to-l from-white/20 to-transparent pointer-events-none" />
              <img 
                src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=1000" 
                alt="Modern Apartment Building" 
                className="object-cover object-center w-full h-full rounded-tl-[100px] shadow-2xl shadow-emerald-900/10"
                style={{ maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)' }}
              />
            </div>
          </div>

          {/* Search Filter - Mobile Position */}
          <div className="lg:hidden relative z-20 -mt-20 px-2 mb-12">
            <SearchFilter onSearch={onSearch} />
          </div>
        </div>
      </div>

      {/* Features */}
      <section className="pt-40 pb-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center p-6 rounded-2xl hover:bg-gray-50 transition-colors duration-300">
              <div className="bg-emerald-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3 hover:rotate-6 transition-transform">
                <Users className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Direct Connection</h3>
              <p className="text-gray-600 leading-relaxed">Connect directly with verified agents who have properties matching your needs.</p>
            </div>
            <div className="text-center p-6 rounded-2xl hover:bg-gray-50 transition-colors duration-300">
              <div className="bg-emerald-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 -rotate-3 hover:-rotate-6 transition-transform">
                <ShieldCheck className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Verified Agents</h3>
              <p className="text-gray-600 leading-relaxed">All agents are vetted to ensure a safe and secure house hunting experience.</p>
            </div>
            <div className="text-center p-6 rounded-2xl hover:bg-gray-50 transition-colors duration-300">
              <div className="bg-emerald-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3 hover:rotate-6 transition-transform">
                <Building2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">No Ghost Listings</h3>
              <p className="text-gray-600 leading-relaxed">Stop wasting time on unavailable properties. Get real options from active agents.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};


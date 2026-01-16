'use client';

import { ArrowLeft, Mail, Phone, MapPin, Clock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-3">
            <Image src="/yoombaa-logo.png" alt="Yoombaa" width={32} height={32} className="h-8 w-auto" />
            <span className="text-xl font-bold text-gray-900">Contact Us</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Get in Touch</h1>
          <p className="text-gray-500 mb-8">We&apos;d love to hear from you. Reach out to us anytime.</p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Information */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
              
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-[#FE9200]/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-[#FE9200]" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Email</h3>
                  <a href="mailto:support@yoombaa.com" className="text-[#FE9200] hover:underline">support@yoombaa.com</a>
                  <p className="text-sm text-gray-500 mt-1">For general inquiries</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-[#FE9200]/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-[#FE9200]" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Phone</h3>
                  <a href="tel:+254700000000" className="text-[#FE9200] hover:underline">+254 700 000 000</a>
                  <p className="text-sm text-gray-500 mt-1">Mon-Fri, 9am-6pm EAT</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-[#FE9200]/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-[#FE9200]" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Location</h3>
                  <p className="text-gray-600">Nairobi, Kenya</p>
                  <p className="text-sm text-gray-500 mt-1">East Africa</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-[#FE9200]/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-[#FE9200]" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Business Hours</h3>
                  <p className="text-gray-600">Monday - Friday: 9:00 AM - 6:00 PM</p>
                  <p className="text-gray-600">Saturday: 10:00 AM - 4:00 PM</p>
                  <p className="text-sm text-gray-500 mt-1">Closed on Sundays & Public Holidays</p>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">How Can We Help?</h2>
              
              <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-lg hover:border-[#FE9200] transition-colors">
                  <h3 className="font-medium text-gray-900 mb-2">For Tenants</h3>
                  <p className="text-gray-600 text-sm">Looking for a rental property? Submit your requirements and let verified agents find you the perfect home.</p>
                  <Link href="/" className="text-[#FE9200] text-sm font-medium hover:underline mt-2 inline-block">Find a Property →</Link>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg hover:border-[#FE9200] transition-colors">
                  <h3 className="font-medium text-gray-900 mb-2">For Agents</h3>
                  <p className="text-gray-600 text-sm">Connect with verified tenants actively looking for properties in your area. Subscribe to access leads.</p>
                  <Link href="/" className="text-[#FE9200] text-sm font-medium hover:underline mt-2 inline-block">Join as Agent →</Link>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg hover:border-[#FE9200] transition-colors">
                  <h3 className="font-medium text-gray-900 mb-2">Technical Support</h3>
                  <p className="text-gray-600 text-sm">Having issues with the platform? Our support team is here to help.</p>
                  <a href="mailto:support@yoombaa.com" className="text-[#FE9200] text-sm font-medium hover:underline mt-2 inline-block">Email Support →</a>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg hover:border-[#FE9200] transition-colors">
                  <h3 className="font-medium text-gray-900 mb-2">Partnerships</h3>
                  <p className="text-gray-600 text-sm">Interested in partnering with Yoombaa? Let&apos;s discuss how we can work together.</p>
                  <a href="mailto:partners@yoombaa.com" className="text-[#FE9200] text-sm font-medium hover:underline mt-2 inline-block">Partner With Us →</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center space-x-4">
          <Link href="/privacy-policy" className="text-gray-500 hover:text-[#FE9200] transition-colors">Privacy Policy</Link>
          <span className="text-gray-300">|</span>
          <Link href="/terms-of-service" className="text-gray-500 hover:text-[#FE9200] transition-colors">Terms of Service</Link>
        </div>
      </main>
    </div>
  );
}


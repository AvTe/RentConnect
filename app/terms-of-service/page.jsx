'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-3">
            <img src="/yoombaa-logo.png" alt="Yoombaa" className="h-8 w-auto" />
            <span className="text-xl font-bold text-gray-900">Terms of Service</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-gray-500 mb-8">Last updated: January 16, 2025</p>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-600 leading-relaxed">
                By accessing or using Yoombaa's website (www.yoombaa.com) and mobile applications (collectively, the "Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-600 leading-relaxed">
                Yoombaa is a rental marketplace that connects tenants seeking rental properties with property agents in Kenya. We facilitate connections but are not a party to any rental agreements between users.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>You must be at least 18 years old to create an account</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                <li>You agree to provide accurate and complete information</li>
                <li>You are responsible for all activities under your account</li>
                <li>We reserve the right to suspend or terminate accounts that violate these terms</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. User Types</h2>
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-800 mb-2">Tenants</h3>
                <ul className="list-disc pl-6 text-gray-600 space-y-1">
                  <li>May submit rental requests with their property preferences</li>
                  <li>Will be contacted by matched agents</li>
                  <li>Must provide accurate contact information and requirements</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Property Agents</h3>
                <ul className="list-disc pl-6 text-gray-600 space-y-1">
                  <li>Must complete verification and approval process</li>
                  <li>Must purchase credits to unlock and contact leads</li>
                  <li>Must provide professional and honest service to tenants</li>
                  <li>Must not share, resell, or misuse tenant contact information</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Credits and Payments</h2>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Agents must purchase credits to access tenant leads</li>
                <li>Credit prices are displayed in Kenyan Shillings (KES)</li>
                <li>Payments are processed securely via M-Pesa and Pesapal</li>
                <li>Credits are non-refundable once used to unlock a lead</li>
                <li>Unused credits remain valid as per our refund policy</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Prohibited Conduct</h2>
              <p className="text-gray-600 leading-relaxed mb-4">Users must NOT:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Provide false or misleading information</li>
                <li>Harass, spam, or abuse other users</li>
                <li>Use the Platform for illegal activities</li>
                <li>Attempt to circumvent payment systems</li>
                <li>Share, sell, or distribute lead information to third parties</li>
                <li>Impersonate others or create fake accounts</li>
                <li>Interfere with Platform operations or security</li>
                <li>Scrape or collect data without permission</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Limitation of Liability</h2>
              <p className="text-gray-600 leading-relaxed">
                Yoombaa is a marketplace platform only. We do not guarantee the accuracy of property listings, the conduct of agents or tenants, or the success of any rental transaction. Users engage with each other at their own risk. To the maximum extent permitted by law, Yoombaa shall not be liable for any indirect, incidental, or consequential damages.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Intellectual Property</h2>
              <p className="text-gray-600 leading-relaxed">
                All content, trademarks, logos, and intellectual property on the Platform belong to Yoombaa or our licensors. You may not copy, reproduce, or distribute our content without written permission.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Privacy</h2>
              <p className="text-gray-600 leading-relaxed">
                Your use of the Platform is also governed by our <Link href="/privacy-policy" className="text-brand-orange hover:underline">Privacy Policy</Link>, which describes how we collect, use, and protect your information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Modifications</h2>
              <p className="text-gray-600 leading-relaxed">
                We reserve the right to modify these Terms at any time. Changes will be effective upon posting. Continued use of the Platform after changes constitutes acceptance of the modified terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Governing Law</h2>
              <p className="text-gray-600 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of Kenya. Any disputes shall be subject to the exclusive jurisdiction of the courts in Nairobi, Kenya.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Contact Us</h2>
              <p className="text-gray-600 leading-relaxed">
                If you have questions about these Terms, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700 font-medium">Yoombaa</p>
                <p className="text-gray-600">Email: legal@yoombaa.com</p>
                <p className="text-gray-600">Website: www.yoombaa.com</p>
                <p className="text-gray-600">Location: Nairobi, Kenya</p>
              </div>
            </section>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center">
          <Link href="/privacy-policy" className="text-brand-orange hover:underline font-medium">
            ← View Privacy Policy
          </Link>
        </div>
      </main>
    </div>
  );
}


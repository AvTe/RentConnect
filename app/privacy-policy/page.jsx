'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function PrivacyPolicyPage() {
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
            <span className="text-xl font-bold text-gray-900">Privacy Policy</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-500 mb-8">Last updated: January 16, {new Date().getFullYear()}</p>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-600 leading-relaxed">
                Welcome to Yoombaa (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website (www.yoombaa.com) and mobile applications (collectively, the &ldquo;Platform&rdquo;).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
              <p className="text-gray-600 leading-relaxed mb-4">We collect information that you provide directly to us:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Account Information:</strong> Name, email address, phone number, password, and profile picture</li>
                <li><strong>Property Search Preferences:</strong> Location preferences, budget range, property type, and bedroom requirements</li>
                <li><strong>Agent Information:</strong> Business name, license details, service areas, and verification documents</li>
                <li><strong>Communication Data:</strong> Messages exchanged between tenants and agents</li>
                <li><strong>Payment Information:</strong> Transaction details for credit purchases (processed securely via M-Pesa/Pesapal)</li>
                <li><strong>Device Information:</strong> Device type, operating system, and unique device identifiers</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>To provide and maintain our Platform</li>
                <li>To connect tenants with property agents</li>
                <li>To process transactions and manage your account</li>
                <li>To send you updates, notifications, and marketing communications (with your consent)</li>
                <li>To improve our services and develop new features</li>
                <li>To prevent fraud and ensure platform security</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Information Sharing</h2>
              <p className="text-gray-600 leading-relaxed mb-4">We may share your information with:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Property Agents:</strong> When you submit a rental request, your contact details are shared with matched agents</li>
                <li><strong>Service Providers:</strong> Third-party companies that help us operate our Platform (payment processors, hosting, analytics)</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                We do NOT sell your personal information to third parties.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
              <p className="text-gray-600 leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal information, including encryption, secure servers, and access controls. However, no method of transmission over the Internet is 100% secure.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Your Rights</h2>
              <p className="text-gray-600 leading-relaxed mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate information</li>
                <li>Delete your account and associated data</li>
                <li>Opt-out of marketing communications</li>
                <li>Export your data in a portable format</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Cookies and Tracking</h2>
              <p className="text-gray-600 leading-relaxed">
                We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and deliver personalized content. You can manage cookie preferences through your browser settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Third-Party Services</h2>
              <p className="text-gray-600 leading-relaxed">
                Our Platform integrates with third-party services including Google (for authentication and maps), M-Pesa/Pesapal (for payments), and Africa&apos;s Talking (for SMS). These services have their own privacy policies.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Children&apos;s Privacy</h2>
              <p className="text-gray-600 leading-relaxed">
                Our Platform is not intended for children under 18 years of age. We do not knowingly collect personal information from children.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Changes to This Policy</h2>
              <p className="text-gray-600 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the &ldquo;Last updated&rdquo; date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Contact Us</h2>
              <p className="text-gray-600 leading-relaxed">
                If you have questions about this Privacy Policy, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700 font-medium">Yoombaa</p>
                <p className="text-gray-600">Email: privacy@yoombaa.com</p>
                <p className="text-gray-600">Website: www.yoombaa.com</p>
                <p className="text-gray-600">Location: Nairobi, Kenya</p>
              </div>
            </section>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center">
          <Link href="/terms-of-service" className="text-brand-orange hover:underline font-medium">
            View Terms of Service →
          </Link>
        </div>
      </main>
    </div>
  );
}


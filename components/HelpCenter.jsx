/* eslint-disable @next/next/no-img-element */
import React, { useState } from 'react';
import {
    Search, ChevronDown, ChevronRight, ArrowLeft,
    MessageCircle, Phone, Mail, Book, FileText, HelpCircle,
    Home, Users, CreditCard, Shield, Settings, Zap,
    CheckCircle, Clock, AlertCircle, ExternalLink
} from 'lucide-react';

// FAQ Data organized by categories
const faqCategories = [
    {
        id: 'getting-started',
        title: 'Getting Started',
        icon: Zap,
        faqs: [
            {
                question: 'How do I create an account on Yoombaa?',
                answer: 'Creating an account is simple! Click the "Sign Up" button on the homepage, enter your email and password, then verify your email. You can sign up as a Tenant (looking for a home) or as an Agent (listing properties).'
            },
            {
                question: 'What is the difference between Tenant and Agent accounts?',
                answer: 'Tenant accounts are for people looking to rent properties. You can post rental requests and receive responses from verified agents. Agent accounts are for property agents who want to connect with tenants and list their properties.'
            },
            {
                question: 'How do I post my first rental request?',
                answer: 'After signing in as a Tenant, click "Post New Request" on your dashboard. Fill in your requirements including location, budget, property type, and move-in date. Verified agents will then be able to see and respond to your request.'
            },
            {
                question: 'Is Yoombaa free to use?',
                answer: 'For Tenants, posting rental requests is completely free. Agents can view leads but need credits or a subscription to unlock tenant contact details. Check our Pricing page for more information on agent plans.'
            }
        ]
    },
    {
        id: 'for-tenants',
        title: 'For Tenants',
        icon: Home,
        faqs: [
            {
                question: 'How do agents contact me after I post a request?',
                answer: 'When an agent finds your request interesting, they can unlock your contact details using credits. They will then reach out via WhatsApp or phone call. You\'ll also receive notifications in your dashboard when agents show interest.'
            },
            {
                question: 'Can I edit or delete my rental request?',
                answer: 'Yes! Go to "My Requests" in your dashboard. Click the "Manage" button on any request to edit details, pause/resume the request, or delete it entirely. Paused requests won\'t be shown to agents.'
            },
            {
                question: 'How do I know if an agent is verified?',
                answer: 'All agents on Yoombaa go through a verification process. Look for the verified badge on agent profiles. We verify their identity, business registration, and contact information to ensure your safety.'
            },
            {
                question: 'What should I do if an agent is unresponsive or unprofessional?',
                answer: 'You can report any issues through our support channels. Go to your request, find the agent interaction, and click "Report Issue". Our team reviews all reports and takes appropriate action to maintain platform quality.'
            }
        ]
    },
    {
        id: 'for-agents',
        title: 'For Agents',
        icon: Users,
        faqs: [
            {
                question: 'How do I get verified as an agent?',
                answer: 'After signing up as an Agent, complete your profile with your business details, upload your ID and relevant certifications. Our team will review your application within 24-48 hours. You\'ll receive an email once approved.'
            },
            {
                question: 'How do credits work?',
                answer: 'Credits are used to unlock tenant contact details. Each lead unlock costs a certain number of credits depending on your subscription tier. You can purchase credit packages or subscribe to a monthly plan for better value.'
            },
            {
                question: 'What happens when I unlock a lead?',
                answer: 'When you unlock a lead, you get access to the tenant\'s phone number and WhatsApp. You can then reach out directly to discuss their requirements. The tenant is also notified that you\'ve expressed interest.'
            },
            {
                question: 'How can I get more leads?',
                answer: 'Complete your agent profile with photos and detailed information. Respond quickly to new leads - our algorithm favors active agents. You can also upgrade to premium plans for priority access to high-quality leads.'
            }
        ]
    },
    {
        id: 'payments',
        title: 'Payments & Billing',
        icon: CreditCard,
        faqs: [
            {
                question: 'What payment methods do you accept?',
                answer: 'We accept M-Pesa, credit/debit cards (Visa, Mastercard), and bank transfers. All payments are processed securely through trusted payment gateways.'
            },
            {
                question: 'How do I upgrade my subscription?',
                answer: 'Go to Settings > Subscription in your dashboard. Choose your preferred plan and complete the payment. Your new features will be activated immediately after successful payment.'
            },
            {
                question: 'Can I get a refund?',
                answer: 'We offer refunds on a case-by-case basis. If you\'ve purchased credits but haven\'t used them, contact support within 7 days for a full refund. Subscription refunds are prorated based on usage.'
            },
            {
                question: 'How do I redeem a voucher code?',
                answer: 'Go to Settings > Vouchers in your dashboard. Enter your voucher code and click "Redeem". If valid, the credits or benefits will be added to your account immediately.'
            }
        ]
    },
    {
        id: 'security',
        title: 'Privacy & Security',
        icon: Shield,
        faqs: [
            {
                question: 'Is my personal information safe?',
                answer: 'Absolutely. We use industry-standard encryption for all data. Your contact details are only shared with agents after you post a request and they unlock your lead. You control what information is visible.'
            },
            {
                question: 'How do I change my password?',
                answer: 'Go to Profile Settings > Security. Click "Change Password", enter your current password and your new password twice. For security, choose a strong password with at least 8 characters.'
            },
            {
                question: 'Can I delete my account?',
                answer: 'Yes, you can delete your account at any time. Go to Profile Settings > Account. Click "Delete Account" and confirm. Note that this action is irreversible and all your data will be permanently removed.'
            },
            {
                question: 'What should I do if I suspect unauthorized access?',
                answer: 'Immediately change your password and contact our support team. We\'ll help you secure your account and investigate any suspicious activity. Enable two-factor authentication for added security.'
            }
        ]
    }
];

// Quick Answers Grid Data
const quickAnswers = [
    {
        icon: Home,
        title: 'What is Yoombaa?',
        description: 'Yoombaa connects tenants looking for rental homes with verified real estate agents in Kenya.'
    },
    {
        icon: Users,
        title: 'The Yoombaa Platform',
        description: 'A marketplace designed to simplify the rental process for both tenants and agents.'
    },
    {
        icon: Zap,
        title: 'Installing Yoombaa',
        description: 'Access Yoombaa directly from your browser - no installation required, works on all devices.'
    },
    {
        icon: Settings,
        title: 'Getting Started',
        description: 'Sign up, create your profile, and start posting requests or browsing leads in minutes.'
    },
    {
        icon: CreditCard,
        title: 'Managing Payments',
        description: 'Learn about credits, subscriptions, and how to manage your billing preferences.'
    },
    {
        icon: Shield,
        title: 'Yoombaa Inbox',
        description: 'Notifications and messages from agents are delivered to your secure dashboard inbox.'
    }
];

// Documentation Sections - Platform workflow focused (no pricing)
const docSections = [
    {
        id: 'introduction',
        title: 'Introduction',
        icon: Home,
        readTime: '3 min',
        content: `Welcome to Yoombaa! This guide will help you understand how to use our platform effectively.

**What is Yoombaa?**
Yoombaa is Kenya's premier rental platform that connects tenants looking for homes with verified real estate agents. Our mission is to simplify the house hunting process for everyone.

**Who is Yoombaa for?**
• **Tenants** - Post your rental requirements and let verified agents find properties for you
• **Agents** - Access quality leads from tenants actively looking for rentals in your area

**Platform Benefits:**
• Save time - No more endless property searches
• Verified agents - All agents on Yoombaa go through a verification process
• Direct connection - Agents reach out to you via WhatsApp or phone
• Free for tenants - Posting rental requests is completely free`
    },
    {
        id: 'how-leads-work',
        title: 'How Tenant Leads Work',
        icon: Users,
        readTime: '4 min',
        content: `**What is a Lead?**
A lead is a rental request posted by a tenant. When you (as a tenant) post your requirements, it becomes a "lead" that verified agents can view and respond to.

**Creating a Lead (For Tenants):**
1. Sign in to your tenant account
2. Click "Post New Request" on your dashboard
3. Fill in your requirements:
   • Property type (Studio, 1BR, 2BR, etc.)
   • Preferred location/neighborhood
   • Monthly budget range
   • Move-in timeline
   • Special requirements (parking, pets, etc.)
4. Submit your request

**Lead Visibility:**
Once submitted, your lead becomes visible to verified agents in your preferred location. Agents who have properties matching your requirements will reach out to you.

**Managing Your Leads:**
• **Edit** - Update your requirements anytime
• **Pause** - Temporarily hide your lead from agents
• **Resume** - Make your lead visible again
• **Delete** - Permanently remove your lead

**Example:**
_"I'm looking for a 2BR apartment in Kilimani, Nairobi with a budget of Ksh 45,000-55,000. Move-in date: End of this month. Must have parking."_

This becomes a lead that agents in Kilimani can view and respond to.`
    },
    {
        id: 'agent-unlocking',
        title: 'How Agents Unlock Leads',
        icon: Zap,
        readTime: '3 min',
        content: `**The Unlock Process**
When an agent finds a lead that matches their available properties, they can "unlock" it to access the tenant's contact details.

**What Happens When a Lead is Unlocked:**
1. Agent views your lead (they can see your requirements but not your contact info)
2. Agent reviews if they have matching properties
3. Agent unlocks your lead to get your phone number/WhatsApp
4. You receive a notification that an agent is interested
5. Agent reaches out to you directly

**For Tenants:**
• You'll be notified when an agent unlocks your lead
• Multiple agents can unlock the same lead
• Agents will contact you via WhatsApp or phone call
• You can report any unprofessional agents

**For Agents:**
• Each lead unlock uses credits from your account
• Once unlocked, you have full access to the tenant's contact details
• Reach out promptly - tenants appreciate quick responses
• Provide accurate property information to build trust`
    },
    {
        id: 'slots-system',
        title: 'Understanding Agent Slots',
        icon: Settings,
        readTime: '4 min',
        content: `**What are Slots?**
Slots determine how many leads an agent can hold at any given time. Think of slots as "active connections" with tenants.

**How Slots Work:**
• Each agent has a limited number of active slots
• When you unlock a lead, it occupies one slot
• Once you've connected with the tenant and completed the transaction, the slot is freed
• More slots = more leads you can work on simultaneously

**Slot Status:**
• **Active** - Slot is being used for an active lead
• **Available** - Slot is free for a new lead
• **Pending** - Lead is being processed

**Managing Your Slots Effectively:**
1. Focus on quality over quantity
2. Follow up with leads promptly
3. Mark completed transactions to free up slots
4. Don't let slots sit idle with unresponsive leads

**Example Scenario:**
_Agent has 5 slots. They unlock 3 leads. They have 2 slots remaining. Once they successfully help a tenant find a property and mark it complete, that slot becomes available again._`
    },
    {
        id: 'verification-process',
        title: 'Agent Verification',
        icon: CheckCircle,
        readTime: '3 min',
        content: `**Why Verification Matters**
Yoombaa maintains strict verification to ensure tenant safety and platform quality.

**Verification Requirements:**
• Valid government-issued ID (National ID or Passport)
• Business registration (if applicable)
• Phone number verification (SMS/WhatsApp)
• Email verification
• Complete profile with photo

**Verification Steps:**
1. Create an agent account
2. Complete your profile information
3. Upload required documents
4. Submit for verification
5. Wait for review (24-48 hours)
6. Receive verification status via email

**Verification Status:**
• **Pending** - Application submitted, under review
• **Verified** - Approved, can access leads
• **Rejected** - Did not meet requirements (you can reapply)

**Benefits of Being Verified:**
✓ Access to quality leads
✓ Verified badge on your profile
✓ Increased trust from tenants
✓ Priority support from our team`
    },
    {
        id: 'workflow-overview',
        title: 'Platform Workflow',
        icon: FileText,
        readTime: '5 min',
        content: `**Complete Platform Workflow**

**TENANT JOURNEY:**

Step 1: Create Account
→ Sign up with email or phone
→ Complete your profile

Step 2: Post Rental Request
→ Fill in your requirements
→ Submit and wait for agents

Step 3: Receive Agent Contact
→ Get notified when agents show interest
→ Agents reach out via WhatsApp/Phone

Step 4: Find Your Home
→ View properties suggested by agents
→ Schedule viewings
→ Choose your new home

---

**AGENT JOURNEY:**

Step 1: Register & Get Verified
→ Create agent account
→ Submit verification documents
→ Get approved

Step 2: Browse Available Leads
→ View leads in your target areas
→ Filter by property type, budget, location

Step 3: Unlock Matching Leads
→ Find leads that match your properties
→ Unlock to access contact details
→ Slot is occupied

Step 4: Connect & Close
→ Reach out to tenant promptly
→ Show relevant properties
→ Complete the transaction
→ Slot is freed for new leads

**Important Tips:**
• Respond to leads within 24 hours for best results
• Be honest about property availability
• Maintain professional communication
• Report any issues to our support team`
    }
];

// FAQ Accordion Item Component
const FAQItem = ({ question, answer, isOpen, onClick }) => (
    <div className="border border-gray-100 rounded-xl overflow-hidden bg-white hover:shadow-md transition-all">
        <button
            onClick={onClick}
            className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
        >
            <span className="font-semibold text-gray-900 pr-4">{question}</span>
            <ChevronDown
                size={20}
                className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
        </button>
        <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
            <div className="px-5 pb-4 text-gray-600 leading-relaxed">
                {answer}
            </div>
        </div>
    </div>
);

// Documentation Sidebar Item
const DocSidebarItem = ({ title, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
            ? 'bg-[#FE9200] text-white'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
    >
        {title}
    </button>
);

export const HelpCenter = ({ onBack }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('getting-started');
    const [openFaqId, setOpenFaqId] = useState(null);
    const [activeView, setActiveView] = useState('main'); // 'main', 'docs'
    const [activeDocSection, setActiveDocSection] = useState('introduction');
    const [showSearchResults, setShowSearchResults] = useState(false);

    // Get current FAQ category
    const currentCategory = faqCategories.find(c => c.id === activeCategory);

    // Live search results - combine docs and FAQs
    const liveSearchResults = searchQuery.length >= 2 ? [
        // Search in documentation
        ...docSections
            .filter(doc =>
                doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                doc.content.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map(doc => ({
                type: 'doc',
                id: doc.id,
                title: doc.title,
                preview: doc.content.substring(0, 100) + '...',
                icon: Book
            })),
        // Search in FAQs
        ...faqCategories.flatMap(cat =>
            cat.faqs
                .filter(faq =>
                    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map(faq => ({
                    type: 'faq',
                    categoryId: cat.id,
                    question: faq.question,
                    title: faq.question,
                    preview: faq.answer.substring(0, 100) + '...',
                    category: cat.title,
                    icon: HelpCircle
                }))
        )
    ].slice(0, 8) : []; // Limit to 8 results

    // Filter FAQs based on search (for FAQ section below)
    const filteredFaqs = searchQuery
        ? faqCategories.flatMap(cat =>
            cat.faqs.filter(faq =>
                faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
            ).map(faq => ({ ...faq, category: cat.title, categoryId: cat.id }))
        )
        : currentCategory?.faqs || [];

    // Handle search result click
    const handleSearchResultClick = (result) => {
        setShowSearchResults(false);
        setSearchQuery('');

        if (result.type === 'doc') {
            setActiveDocSection(result.id);
            setActiveView('docs');
        } else if (result.type === 'faq') {
            setActiveCategory(result.categoryId);
            // Find the FAQ index and open it
            const faqIndex = filteredFaqs.findIndex(f => f.question === result.question);
            if (faqIndex !== -1) {
                setOpenFaqId(faqIndex);
            }
            // Scroll to FAQs section
            setTimeout(() => {
                document.getElementById('faq-section')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    };

    // Get current doc section
    const currentDocSection = docSections.find(s => s.id === activeDocSection);

    if (activeView === 'docs') {
        const currentIdx = docSections.findIndex(s => s.id === activeDocSection);
        const prevSection = currentIdx > 0 ? docSections[currentIdx - 1] : null;
        const nextSection = currentIdx < docSections.length - 1 ? docSections[currentIdx + 1] : null;

        // Helper to render formatted content
        const renderContent = (content) => {
            return content.split('\n\n').map((paragraph, idx) => {
                // Check if it's a header (starts with **)
                if (paragraph.startsWith('**') && paragraph.includes(':**')) {
                    const headerMatch = paragraph.match(/^\*\*(.+?):\*\*$/);
                    if (headerMatch) {
                        return (
                            <h3 key={idx} className="text-lg font-bold text-gray-900 mt-6 mb-3">
                                {headerMatch[1]}
                            </h3>
                        );
                    }
                }

                // Check if it's a header without colon
                if (paragraph.startsWith('**') && paragraph.endsWith('**') && !paragraph.includes('\n')) {
                    return (
                        <h3 key={idx} className="text-lg font-bold text-gray-900 mt-6 mb-3">
                            {paragraph.replace(/\*\*/g, '')}
                        </h3>
                    );
                }

                // Check for divider
                if (paragraph.trim() === '---') {
                    return <hr key={idx} className="my-8 border-gray-200" />;
                }

                // Regular paragraph with inline formatting
                return (
                    <p key={idx} className="text-gray-600 leading-relaxed mb-4 whitespace-pre-line">
                        {paragraph.split(/(\*\*[^*]+\*\*|_[^_]+_|✓)/g).map((part, i) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                                return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
                            }
                            if (part.startsWith('_') && part.endsWith('_')) {
                                return <em key={i} className="italic text-gray-500 bg-gray-50 px-2 py-1 rounded">{part.slice(1, -1)}</em>;
                            }
                            if (part === '✓') {
                                return <span key={i} className="text-emerald-500">✓</span>;
                            }
                            return part;
                        })}
                    </p>
                );
            });
        };

        return (
            <div className="min-h-screen bg-[#F8F9FB]">
                {/* Documentation Header */}
                <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
                    <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setActiveView('main')}
                                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                <ArrowLeft size={20} className="text-gray-600" />
                            </button>
                            <div className="flex items-center gap-2">
                                <Book size={22} className="text-[#FE9200]" />
                                <span className="text-lg font-bold text-gray-900 hidden sm:inline">Documentation</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock size={14} />
                            <span>{currentDocSection?.readTime || '3 min'} read</span>
                        </div>
                    </div>

                    {/* Mobile Horizontal Tabs */}
                    <div className="md:hidden overflow-x-auto scrollbar-hide border-t border-gray-100">
                        <div className="flex gap-1 p-2 min-w-max">
                            {docSections.map((section, idx) => (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveDocSection(section.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeDocSection === section.id
                                            ? 'bg-[#FE9200] text-white'
                                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                                        {idx + 1}
                                    </span>
                                    {section.title}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
                    <div className="flex gap-8">
                        {/* Desktop Sidebar */}
                        <div className="hidden md:block w-64 flex-shrink-0">
                            <div className="bg-white rounded-2xl border border-gray-100 p-4 sticky top-28">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-3">Getting Started</p>
                                <div className="space-y-1">
                                    {docSections.map((section, idx) => (
                                        <button
                                            key={section.id}
                                            onClick={() => setActiveDocSection(section.id)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${activeDocSection === section.id
                                                    ? 'bg-[#FE9200] text-white'
                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                }`}
                                        >
                                            {section.icon && (
                                                <section.icon size={16} className={activeDocSection === section.id ? 'text-white' : 'text-gray-400'} />
                                            )}
                                            <span className="flex-1 truncate">{section.title}</span>
                                            {activeDocSection === section.id && (
                                                <ChevronRight size={14} className="text-white/70" />
                                            )}
                                        </button>
                                    ))}
                                </div>

                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-3">Resources</p>
                                    <a href="#" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-[#FE9200] transition-colors rounded-lg hover:bg-gray-50">
                                        <ExternalLink size={14} />
                                        Community Forum
                                    </a>
                                    <a href="#" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-[#FE9200] transition-colors rounded-lg hover:bg-gray-50">
                                        <ExternalLink size={14} />
                                        Video Tutorials
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                                {/* Breadcrumb */}
                                <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                                    <span>Docs</span>
                                    <ChevronRight size={14} />
                                    <span className="text-gray-600 font-medium">{currentDocSection?.title}</span>
                                </div>

                                {/* Title */}
                                <div className="flex items-start gap-4 mb-8">
                                    {currentDocSection?.icon && (
                                        <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                                            <currentDocSection.icon size={24} className="text-[#FE9200]" />
                                        </div>
                                    )}
                                    <div>
                                        <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">{currentDocSection?.title}</h1>
                                        <div className="flex items-center gap-3 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Clock size={14} />
                                                {currentDocSection?.readTime || '3 min'} read
                                            </span>
                                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                            <span>Last updated Jan 2026</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="prose prose-gray max-w-none">
                                    {currentDocSection && renderContent(currentDocSection.content)}
                                </div>

                                {/* Info Box */}
                                <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                                    <AlertCircle size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-blue-900">Need more help?</p>
                                        <p className="text-sm text-blue-700">Contact our support team via Live Chat or email for personalized assistance.</p>
                                    </div>
                                </div>

                                {/* Navigation */}
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-8 pt-6 border-t border-gray-100">
                                    {prevSection ? (
                                        <button
                                            onClick={() => setActiveDocSection(prevSection.id)}
                                            className="flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left group"
                                        >
                                            <ArrowLeft size={18} className="text-gray-400 group-hover:text-[#FE9200] transition-colors" />
                                            <div>
                                                <p className="text-xs text-gray-400 font-medium">Previous</p>
                                                <p className="text-sm font-semibold text-gray-700">{prevSection.title}</p>
                                            </div>
                                        </button>
                                    ) : <div />}

                                    {nextSection ? (
                                        <button
                                            onClick={() => setActiveDocSection(nextSection.id)}
                                            className="flex items-center gap-3 px-4 py-3 bg-[#FE9200]/10 hover:bg-[#FE9200]/20 rounded-xl transition-colors text-right group sm:ml-auto"
                                        >
                                            <div>
                                                <p className="text-xs text-[#FE9200] font-medium">Next</p>
                                                <p className="text-sm font-semibold text-gray-700">{nextSection.title}</p>
                                            </div>
                                            <ChevronRight size={18} className="text-[#FE9200]" />
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F9FB]">
            {/* Hero Section - Without overflow hidden to allow dropdown */}
            <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900/50" />

                <div className="relative max-w-5xl mx-auto px-6 md:px-8 pt-8 pb-24 md:pb-28">
                    {/* Header with Logo and Back Button */}
                    <div className="flex items-center justify-between mb-12">
                        <img src="/yoombaa-logo.svg" alt="Yoombaa" className="h-8 md:h-10 brightness-0 invert" />
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/10"
                        >
                            <ArrowLeft size={16} />
                            <span className="text-sm font-semibold">Back to Dashboard</span>
                        </button>
                    </div>

                    <div className="text-center">
                        <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                            Support & Documentation
                        </h1>
                        <p className="text-white/60 text-base md:text-lg mb-10 max-w-lg mx-auto leading-relaxed">
                            Need help? Search our documentation or browse frequently asked questions.
                        </p>
                    </div>
                </div>
            </div>

            {/* Search Bar - Positioned to overlap hero and content */}
            <div className="relative max-w-2xl mx-auto px-6 -mt-8 z-50">
                <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2">
                        <Search className="text-[#FE9200]" size={22} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search for answers..."
                        value={searchQuery}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setShowSearchResults(e.target.value.length >= 2);
                        }}
                        onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
                        className="w-full pl-14 pr-6 py-5 bg-white rounded-2xl text-gray-900 text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FE9200] shadow-xl border border-gray-100 transition-all"
                    />
                </div>

                {/* Live Search Results Dropdown */}
                {showSearchResults && liveSearchResults.length > 0 && (
                    <div
                        className="absolute top-full left-6 right-6 mt-3 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[100] max-h-[400px] overflow-y-auto"
                        onMouseDown={(e) => e.preventDefault()}
                    >
                        <div className="p-3">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 py-2">
                                {liveSearchResults.length} Results Found
                            </p>
                            <div className="space-y-1">
                                {liveSearchResults.map((result, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSearchResultClick(result)}
                                        className="w-full flex items-start gap-4 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors text-left group"
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${result.type === 'doc' ? 'bg-blue-50' : 'bg-orange-50'
                                            }`}>
                                            <result.icon size={18} className={
                                                result.type === 'doc' ? 'text-blue-500' : 'text-[#FE9200]'
                                            } />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-gray-900 group-hover:text-[#FE9200] transition-colors line-clamp-1">
                                                    {result.title}
                                                </span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${result.type === 'doc'
                                                    ? 'bg-blue-100 text-blue-600'
                                                    : 'bg-orange-100 text-[#FE9200]'
                                                    }`}>
                                                    {result.type === 'doc' ? 'DOCS' : 'FAQ'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 line-clamp-1">{result.preview}</p>
                                        </div>
                                        <ChevronRight size={18} className="text-gray-300 group-hover:text-[#FE9200] transition-colors flex-shrink-0 mt-2" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* No Results */}
                {showSearchResults && searchQuery.length >= 2 && liveSearchResults.length === 0 && (
                    <div
                        className="absolute top-full left-6 right-6 mt-3 bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 text-center z-[100]"
                        onMouseDown={(e) => e.preventDefault()}
                    >
                        <HelpCircle size={40} className="text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-600 font-semibold">No results found</p>
                        <p className="text-sm text-gray-400 mt-1">Try different keywords</p>
                    </div>
                )}
            </div>

            {/* Click outside to close search results */}
            {showSearchResults && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowSearchResults(false)}
                />
            )}

            <div className="max-w-5xl mx-auto px-6 md:px-8 pt-12 pb-16">
                {/* Contact Options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:border-emerald-100 transition-all group cursor-pointer">
                        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                            <MessageCircle className="text-emerald-500" size={26} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Live Support</h3>
                        <p className="text-sm text-gray-500 mb-4 leading-relaxed">Chat with our support team in real-time</p>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-emerald-600 font-semibold text-sm">Online Now</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:border-blue-100 transition-all group cursor-pointer">
                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                            <Phone className="text-blue-500" size={26} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Call Us</h3>
                        <p className="text-sm text-gray-500 mb-4 leading-relaxed">Speak directly with our support team</p>
                        <span className="text-blue-600 font-bold">+254 700 123 456</span>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:border-purple-100 transition-all group cursor-pointer">
                        <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                            <Mail className="text-purple-500" size={26} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Email Support</h3>
                        <p className="text-sm text-gray-500 mb-4 leading-relaxed">Get help via email within 24 hours</p>
                        <span className="text-purple-600 font-bold">support@yoombaa.com</span>
                    </div>
                </div>

                {/* Quick Find Answers */}
                <div className="mb-14">
                    <h2 className="text-2xl font-black text-gray-900 mb-6">Quickfind Answers</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {quickAnswers.map((item, idx) => (
                            <div
                                key={idx}
                                onClick={() => {
                                    setActiveView('docs');
                                    setActiveDocSection('introduction');
                                }}
                                className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-[#FE9200]/30 transition-all cursor-pointer group"
                            >
                                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#FE9200]/10 transition-colors">
                                    <item.icon size={22} className="text-gray-400 group-hover:text-[#FE9200] transition-colors" />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2 group-hover:text-[#FE9200] transition-colors">{item.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Documentation Button */}
                <div className="mb-14">
                    <div className="bg-gradient-to-r from-[#FE9200] to-[#FF6B00] rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                <Book size={32} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-1">Full Documentation</h3>
                                <p className="text-white/80 text-base">Explore detailed guides and tutorials</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setActiveView('docs')}
                            className="bg-white text-[#FE9200] hover:bg-gray-50 font-bold px-8 py-4 rounded-xl shadow-lg text-base flex items-center gap-2 transition-all"
                        >
                            View Documentation
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                {/* General FAQs Section */}
                <div id="faq-section">
                    <h2 className="text-2xl font-black text-gray-900 mb-6">General FAQs</h2>

                    {/* Category Tabs */}
                    {!searchQuery && (
                        <div className="flex flex-wrap gap-2 mb-6">
                            {faqCategories.map(category => (
                                <button
                                    key={category.id}
                                    onClick={() => {
                                        setActiveCategory(category.id);
                                        setOpenFaqId(null);
                                    }}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeCategory === category.id
                                        ? 'bg-[#FE9200] text-white'
                                        : 'bg-white text-gray-600 border border-gray-200 hover:border-[#FE9200]/50'
                                        }`}
                                >
                                    <category.icon size={16} />
                                    {category.title}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Search Results Label */}
                    {searchQuery && (
                        <p className="text-sm text-gray-500 mb-4">
                            Found {filteredFaqs.length} result{filteredFaqs.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
                        </p>
                    )}

                    {/* FAQ List */}
                    <div className="space-y-3">
                        {filteredFaqs.map((faq, idx) => (
                            <FAQItem
                                key={idx}
                                question={searchQuery ? `[${faq.category}] ${faq.question}` : faq.question}
                                answer={faq.answer}
                                isOpen={openFaqId === idx}
                                onClick={() => setOpenFaqId(openFaqId === idx ? null : idx)}
                            />
                        ))}

                        {filteredFaqs.length === 0 && (
                            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                                <HelpCircle size={40} className="text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No FAQs found matching your search.</p>
                                <p className="text-sm text-gray-400 mt-1">Try different keywords or browse categories above.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Still Need Help */}
                <div className="mt-12 text-center bg-white rounded-2xl border border-gray-100 p-8">
                    <AlertCircle size={40} className="text-[#FE9200] mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Still need help?</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        Can&apos;t find what you&apos;re looking for? Our support team is ready to assist you.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <button className="bg-[#FE9200] hover:bg-[#E58300] text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all">
                            <MessageCircle size={18} />
                            Start Live Chat
                        </button>
                        <button className="border-2 border-gray-200 text-gray-700 hover:bg-gray-50 font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all">
                            <Mail size={18} />
                            Send Email
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

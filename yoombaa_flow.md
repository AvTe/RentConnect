# Yoombaa Business Model: Complete Integrated Flow

This document outlines the complete operational and technical flow of the RentConnect platform, transformed into the **Yoombaa "Reverse Marketplace" Model**.

---

## 1. Lead Acquisition & Quality Control (The Funnel)
*   **Source**: Automated ads (Meta/TikTok) targeting specific satellite towns (Roysambu, Ruaka, etc.).
*   **Verification**: Every lead must undergo **OTP Phone Verification** (via Infobip/SMS) before being listed.
*   **Tiering**: Leads are automatically categorized into three tiers based on budget:
    *   **Student/Budget**: < KES 12k (Base Price: 50-100 Credits)
    *   **Standard**: KES 15k - 45k (Base Price: 250-350 Credits)
    *   **Premium**: KES 50k+ (Base Price: 500-1,000 Credits)

## 2. Real-Time Distribution (The Push)
*   **WhatsApp Notification**: As soon as a verified lead is created, matching agents receive a **WhatsApp alert** via Infobip.
*   **FOMO Content**: The message includes: *"2 agents are already viewing this lead. Only 1 slot left!"*
*   **Magic Link**: A direct link that bypasses the home page and takes the agent straight to the Lead Detail page.

## 3. The Marketplace (The Agent Dashboard)
The dashboard is no longer just a list; it is a **competition room**.

*   **Teaser Cards**:
    *   Displays: Requirements, Location, Budget, Move-in Urgency, Car/Parking needs.
    *   Hides: Name and Phone Number.
*   **Live Slot Tracker**:
    *   Visual progress bar: `[ █ █ ░ ]` (2 of 3 agents have unlocked).
    *   Dynamic text: "Slot 3 remaining at KES 500."
*   **Surge Pricing Logic**:
    *   **Slot 1 (The Early Bird)**: Base Price (e.g., 250 credits).
    *   **Slot 2 (The Follower)**: Base + 40% (e.g., 350 credits).
    *   **Slot 3 (The Sniper)**: Base + 100% (e.g., 500 credits).
*   **Exclusive Buyout (The Shark Move)**:
    *   A Gold Button available **only if 0 slots are taken**.
    *   Price = `(Total of 3 slots) * 0.85`.
    *   Action: Instantly marks the lead as "SOLD OUT" for all other agents.

## 4. The Transaction & Reveal
*   **Wallet-Based Deduction**: Credits are deducted from the agent's prepaid wallet.
*   **Atomic Check**: The system verifies slot availability at the exact millisecond of purchase to prevent over-selling.
*   **Reveal**: Name and Phone number are permanently unlocked for the agent.
*   **Direct Actions**: One-click buttons to **Call**, **WhatsApp**, or **Direct Message** the tenant.

## 5. Trust & Refund System (The Bad Lead Button)
*   **Report Failure**: If an agent finds the lead is fake, unreachable, or already closed (outside of the 48h window), they click **"Report Bad Lead"**.
*   **Verification**: Admin/System checks the complaint.
*   **Refund**: Credits are instantly returned to the agent's wallet.
*   **Reputation**: Agents with high closure rates get "Pre-approved" status.

## 6. Business Lifecycle (Retention)
*   **Time-to-Live (TTL)**: Leads disappear from the marketplace after 48 hours to ensure data "freshness."
*   **Surge Alert**: If a lead is about to expire, it might be discounted for a "Flash Sale" to clear inventory.
*   **Referral Loop**: Agents get bonuses for inviting other agents who top up their wallets.

---

## Technical Implementation Roadmap (Next Steps)
1.  **DB Schema Update**: Add `max_slots`, `claimed_slots`, `is_exclusive`, `base_price` to `leads`.
2.  **API Logic**: Refactor the "Unlock" endpoint to handle slot counting and price multipliers.
3.  **UI Overhaul**: Transform `AgentDashboard` cards to show progress bars and tiered buttons.
4.  **Admin Portal**: Add a "Refund Request" management view.

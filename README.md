# RentConnect Platform

RentConnect is a direct-to-agent rental marketplace designed to streamline the housing search process.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Language:** JavaScript

## Project Structure

- `app/`: Contains the main application logic and layout.
  - `page.js`: The main controller managing the application state and views.
  - `layout.js`: Root layout definition.
  - `globals.css`: Global styles and Tailwind directives.
- `components/`: Reusable UI components and Views.
  - `LandingPage.jsx`: Marketing entry point.
  - `TenantForm.jsx`: Form for tenants to post requests.
  - `AgentDashboard.jsx`: Interface for agents to view leads.
  - `SubscriptionPage.jsx`: Paywall interface for agents.
  - `ui/`: Basic UI primitives (Button, Badge).

## Getting Started

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Run the development server:**
    ```bash
    npm run dev
    ```

3.  Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- **Tenant Flow:** Post rental requirements (Location, Type, Budget).
- **Agent Flow:** View leads, unlock contact details via subscription (mocked).
- **Responsive Design:** Optimized for mobile and desktop.

import './globals.css'
import Script from 'next/script'
import { DM_Sans } from 'next/font/google'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-dm-sans',
})

export const metadata = {
  title: 'Yoombaa - Find Your Perfect Home',
  description: 'Yoombaa connects tenants with trusted agents. Find your perfect rental property without the hassle.',
  keywords: 'rental, apartments, housing, agents, tenants, property rental',
  openGraph: {
    title: 'Yoombaa - Find Your Perfect Home',
    description: 'Connect with trusted agents and find your perfect rental property.',
    siteName: 'Yoombaa',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body className={`${dmSans.className} font-sans`}>
        {children}
        <Script
          src="https://www.google.com/recaptcha/enterprise.js?render=6LfThBosAAAAALZ06Y7e9jaFROeO_hSgiGdzQok1"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}

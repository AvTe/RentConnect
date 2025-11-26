import './globals.css'
import { Poppins } from 'next/font/google'

const poppins = Poppins({ 
  subsets: ['latin'],
  variable: '--font-poppins',
  weight: ['300', '400', '500', '600', '700']
})

export const metadata = {
  title: 'RentConnect',
  description: 'Direct-to-agent rental marketplace',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} font-sans`}>{children}</body>
    </html>
  )
}

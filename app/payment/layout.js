// Payment pages should not be indexed by search engines
export const metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export default function PaymentLayout({ children }) {
  return children
}


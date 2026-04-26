import './globals.css'

export const metadata = {
  title: 'Demand Planning Dashboard - Love Lust',
  description: 'Shopify demand planning and inventory management',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}

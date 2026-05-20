import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "AF0DB Radio Dashboard",
  description: "Live Amateur Radio Station Profile and QRZ Logbook Stream",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  )
}

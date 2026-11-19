import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import type { ReactNode } from 'react'
import './globals.css'
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider'
import { MODE_BOOT } from '@/app/theme-boot'
import StyledJsxRegistry from '../registry'

// gluestack's Next template feeds --font-sans from next/font; Inter covers Vietnamese.
const sans = Inter({ subsets: ['latin', 'vietnamese'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Wallet',
  description: 'Wallet: bản demo ví điện tử cho thị trường Việt Nam, dữ liệu mẫu.',
  icons: { icon: [{ url: '/favicon.ico', sizes: '48x48' }, { url: '/icon.svg', type: 'image/svg+xml' }], apple: '/apple-touch-icon.png' },
  manifest: '/manifest.webmanifest',
}
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning className={sans.variable}>
      {/* Light/dark class before paint, from the viewer's stored choice (src/app/theme.ts). */}
      <head><script dangerouslySetInnerHTML={{ __html: MODE_BOOT }} /></head>
      <body className="bg-background font-body text-foreground antialiased">
        <StyledJsxRegistry>
          {/* This provider writes the theme variables during SSR; src/main.tsx adds a second one inside the router for overlays. */}
          <GluestackUIProvider mode="system">{children}</GluestackUIProvider>
        </StyledJsxRegistry>
      </body>
    </html>
  )
}

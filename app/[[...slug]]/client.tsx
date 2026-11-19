'use client'
import dynamic from 'next/dynamic'

// BrowserRouter and the store read window at start-up, so the app renders on the client only.
const ClientApp = dynamic(() => import('@/main'), { ssr: false })
export default ClientApp

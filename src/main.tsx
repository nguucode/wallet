import { StrictMode } from 'react'
import { BrowserRouter } from 'react-router'
import App from './App'
import { GluestackUIProvider } from './components/ui/gluestack-ui-provider'
import { syncReminders } from './app/store'

syncReminders()

export default function Main() {
  return (
    <StrictMode>
      <BrowserRouter>
        {/* Inside the router: gluestack overlays (Sheet, Modal, Menu, Toast) portal through this provider and their content uses router hooks. */}
        <GluestackUIProvider mode="system">
          <App />
        </GluestackUIProvider>
      </BrowserRouter>
    </StrictMode>
  )
}

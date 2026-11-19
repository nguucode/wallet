import { StrictMode } from 'react'
import { BrowserRouter } from 'react-router'
import App from './App'
import { syncReminders } from './app/store'

syncReminders()

export default function Main() {
  return (
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>
  )
}

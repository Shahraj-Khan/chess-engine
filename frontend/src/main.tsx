import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { createHttpEngineClient } from './engine/engineClient'
import './index.css'

const container = document.getElementById('root')

if (!container) {
  throw new Error('Root element #root was not found.')
}

const engineClient = createHttpEngineClient()

createRoot(container).render(
  <StrictMode>
    <App engineClient={engineClient} />
  </StrictMode>,
)
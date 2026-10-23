import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/fraunces'
import '@fontsource/averia-serif-libre/400.css'
import '@fontsource/averia-serif-libre/700.css'
import '@fontsource/im-fell-english-sc'
import '@fontsource/patrick-hand'
import '@fontsource/berkshire-swash'
import App from './App'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

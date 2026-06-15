import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'
import { initializeApiClient } from '@/lib/api-client'

// Initialize API client
initializeApiClient()
// Force the app to stay in dark mode after removing the Light Mode toggle.
document.documentElement.classList.add('dark')
localStorage.setItem('theme', 'dark')


ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)

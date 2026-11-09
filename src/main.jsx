import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AppProvider } from './store/AppStore.jsx'
import { I18nProvider } from './i18n/I18nProvider.jsx'
import './index.css'
createRoot(document.getElementById('root')).render(
  <BrowserRouter><I18nProvider><AppProvider><App /></AppProvider></I18nProvider></BrowserRouter>
)

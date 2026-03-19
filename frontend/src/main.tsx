import '@fontsource/inter/latin.css'
import 'leaflet/dist/leaflet.css'
import './styles/globals.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { initLeafletIcons } from './utils/leafletIcons'

initLeafletIcons()

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)


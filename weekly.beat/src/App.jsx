import { BrowserRouter as Router, Route, Routes } from 'react-router'
import SpotifyCallback from './auth/SpotifyCallback'
import HomePage from './HomePage'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/callback" element={<SpotifyCallback redirectTo="/" />} />
      </Routes>
    </Router>
  )
}

export default App
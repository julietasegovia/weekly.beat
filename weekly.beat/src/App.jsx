import { useState } from 'react'
import SpotifyCallback from './auth/SpotifyCallback'
import './App.css'
import HomePage from './HomePage'
import { BrowserRouter as Router, Route, Routes} from 'react-router-dom'

function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/callback" element={<SpotifyCallback redirectTo="/" />}/>
      </Routes>
    </Router>
  )
}

export default App

import { BrowserRouter as Router, Route, Routes } from 'react-router'
import HomePage from './HomePage'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </Router>
  )
}

export default App

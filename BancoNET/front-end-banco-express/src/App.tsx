import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Transfer from './components/Transfer';
import Deposit from './components/Deposit';
import Login from './components/Login'; // Move your current App login logic here
import Signup from './components/Signup'; // Assuming you have a SignUp component

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard/:accountId" element={<Dashboard />} />
        <Route path="/transfer/:accountId" element={<Transfer />} />
        <Route path="/deposit/:accountId" element={<Deposit />} /> {/* Reusing Transfer component for Deposit */}
        <Route path="/signup" element={<Signup />} /> {/* Assuming you have a SignUp component */}
        {/* Redirect any unknown routes to the login page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Router>
      <Layout>
      <Routes>
        <Route path="/" element={<Dashboard/>} />
        <Route path="/login" element={<Login />} />
      </Routes>
      </Layout>
    </Router>
  );
}

export default App;

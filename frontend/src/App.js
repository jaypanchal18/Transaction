import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Switch} from 'react-router-dom';
import Signup from './Signup';
import Login from './Login';
import Protected from './Protected';
import VerifyEmail from './VerifyEmail';
import ForgotPassword from './ForgotPassword';
import Profile from './Profile';

import Transaction from './Transaction';
import DashboardOverview from './DashboardOverview';


import OAuthCallback from './OAuth2Callback';





function App() {
  const token = localStorage.getItem('token');
  return (
    <Router>
      <div className="App">
        <Routes>
        <Route path="/oauth2callback" element={<OAuthCallback />} />
          <Route path="/" element={<Navigate to="/signup" />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/protected" element={<Protected />} />
          <Route path="/verify/:token" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/transaction" element={<Transaction />} />
          <Route path="/Dashboard" element={<DashboardOverview />} />



          

         
          
          
         

        </Routes>
      </div>
    </Router>
  );
}

export default App;

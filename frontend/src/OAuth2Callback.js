import React, { useEffect } from 'react';
import axios from 'axios';

const OAuthCallback = () => {
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const code = queryParams.get('code');
    
    if (code) {
      handleLogin(code);
    } else {
      console.error('Authorization code is missing');
    }
  }, []);

  const handleLogin = async (code) => {
    try {
      const response = await axios.post('http://localhost:5000/google-callback', { code });
      localStorage.setItem('accessToken', response.data.access_token);
      window.location.href = '/protected';
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return <div>Loading...</div>; // You can add a loading spinner or message
};

export default OAuthCallback;

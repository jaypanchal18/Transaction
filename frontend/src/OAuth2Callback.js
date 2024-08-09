import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const OAuth2Callback = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const code = query.get('code');

    if (code) {
      axios.post('http://localhost:5000/google-login', null, {
        params: {
          code:'4%2F0AcvDMrA0qVfbhRBKMSIYGsxNl4852l45MdzsK_x2o_V7aTKt4Pj-dRPa65IuI9EBMIotdw',
          client_id: '799143067220-vui9bt316m1r4pltog67gohcqi1krsk8.apps.googleusercontent.com',
          client_secret: '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',
          redirect_uri: 'http://localhost:3000/protected',
          grant_type: 'authorization_code',
        },
      })
      .then(response => {
        const { access_token } = response.data;
        localStorage.setItem('accessToken', access_token);
        navigate('/protected'); // Redirect to your dashboard or protected route
      })
      .catch(error => {
        console.error('Error exchanging authorization code for tokens:', error);
      });
    }
  }, [location.search, navigate]);

  return <div>Loading...</div>;
};

export default OAuth2Callback;

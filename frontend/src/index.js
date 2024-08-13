import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import reportWebVitals from './reportWebVitals';




const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
   
   <GoogleOAuthProvider clientId="799143067220-vui9bt316m1r4pltog67gohcqi1krsk8.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>,
  </React.StrictMode>

   
);



reportWebVitals();

import React, { useState } from 'react';
import { TextField, Button, Typography, Box, Grid } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Auth.css'; // Importing CSS for styling
import GoogleIcon from '@mui/icons-material/Google';
import FacebookIcon from '@mui/icons-material/Facebook';
import loginimage from './images/login.jpg'
import { GoogleLogin } from 'react-google-login';

import './Auth.css';


function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleLogin = async () => {
    setErrors({});
    setMessage('');

    let validationErrors = {};
    if (!username) validationErrors.username = "Username is required";
    if (!password) validationErrors.password = "Password is required";

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {

      const response = await axios.post('http://localhost:5000/login', { username, password });
      
      // Ensure token is correctly stored
      localStorage.setItem('accessToken', response.data.access_token);

     

      setMessage('Login successful');
      navigate('/protected');
    } catch (error) {
      if (error.response) {
        setMessage(error.response.data.msg || 'An error occurred');
      } else {
        setMessage('An error occurred. Please try again.');
      }
    }
  };


  const handleGoogleResponse = async (response) => {
    if (response.error) {
      console.error('Google Login failed:', response.error);
      setMessage('Google login failed');
      return;
    }

    const { tokenId } = response;
    
    try {
      // Exchange tokenId with your backend or use it as needed
      const googleResponse = await axios.post('http://localhost:5000/google-login', { tokenId });

      // Store token and other user data
      localStorage.setItem('accessToken', googleResponse.data.access_token);
      setMessage('Google login successful');
      navigate('/protected');
    } catch (error) {
      console.error('Error handling Google login:', error);
      setMessage('An error occurred with Google login');
    }
  };

  return (

    
    <div className="login-page">
      <Grid container justifyContent="center" alignItems="center" className="login-container">
        <Grid item xs={12} md={6} className="login-form">
          <Box className="login-box" sx={{ p: 3 }}>
            <Typography variant="h4" component="h1" className="login-title">
              Login
            </Typography>
            <br/>
            <Typography variant="body2" className="login-subtitle">
              Don't have an account yet? <a href="/signup">Sign Up</a>
            </Typography>
            <br/>
            <TextField
              label="User Name"
              variant="outlined"
              fullWidth
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={!!errors.username}
              helperText={errors.username}
            />
            <TextField
              label="Password"
              type="password"
              variant="outlined"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!errors.password}
              helperText={errors.password}
            />
            <Typography variant="body2" align="right" className="forgot-password">
              <a href="/forgot-password">Forgot Password?</a>
            </Typography>
            <br/>
            <Button
              variant="contained"
              className="login-button"
              fullWidth
              onClick={handleLogin}
            >
              Login
            </Button>
            <Typography variant="body2" color="textSecondary" align="center" className="login-message">
              {message}
            </Typography>
            <br/>
            <Typography variant="body2" align="center" className="login-footer">
              or login with
            </Typography>
            <div className="login-icons">
            <GoogleLogin
                clientId="188656099171-j2toqn6u865c05epp4aggd8fgvm1k0oe.apps.googleusercontent.com"
                buttonText="Login with Google"
                onSuccess={handleGoogleResponse}
                onFailure={handleGoogleResponse}
                cookiePolicy={'single_host_origin'}
                render={renderProps => (
                  <Button
                    variant="outlined"
                    startIcon={<GoogleIcon />}
                    className="login-icon"
                    style={{ marginRight: '10px' }}
                    onClick={renderProps.onClick}
                    disabled={renderProps.disabled}
                  >
                    Google
                  </Button> )}
              />





              <Button variant="outlined" startIcon={<FacebookIcon />} className="login-icon">
                Facebook
              </Button>
            </div>
          </Box>
        </Grid>
        <Grid item xs={12} md={6} className="login-image">
          <img src={loginimage} alt="Login illustration" />
        </Grid>
      </Grid>

    
    </div>
 
  );
}

export default Login;

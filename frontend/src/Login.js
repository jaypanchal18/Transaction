import React, { useState, useEffect } from 'react';
import { TextField, Button, Typography, Box, Grid } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Auth.css'; // Importing CSS for styling
import GoogleIcon from '@mui/icons-material/Google';
import FacebookIcon from '@mui/icons-material/Facebook';
import loginimage from './images/login.jpg';

const clientId = '799143067220-vui9bt316m1r4pltog67gohcqi1krsk8.apps.googleusercontent.com';
const redirectUri = 'http://localhost:3000/protected'; // Your redirect URI
const scope = 'email profile openid';

const generateAuthUrl = () => {
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
};

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    // Load Google API script
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/platform.js';
    script.onload = () => console.log('Google API script loaded.');
    script.onerror = (error) => console.error('Failed to load Google API script:', error);
    document.head.appendChild(script);
  }, []);

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

  const handleGoogleSignIn = () => {
    window.location.href = generateAuthUrl();
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
              label="Email Address"
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
              <Button
                variant="outlined"
                startIcon={<GoogleIcon />}
                className="login-icon"
                style={{ marginRight: '10px' }}
                onClick={handleGoogleSignIn}
              >
                Google
              </Button>
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

import React, { useState, useEffect } from 'react';
import { TextField, Button, Typography, Box, Grid } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Auth.css'; // Importing CSS for styling
import GoogleIcon from '@mui/icons-material/Google';
import FacebookIcon from '@mui/icons-material/Facebook';
import loginimage from './images/login.jpg';

const googleAuthUrl = `http://localhost:5001/google-login`;

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

  const handleGoogleSignIn = async () => {
    try {
      const response = await axios.get(googleAuthUrl);
      window.location.href = response.data.auth_url; // Redirect user to Google for login
    } catch (error) {
      console.error('Error during Google sign-in:', error);
    }
  };
  

  useEffect(() => {
    const handleAuthCode = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      if (code) {
        try {
          const response = await axios.post('http://localhost:5001/google-callback', { code });
          const { access_token, redirect_url } = response.data;
          localStorage.setItem('accessToken', access_token);
          window.location.href = redirect_url; // Redirect user to the dashboard or protected area
        } catch (error) {
          console.error('Error during Google login:', error);
        }
      }
    };
  
    handleAuthCode();
  }, []);

  

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

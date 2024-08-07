import React, { useState } from 'react';
import { TextField, Button, Typography, Box, Grid } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Auth.css'; // Importing CSS for styling
import singup from './images//signup.jpg'
import GoogleIcon from '@mui/icons-material/Google';
import FacebookIcon from '@mui/icons-material/Facebook';

function Signup() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // Email and mobile validation functions
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validateMobile = (mobile) => /^[0-9]{10}$/.test(mobile);
  const validatePassword = (password) => password.length >= 8;

  const handleSignup = async (e) => {
    e.preventDefault();  // Prevent page reload on form submission
  
    // Clear previous errors and message
    setErrors({});
    setMessage('');
  
    // Validate inputs
    let validationErrors = {};
    if (!username) validationErrors.username = "Username is required";
    if (!password) {
      validationErrors.password = "Password is required";
    } else if (!validatePassword(password)) {
      validationErrors.password = "Password must be at least 8 characters long";
    }
    if (password !== confirmPassword) validationErrors.confirmPassword = "Passwords do not match";
    if (!email) {
      validationErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      validationErrors.email = "Invalid email format";
    }
    if (!mobile) {
      validationErrors.mobile = "Mobile number is required";
    } else if (!validateMobile(mobile)) {
      validationErrors.mobile = "Invalid mobile number format";
    }
  
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
  
    try {
      // Post signup data to Flask API
      await axios.post('http://localhost:5000/signup', { username, password, email, mobile });
      setMessage('Please check your email to verify your account.');
      // Optionally navigate to login page after a delay
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      if (error.response) {
        // Server error response
        setMessage(error.response.data.msg || 'An error occurred');
        setErrors({ form: error.response.data.msg });
      } else if (error.request) {
        // Network error
        setMessage('No response from the server. Please try again.');
      } else {
        // Other errors
        setMessage('An error occurred. Please try again.');
      }
    }
  };
  

  return (
    <div className="login-page">
      <Grid container justifyContent="center" alignItems="center" className="login-container">
        <Grid item xs={12} md={6} className="login-form">
          <Box className="login-box" sx={{ p: 3 }}>
            <Typography variant="h4" component="h1" className="login-title">
              Signup
            </Typography>
            <form onSubmit={handleSignup}>
              <TextField
                label="Username"
                variant="outlined"
                fullWidth
                margin="normal"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                error={!!errors.username}
                helperText={errors.username}
              />
              <TextField
                label="Email Address"
                type="email"
                variant="outlined"
                fullWidth
                margin="normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={!!errors.email}
                helperText={errors.email}
              />
              <TextField
                label="Mobile Number"
                type="text"
                variant="outlined"
                fullWidth
                margin="normal"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                error={!!errors.mobile}
                helperText={errors.mobile}
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
              <TextField
                label="Confirm Password"
                type="password"
                variant="outlined"
                fullWidth
                margin="normal"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
              />
              <br/>
              <br/>
              <Button
                variant="contained"
                className="login-button"
                fullWidth
                type="submit"
              >
                Signup
              </Button>
              <br/>
              
              <Typography variant="body2" color="textSecondary" align="center" className="login-message">
                {message}
              </Typography>
              <br/>
              <Typography variant="body2" align="center" className="login-footer">
                Already have an account? <a href="/login">Login here</a>
              </Typography>
            </form>
            <Typography variant="body2" align="center" className="login-footer">
              or sign up with
            </Typography>
            <div className="login-icons">
              <Button variant="outlined" startIcon={<GoogleIcon />} className="login-icon" style={{marginRight:'10px'}}>
                Google
              </Button>
             
              <Button variant="outlined" startIcon={<FacebookIcon />} className="login-icon">
                Facebook
              </Button>
            </div>
          </Box>
        </Grid>
        <Grid item xs={12} md={6} className="login-image">
          <img src={singup} alt="Signup illustration" />
        </Grid>
      </Grid>
    </div>
  );
}

export default Signup;

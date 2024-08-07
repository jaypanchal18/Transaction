import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Container, Typography, Card, CardContent } from '@mui/material';
import axios from 'axios';
import Navbar from './UserDashboard';
import './Auth.css';

function Profile() {
  const navigate = useNavigate();
  const [currentDetails, setCurrentDetails] = useState({});
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) throw new Error('No token found');

        const response = await axios.get('http://localhost:5000/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log('Profile response:', response.data);
        const { username, email, mobile } = response.data;
        setCurrentDetails({ username, email, mobile });
        setUsername(username);
        setEmail(email);
        setMobile(mobile);
      } catch (error) {
        console.error('Error fetching profile:', error);
        if (error.response) {
          console.error('Error response:', error.response.data);
          console.error('Error status:', error.response.status);
        }
        if (error.request) {
          console.error('Error request:', error.request);
        }
        if (error.message) {
          console.error('Error message:', error.message);
        }
        if (error.response && error.response.status === 401) {
          navigate('/login');
        }
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('No token found');

      const response = await axios.put(
        'http://localhost:5000/profile',
        { username, email, mobile },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log('Profile update response:', response.data);
      alert('Profile updated successfully!');
      navigate('/protected');
    } catch (error) {
      console.error('Error updating profile:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      alert('Failed to update profile.');
    }
  };

  return (
    <div className="profile-container">
      <Navbar /> 
      <Container maxWidth="sm">
        <br/>
        <br/>
        <Typography className="profile-title" variant="h4" component="h1" gutterBottom>
          Your Profile
        </Typography>
        <Card className="profile-card" variant="outlined">
          <CardContent>
            <Typography variant="h6">Current Details</Typography>
            <div className="profile-card-content">
              <Typography className="profile-details"><strong>Username:</strong> {currentDetails.username}</Typography>
              <Typography className="profile-details"><strong>Email:</strong> {currentDetails.email}</Typography>
              <Typography className="profile-details"><strong>Mobile:</strong> {currentDetails.mobile}</Typography>
            </div>
          </CardContent>
        </Card>
        <Card className="profile-card" variant="outlined">
          <CardContent>
            <Typography variant="h6">Update Details</Typography>
            <form className="profile-form" onSubmit={handleSubmit}>
              <TextField
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                fullWidth
                margin="normal"
              />
              <Button type="submit" className="profile-button" variant="contained" color="primary" fullWidth>
                Update Profile
              </Button>
            </form>
          </CardContent>
        </Card>
      </Container>
    </div>
  );
}

export default Profile;

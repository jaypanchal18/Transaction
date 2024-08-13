import React from 'react';
import { AppBar, Toolbar, Container, Typography, Button, IconButton, Menu, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';

function Navbar() {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar position="static" style={{ backgroundColor: '#4a00e0' }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters style={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" style={{ color: 'white', fontSize: '2rem' }}>
            CRUD OPERATION
          </Typography>
          <div>
            <div className="desktop-nav">
              <Button color="inherit" onClick={() => navigate('/transaction')}>
                Dashboard
              </Button>
              <Button color="inherit" onClick={() => navigate('/profile')}>
                Profile
              </Button>
              <Button color="inherit" onClick={() => navigate('/login')}>
                Logout
              </Button>
            </div>
            <div className="mobile-nav">
              <IconButton edge="end" color="inherit" aria-label="menu" onClick={handleMenuClick}>
                <MenuIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem onClick={() => { handleMenuClose(); navigate('/transaction'); }}>Dashboard</MenuItem>
                <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>Profile</MenuItem>
                <MenuItem onClick={() => { handleMenuClose(); navigate('/login'); }}>Logout</MenuItem>
              </Menu>
            </div>
          </div>
        </Toolbar>
      </Container>
      <style jsx>{`
        .desktop-nav {
          display: none;
        }
        .mobile-nav {
          display: block;
        }
        @media (min-width: 600px) {
          .desktop-nav {
            display: flex;
          }
          .mobile-nav {
            display: none;
          }
        }
      `}</style>
    </AppBar>
  );
}

export default Navbar;

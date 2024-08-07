import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Dashboard from "./UserDashboard"; // Ensure correct path for Dashboard import
import { useNavigate } from "react-router-dom";
import {
  TextField,
  Button,
  Container,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Box,
  Card,
  CardContent,
  Avatar,
} from "@mui/material";
import { Delete as DeleteIcon, Edit as EditIcon } from "@mui/icons-material";
import VerifiedLogo from "./images/verification.jpg";
import "./Auth.css"; // Importing the CSS file with background image styles

 // Update with your live API URL

function Protected() {
  const [message, setMessage] = useState("");
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({
    name: "",
    mobile: "",
    address: "",
    description: "",
    email: "",
  });
  const [editItem, setEditItem] = useState(null);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const apiUrl = `http://localhost:5000/api/items`; // Use the API_URL constant

  const fetchItems = useCallback(async () => {
    try {
      const response = await axios.get(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(response.data.items);
    } catch (error) {
      setMessage("Error fetching items");
    }
  }, [apiUrl, token]);

  const validateForm = (item) => {
    const errors = {};
    const phoneRegex = /^[0-9]{10}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!item.name) errors.name = "Name is required";
    if (!phoneRegex.test(item.mobile)) errors.mobile = "Invalid mobile number";
    if (!emailRegex.test(item.email)) errors.email = "Invalid email address";
    if (!item.address) errors.address = "Address is required";
    if (!item.description) errors.description = "Description is required";

    return errors;
  };

  const handleCreateItem = async () => {
    const validationErrors = validateForm(newItem);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    try {
      await axios.post(apiUrl, newItem, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("Item created successfully");
      setNewItem({
        name: "",
        mobile: "",
        address: "",
        description: "",
        email: "",
      });
      setErrors({});
      fetchItems();
    } catch (error) {
      setMessage("Error creating item");
    }
  };

  const handleUpdateItem = async (id) => {
    const validationErrors = validateForm(editItem);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    try {
      await axios.put(`${apiUrl}/${id}`, editItem, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("Item updated successfully");
      setEditItem(null);
      setErrors({});
      fetchItems();
    } catch (error) {
      setMessage("Error updating item");
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      await axios.delete(`${apiUrl}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("Item deleted successfully");
      fetchItems();
    } catch (error) {
      setMessage("Error deleting item");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return (
    <div className="protected-dashboard">
      <Dashboard onLogout={handleLogout} />
      <div className="dashboard-content">
        <Container>
          <Card className="card">
            <CardContent>
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                marginBottom={4}
              >
                <Avatar src={VerifiedLogo} alt="Verified" className="avatar" />
                <Typography variant="h6" className="verified-text">
                  Your Account is Verified
                </Typography>
              </Box>
              <Typography variant="h4" gutterBottom className="title">
                Dashboard for CRUD Operations
              </Typography>
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                marginBottom={2}
              >
                <TextField
                  variant="outlined"
                  label="Name"
                  value={newItem.name}
                  onChange={(e) =>
                    setNewItem({ ...newItem, name: e.target.value })
                  }
                  fullWidth
                  error={!!errors.name}
                  helperText={errors.name}
                  className="textfield"
                />
                <br />
                <TextField
                  variant="outlined"
                  label="Mobile Number"
                  value={newItem.mobile}
                  onChange={(e) =>
                    setNewItem({ ...newItem, mobile: e.target.value })
                  }
                  fullWidth
                  error={!!errors.mobile}
                  helperText={errors.mobile}
                  className="textfield"
                />
                <br />
                <TextField
                  variant="outlined"
                  label="Address"
                  value={newItem.address}
                  onChange={(e) =>
                    setNewItem({ ...newItem, address: e.target.value })
                  }
                  fullWidth
                  error={!!errors.address}
                  helperText={errors.address}
                  className="textfield"
                />
                <br />
                <TextField
                  variant="outlined"
                  label="Email Address"
                  value={newItem.email}
                  onChange={(e) =>
                    setNewItem({ ...newItem, email: e.target.value })
                  }
                  fullWidth
                  error={!!errors.email}
                  helperText={errors.email}
                  className="textfield"
                />
                <br />
                <TextField
                  variant="outlined"
                  label="Description"
                  value={newItem.description}
                  onChange={(e) =>
                    setNewItem({ ...newItem, description: e.target.value })
                  }
                  fullWidth
                  error={!!errors.description}
                  helperText={errors.description}
                  className="textfield"
                />
                <br />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleCreateItem}
                  className="button"
                >
                  Create Item
                </Button>
              </Box>
              <List>
                {items.length > 0 &&
                  items.map((item) => (
                    <ListItem key={item.id} divider className="list-item">
                      <ListItemText
                        primary={`${item.name} (${item.mobile})`}
                        secondary={`${item.address} - ${item.description} - ${item.email}`}
                        primaryTypographyProps={{ style: { color: "white" } }}
                        secondaryTypographyProps={{ style: { color: "white" } }}
                      />
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        onClick={() => setEditItem(item)}
                      >
                        <EditIcon style={{ color: "white" }} />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <DeleteIcon style={{ color: "white" }} />
                      </IconButton>
                      {editItem !== null && editItem.id === item.id && (
                        <Box
                          display="flex"
                          flexDirection="column"
                          alignItems="center"
                          marginTop={2}
                          className="edit-form"
                        >
                          <TextField
                            variant="outlined"
                            label="Edit Name"
                            value={editItem.name}
                            onChange={(e) =>
                              setEditItem({ ...editItem, name: e.target.value })
                            }
                            fullWidth
                            className="textfield"
                          />
                          <br />
                          <TextField
                            variant="outlined"
                            label="Edit Mobile Number"
                            value={editItem.mobile}
                            onChange={(e) =>
                              setEditItem({
                                ...editItem,
                                mobile: e.target.value,
                              })
                            }
                            fullWidth
                            className="textfield"
                          />
                          <br />
                          <TextField
                            variant="outlined"
                            label="Edit Address"
                            value={editItem.address}
                            onChange={(e) =>
                              setEditItem({
                                ...editItem,
                                address: e.target.value,
                              })
                            }
                            fullWidth
                            className="textfield"
                          />
                          <br />
                          <TextField
                            variant="outlined"
                            label="Edit Email Address"
                            value={editItem.email}
                            onChange={(e) =>
                              setEditItem({
                                ...editItem,
                                email: e.target.value,
                              })
                            }
                            fullWidth
                            className="textfield"
                          />
                          <br />
                          <TextField
                            variant="outlined"
                            label="Edit Description"
                            value={editItem.description}
                            onChange={(e) =>
                              setEditItem({
                                ...editItem,
                                description: e.target.value,
                              })
                            }
                            fullWidth
                            className="textfield"
                          />
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => handleUpdateItem(item.id)}
                            className="button"
                          >
                            Update Item
                          </Button>
                        </Box>
                      )}
                    </ListItem>
                  ))}
              </List>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleLogout}
                className="button"
              >
                Logout
              </Button>
              <Typography color="error" className="message">
                {message}
              </Typography>
            </CardContent>
          </Card>
        </Container>
      </div>
    </div>
  );
}

export default Protected;

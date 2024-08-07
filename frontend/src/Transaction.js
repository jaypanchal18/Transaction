import React, { useState, useEffect } from 'react';
import Navbar from './UserDashboard'; 
import Report from './DashboardOverview'

import {
  TextField,
  Button,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Container,
  Snackbar,
  Alert,
  IconButton,
} from '@mui/material';
import axios from 'axios';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom';
import './Auth.css'; // Importing CSS for styling

 



function Transaction() {
  // State for the transaction form
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [receipt, setReceipt] = useState('');
  const [note, setNote] = useState('');
  const [editingTransactionId, setEditingTransactionId] = useState(null);
  const [transactionErrors, setTransactionErrors] = useState({});

  // State for the budget form
  const [budgetCategory, setBudgetCategory] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetFrequency, setBudgetFrequency] = useState('monthly');
  const [editingBudgetId, setEditingBudgetId] = useState(null);
  const [budgetErrors, setBudgetErrors] = useState({});

  // State for the transaction list and budget overview
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ message: '', severity: '' });

  const navigate = useNavigate();

  // Fetch transactions and budgets when the component mounts
  useEffect(() => {
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
  
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('No token found');
      setLoading(false);
      return;
    }
  
    try {
      const [transactionsResponse, budgetsResponse, budgetTrackingResponse] = await Promise.all([
        axios.get('http://localhost:5000/transactions', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get('http://localhost:5000/budgets', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get('http://localhost:5000/budgets/track', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
  
      setTransactions(transactionsResponse.data);
      setBudgets(budgetsResponse.data);
  
      // Check the budget limits against the transactions
      checkBudgetLimit(budgetTrackingResponse.data);
  
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error fetching data');
    } finally {
      setLoading(false);
    }
  };
  

  const calculateSpending = (category) => {
    const totalSpent = transactions
      .filter((txn) => txn.category === category)
      .reduce((acc, txn) => acc + txn.amount, 0);

    const budget = budgets.find((budg) => budg.category === category);
    return { totalSpent, budget: budget ? budget.amount : 0 };
  };

  const checkBudgetLimit = (budgetTrackingData) => {
    // Check each budget tracking entry
    budgetTrackingData.forEach((budgetTracking) => {
      if (budgetTracking.message) {
        // Set notification if there is a message in the budget tracking data
        setNotification({
          message: budgetTracking.message,
          severity: 'warning',
        });
      }
    });
  };
  

  // Handle transaction submission
  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    setTransactionErrors({});
    setNotification({ message: '', severity: '' });

    let validationErrors = {};
    if (!amount) validationErrors.amount = 'Amount is required';
    if (!category) validationErrors.category = 'Category is required';
    if (!date) validationErrors.date = 'Date is required';

    if (Object.keys(validationErrors).length > 0) {
      setTransactionErrors(validationErrors);
      return;
    }

    const data = { type, amount, category, date, receipt, note };
    const token = localStorage.getItem('accessToken');

    try {
      if (editingTransactionId) {
        await axios.put(`http://localhost:5000/transaction/${editingTransactionId}`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotification({ message: 'Transaction updated successfully', severity: 'success' });
        setEditingTransactionId(null);
      } else {
        await axios.post('http://localhost:5000/transaction', data, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotification({ message: 'Transaction added successfully', severity: 'success' });
      }

      // Clear the form fields
      setType('expense');
      setAmount('');
      setCategory('');
      setDate('');
      setReceipt('');
      setNote('');
      // Refetch data to include the new transaction
      fetchData();
    } catch (error) {
      console.error('Error submitting transaction:', error);
      setNotification({ message: 'Error submitting transaction', severity: 'error' });
    }
  };

  // Handle budget submission
  const handleBudgetSubmit = async (e) => {
    e.preventDefault();
    setBudgetErrors({});
    setNotification({ message: '', severity: '' });

    let validationErrors = {};
    if (!budgetAmount) validationErrors.budgetAmount = 'Budget amount is required';
    if (!budgetCategory) validationErrors.budgetCategory = 'Category is required';

    if (Object.keys(validationErrors).length > 0) {
      setBudgetErrors(validationErrors);
      return;
    }

    const data = { category: budgetCategory, amount: budgetAmount, frequency: budgetFrequency };
    const token = localStorage.getItem('accessToken');

    try {
      if (editingBudgetId) {
        await axios.put(`http://localhost:5000/budget/${editingBudgetId}`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotification({ message: 'Budget updated successfully', severity: 'success' });
        setEditingBudgetId(null);
      } else {
        await axios.post('http://localhost:5000/budget', data, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotification({ message: 'Budget added successfully', severity: 'success' });
      }

      // Clear the form fields
      setBudgetCategory('');
      setBudgetAmount('');
      setBudgetFrequency('monthly');
      // Refetch data to include the new budget
      fetchData();
    } catch (error) {
      console.error('Error submitting budget:', error);
      setNotification({ message: 'Error submitting budget', severity: 'error' });
    }
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransactionId(transaction.id);
    setType(transaction.type);
    setAmount(transaction.amount);
    setCategory(transaction.category);
    setDate(transaction.date);
    setReceipt(transaction.receipt);
    setNote(transaction.note);
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (!transactionId) {
      setNotification({ message: 'Transaction ID is missing', severity: 'error' });
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setNotification({ message: 'No token found', severity: 'error' });
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/transaction/${transactionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotification({ message: 'Transaction deleted successfully', severity: 'success' });
      fetchData();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      setNotification({ message: 'Error deleting transaction', severity: 'error' });
    }
  };

  const handleEditBudget = (budget) => {
    setEditingBudgetId(budget.id);
    setBudgetCategory(budget.category);
    setBudgetAmount(budget.amount);
    setBudgetFrequency(budget.frequency);
  };

  const handleDeleteBudget = async (budgetId) => {
    if (!budgetId) {
      setNotification({ message: 'Budget ID is missing', severity: 'error' });
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setNotification({ message: 'No token found', severity: 'error' });
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/budget/${budgetId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotification({ message: 'Budget deleted successfully', severity: 'success' });
      fetchData();
    } catch (error) {
      console.error('Error deleting budget:', error);
      setNotification({ message: 'Error deleting budget', severity: 'error' });
    }
  };

  const handleCloseNotification = () => {
    setNotification({ message: '', severity: '' });
  };

  return (
    <Container maxWidth="md">
      <Navbar />
      <br />
      <br />
      <Typography variant="h4" align="center" gutterBottom>
        Transaction & Budget Manager
      </Typography>

      <Box className="form-container">
        <Typography variant="h6" gutterBottom>
          {editingTransactionId ? 'Edit Transaction' : 'Add Transaction'}
        </Typography>
        <form noValidate autoComplete="off" onSubmit={handleTransactionSubmit}>
          <TextField
            label="Type"
            variant="outlined"
            fullWidth
            margin="normal"
            value={type}
            onChange={(e) => setType(e.target.value)}
            select
            SelectProps={{ native: true }}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </TextField>
          <TextField
            label="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            fullWidth
            error={!!transactionErrors.amount}
            helperText={transactionErrors.amount}
          />
          <TextField
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            fullWidth
            error={!!transactionErrors.category}
            helperText={transactionErrors.category}
          />
          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            fullWidth
            InputLabelProps={{
              shrink: true,
            }}
            error={!!transactionErrors.date}
            helperText={transactionErrors.date}
          />
          <TextField
            label="Receipt"
            value={receipt}
            onChange={(e) => setReceipt(e.target.value)}
            fullWidth
          />
          <TextField
            label="Note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            fullWidth
          />
          <Button type="submit" variant="contained" color="primary" fullWidth>
            {editingTransactionId ? 'Update Transaction' : 'Add Transaction'}
          </Button>
        </form>
      </Box>

      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          {editingBudgetId ? 'Edit Budget' : 'Add Budget'}
        </Typography>
        <form noValidate autoComplete="off" onSubmit={handleBudgetSubmit}>
          <TextField
            label="Category"
            value={budgetCategory}
            onChange={(e) => setBudgetCategory(e.target.value)}
            fullWidth
            error={!!budgetErrors.budgetCategory}
            helperText={budgetErrors.budgetCategory}
          />
          <TextField
            label="Amount"
            type="number"
            value={budgetAmount}
            onChange={(e) => setBudgetAmount(e.target.value)}
            fullWidth
            error={!!budgetErrors.budgetAmount}
            helperText={budgetErrors.budgetAmount}
          />
          <TextField
            label="Frequency"
            variant="outlined"
            fullWidth
            margin="normal"
            value={budgetFrequency}
            onChange={(e) => setBudgetFrequency(e.target.value)}
            select
            SelectProps={{ native: true }}
          >
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </TextField>
          <Button type="submit" variant="contained" color="primary" fullWidth>
            {editingBudgetId ? 'Update Budget' : 'Add Budget'}
          </Button>
        </form>
      </Box>

      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          Transactions
        </Typography>
        {loading ? (
          <CircularProgress />
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Receipt</TableCell>
                  <TableCell>Note</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{transaction.type}</TableCell>
                    <TableCell>{transaction.amount}</TableCell>
                    <TableCell>{transaction.category}</TableCell>
                    <TableCell>{transaction.date}</TableCell>
                    <TableCell>{transaction.receipt}</TableCell>
                    <TableCell>{transaction.note}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEditTransaction(transaction)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteTransaction(transaction.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          Budgets
        </Typography>
        {loading ? (
          <CircularProgress />
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Category</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Frequency</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {budgets.map((budget) => (
                  <TableRow key={budget.id}>
                    <TableCell>{budget.category}</TableCell>
                    <TableCell>{budget.amount}</TableCell>
                    <TableCell>{budget.frequency}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEditBudget(budget)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteBudget(budget.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
<div>
  <Report/>
</div>

      <Snackbar open={!!notification.message} autoHideDuration={6000} onClose={handleCloseNotification}>
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Transaction;

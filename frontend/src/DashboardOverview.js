import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Typography,
  Container,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Tooltip,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const DashboardOverview = () => {
  const [data, setData] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportError, setReportError] = useState(null);
  const [reportPeriod, setReportPeriod] = useState('weekly');

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/dashboard', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      setData(response.data);
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async (period) => {
    setReportLoading(true);
    setReportError(null);
    try {
      const response = await axios.get(`http://localhost:5000/report/${period}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      setReportData(response.data);
    } catch (err) {
      setReportError('Failed to fetch report data');
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 60000); // Poll every 60 seconds for real-time updates

    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, []);

  const handleReportPeriodChange = (event) => {
    setReportPeriod(event.target.value);
  };

  const handleGenerateReport = () => {
    fetchReport(reportPeriod);
  };

  const generatePDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text(`Report for ${reportPeriod.charAt(0).toUpperCase() + reportPeriod.slice(1)}`, 14, 20);

    doc.setFontSize(16);
    doc.text(`Total Income: ₹${reportData.total_income.toFixed(2)}`, 14, 30);
    doc.text(`Total Expense: ₹${reportData.total_expenses.toFixed(2)}`, 14, 40);

    

    doc.save(`report_${reportPeriod}.pdf`);
  };

  if (loading) return <CircularProgress />;
  if (error) {
    console.error('Error fetching data:', error); // Log error to console
    return <Typography color="error">Failed to load data. Please try again later.</Typography>;
  }

  if (!data || typeof data.total_income !== 'number' || typeof data.total_expense !== 'number' || !Array.isArray(data.budgets)) {
    return <Typography color="error">Data format is incorrect.</Typography>;
  }

  // Prepare data for charts
  const incomeData = data.income_data || [];
  const expenseData = data.expense_data || [];

  const budgetData = data.budgets.map((budget) => ({
    name: budget.category,
    value: budget.amount,
  }));

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Dashboard Overview
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5">Total Income</Typography>
              <Typography variant="h6">₹{data.total_income.toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5">Total Expense</Typography>
              <Typography variant="h6">₹{data.total_expense.toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5">Budgets</Typography>
              {data.budgets.length > 0 ? (
                data.budgets.map((budget) => (
                  <Typography key={budget.id}>
                    {budget.category}: ₹{budget.amount.toFixed(2)} ({budget.frequency})
                  </Typography>
                ))
              ) : (
                <Typography>No budgets set</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>Income Over Time</Typography>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={incomeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="amount" stroke="#8884d8" name="Income" />
            </LineChart>
          </ResponsiveContainer>
          <Typography variant="h6" gutterBottom>Expenses Over Time</Typography>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={expenseData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="amount" stroke="#82ca9d" name="Expense" />
            </LineChart>
          </ResponsiveContainer>
          <Typography variant="h6" gutterBottom>Budget Distribution</Typography>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={budgetData}
                dataKey="value"
                nameKey="name"
                outerRadius={150}
                fill="#8884d8"
                label
              />
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>Generate Report</Typography>
          <FormControl variant="outlined" fullWidth>
            <InputLabel>Period</InputLabel>
            <Select
              value={reportPeriod}
              onChange={handleReportPeriodChange}
              label="Period"
            >
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            color="primary"
            onClick={handleGenerateReport}
            disabled={reportLoading}
            style={{ marginTop: '16px' }}
          >
            Generate Report
          </Button>
          {reportLoading && <CircularProgress />}
          {reportError && <Typography color="error">{reportError}</Typography>}
          {reportData && (
            <Card style={{ marginTop: '16px' }}>
              <CardContent>
                <Typography variant="h6">Total Income: ₹{reportData.total_income.toFixed(2)}</Typography>
                <Typography variant="h6">Total Expense: ₹{reportData.total_expenses.toFixed(2)}</Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
        <Grid item xs={12}>
          <Button variant="contained" color="primary" onClick={generatePDF}>
            Download Report
          </Button>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardOverview;
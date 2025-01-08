import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Card,
  CardContent
} from '@mui/material';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography component="h1" variant="h4" color="primary" gutterBottom>
              Welcome, {user.username}!
            </Typography>
            <Typography variant="body1" paragraph>
              This is your dashboard where you can manage your account and see your activities.
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Profile Overview
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1">
                  Email: {user.email}
                </Typography>
                <Typography variant="body1">
                  Role: {user.role}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No recent activity to display.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
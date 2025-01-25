import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import axios from 'axios';

const Dashboard = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/users/activities', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setActivities(response.data);
      } catch (error) {
        console.error('Error fetching activities:', error);
        setError('Failed to load recent activities');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

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
                <Typography variant="body1" sx={{ mt: 2 }}>
                  {user.role === 'admin' ? 
                    "You have admin privileges and can see all system activities." :
                    "You can see activities related to your account."}
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
              {error && (
                <Typography color="error" paragraph>
                  {error}
                </Typography>
              )}
              {loading ? (
                <Typography>Loading activities...</Typography>
              ) : (
                <List>
                  {activities.length > 0 ? (
                    activities.map((activity, index) => (
                      <React.Fragment key={activity.id}>
                        <ListItem alignItems="flex-start">
                          <ListItemText
                            primary={activity.description}
                            secondary={
                              <>
                                <Typography
                                  component="span"
                                  variant="body2"
                                  color="text.primary"
                                >
                                  {activity.actor_username}
                                </Typography>
                                {' — '}{formatDate(activity.created_at)}
                              </>
                            }
                          />
                        </ListItem>
                        {index < activities.length - 1 && <Divider />}
                      </React.Fragment>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText
                        primary="No recent activity to display"
                      />
                    </ListItem>
                  )}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
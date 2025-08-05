import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Button,
  ButtonGroup,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Alert,
  Pagination,
} from '@mui/material';
import { User } from '../../types/user';
import { Role } from '../../config/roles';
import { getAllUsers, deleteUserById, updateUserRole, toggleUserStatus } from '../../services/adminService';
import useAuth from '../../hooks/useAuth';

const UserManagement = () => {
  const { user: loggedInUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const [open, setOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await getAllUsers(page);
        setUsers(response.users);
        setTotalPages(response.pagination.pages);
      } catch (err) {
        setError('Failed to fetch users.');
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [page]);

  const handleDeleteClick = (userId: string) => {
    setUserToDelete(userId);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setUserToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (userToDelete) {
      try {
        await deleteUserById(userToDelete);
        const response = await getAllUsers(page);
        setUsers(response.users);
        setTotalPages(response.pagination.pages);
      } catch (err) {
        setError('Failed to delete user.');
        console.log(err);
      } finally {
        handleClose();
      }
    }
  };

  const handleToggleRole = async (userToUpdate: User) => {
    const newRole = userToUpdate.role === Role.ADMIN ? Role.USER : Role.ADMIN;
    try {
      const updatedUser = await updateUserRole(userToUpdate._id, newRole);
      setUsers(users.map(u => u._id === updatedUser._id ? updatedUser : u));
    } catch (err) {
      setError('Failed to update user role.');
      console.error(err);
    }
  };

  const handleToggleStatus = async (userToUpdate: User) => {
    try {
      const updatedUser = await toggleUserStatus(userToUpdate._id);
      setUsers(users.map(u => u._id === updatedUser._id ? updatedUser : u));
    } catch (err) {
      setError('Failed to update user status.');
      console.error(err);
    }
  };
  
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>;
  }

  return (
    <Box sx={{ my: 4, width: '100%', maxWidth: '100%' }}>
      <Typography variant="h5" gutterBottom>
        User Management
      </Typography>
      <TableContainer 
        component={Paper} 
        sx={{ 
          overflowX: 'auto', 
          maxWidth: '100%',
          width: '100%',
          display: 'block'
        }}
      >
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id}>
                <TableCell>
                  {/* --- THIS IS THE CORRECTED CODE --- */}
                  {/* The Button now acts as the link itself, preventing nested <a> tags */}
                  <Button 
                    component={Link}
                    href={`/admin/users/${user._id}`}
                    variant="contained"
                    color="primary"
                    size="small"
                  >
                    {user.username}
                  </Button>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{user.isActive ? 'Active' : 'Inactive'}</TableCell>
                <TableCell>
                  <ButtonGroup variant="contained" size="small">
                    <Button
                      color={user.role === Role.ADMIN ? 'secondary' : 'primary'}
                      onClick={() => handleToggleRole(user)}
                      disabled={user._id === loggedInUser?._id}
                    >
                      {user.role === Role.ADMIN ? 'Make User' : 'Make Admin'}
                    </Button>
                    <Button
                      color={user.isActive ? 'warning' : 'success'}
                      onClick={() => handleToggleStatus(user)}
                      disabled={user._id === loggedInUser?._id}
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      color="error"
                      onClick={() => handleDeleteClick(user._id)}
                      disabled={user._id === loggedInUser?._id}
                    >
                      Delete
                    </Button>
                  </ButtonGroup>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={handlePageChange}
          color="primary"
        />
      </Box>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this user? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;

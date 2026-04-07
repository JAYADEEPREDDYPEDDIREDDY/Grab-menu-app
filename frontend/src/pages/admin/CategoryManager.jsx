import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import { getApiUrl } from '../../config/api';

export default function CategoryManager() {
  const { token, user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const menuQuery = user?.restaurantId ? `?restaurantId=${user.restaurantId}` : '';
      const [categoryResponse, itemResponse] = await Promise.all([
        fetch(getApiUrl('/api/categories'), {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(getApiUrl(`/api/menu${menuQuery}`), {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const categoryData = await categoryResponse.json().catch(() => []);
      const itemData = await itemResponse.json().catch(() => []);

      if (!categoryResponse.ok) {
        throw new Error(categoryData.message || 'Failed to load categories');
      }

      setCategories(Array.isArray(categoryData) ? categoryData : []);
      setItems(Array.isArray(itemData) ? itemData : []);
    } catch (loadError) {
      console.error(loadError);
      setError(loadError.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token, user?.restaurantId]);

  const itemCountByCategory = useMemo(() => {
    const counts = new Map();

    items.forEach((item) => {
      const key = String(item.category || '').trim();
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    return counts;
  }, [items]);

  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setName('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setError('');
      setSuccess('');

      const endpoint = editId ? `/api/categories/${editId}` : '/api/categories';
      const method = editId ? 'PATCH' : 'POST';

      const response = await fetch(getApiUrl(endpoint), {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save category');
      }

      setSuccess(editId ? 'Category updated successfully.' : 'Category created successfully.');
      resetForm();
      loadData();
    } catch (submitError) {
      console.error(submitError);
      setError(submitError.message || 'Failed to save category');
    }
  };

  const handleEdit = (category) => {
    setEditId(category._id);
    setName(category.name);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete category "${category.name}"?`)) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      const response = await fetch(getApiUrl(`/api/categories/${category._id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete category');
      }

      setSuccess('Category deleted successfully.');
      loadData();
    } catch (deleteError) {
      console.error(deleteError);
      setError(deleteError.message || 'Failed to delete category');
    }
  };

  return (
    <Stack spacing={3.5}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" sx={{ mb: 1 }}>
            Categories
          </Typography>
          <Typography variant="subtitle1">
            Create and maintain menu categories separately from menu items.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={() => {
            if (showForm && !editId) {
              resetForm();
              return;
            }

            setShowForm(true);
            setEditId(null);
            setName('');
          }}
        >
          {showForm && !editId ? 'Close editor' : 'Add category'}
        </Button>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}

      {showForm ? (
        <Card sx={{ backgroundColor: '#1A1715', borderRadius: '20px', p: 3 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <Typography variant="h6">
                {editId ? 'Edit category' : 'Create category'}
              </Typography>

              <TextField
                label="Category Name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />

              <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
                <Button variant="outlined" onClick={resetForm}>
                  Cancel
                </Button>
                <Button variant="contained" type="submit">
                  {editId ? 'Update category' : 'Save category'}
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Card>
      ) : null}

      <Card sx={{ backgroundColor: '#1A1715', borderRadius: '20px', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>Loading...</Box>
        ) : categories.length ? (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Category</TableCell>
                <TableCell>Linked Items</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.map((category) => (
                <TableRow
                  key={category._id}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.02)',
                    },
                  }}
                >
                  <TableCell>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <Box
                        sx={{
                          width: 34,
                          height: 34,
                          borderRadius: '12px',
                          display: 'grid',
                          placeItems: 'center',
                          backgroundColor: 'rgba(255,140,43,0.12)',
                          color: '#FF8C2B',
                        }}
                      >
                        <CategoryRoundedIcon sx={{ fontSize: 18 }} />
                      </Box>
                      <Typography sx={{ fontWeight: 700 }}>{category.name}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${itemCountByCategory.get(category.name) || 0} item${itemCountByCategory.get(category.name) === 1 ? '' : 's'}`}
                      size="small"
                      sx={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleEdit(category)}>
                      <EditRoundedIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(category)}
                      sx={{ color: '#EF4444' }}
                    >
                      <DeleteRoundedIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography sx={{ fontWeight: 700, mb: 1 }}>No categories yet</Typography>
            <Typography color="text.secondary">
              Create categories here first, then reuse them when adding menu items.
            </Typography>
          </Box>
        )}
      </Card>
    </Stack>
  );
}

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Button,
  Card,
  Chip,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
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

const emptyForm = {
  name: '',
  price: '',
  category: '',
  description: '',
  image: '',
  isVeg: true,
  isPopular: false,
};

export default function MenuManager() {
  const { token, user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [editId, setEditId] = useState(null);

  const fetchItems = async () => {
    try {
      const query = user?.restaurantId ? `?restaurantId=${user.restaurantId}` : '';
      const res = await fetch(`http://localhost:5000/api/menu${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setItems(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [token, user?.restaurantId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const method = editId ? 'PUT' : 'POST';
      const url = editId
        ? `http://localhost:5000/api/menu/${editId}`
        : 'http://localhost:5000/api/menu';

      await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...formData, price: parseFloat(formData.price) }),
      });

      setShowForm(false);
      setEditId(null);
      setFormData(emptyForm);
      fetchItems();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      ...item,
      price: item.price?.toString() || '',
    });
    setEditId(item._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await fetch(`http://localhost:5000/api/menu/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchItems();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Stack spacing={3.5}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" sx={{ mb: 1 }}>
            Menu Items
          </Typography>
          <Typography variant="subtitle1">
            Add, edit, and organize restaurant offerings.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={() => {
            const next = !showForm;
            setShowForm(next);
            if (!next) {
              setEditId(null);
              setFormData(emptyForm);
            }
          }}
        >
          {showForm ? 'Close editor' : 'Add item'}
        </Button>
      </Stack>

      {showForm ? (
        <Card sx={{ backgroundColor: '#1A1715', borderRadius: '20px', p: 3 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <Typography variant="h6">
                {editId ? 'Edit menu item' : 'Create menu item'}
              </Typography>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                  gap: 2,
                }}
              >
                <TextField
                  label="Name"
                  value={formData.name}
                  onChange={(event) =>
                    setFormData({ ...formData, name: event.target.value })
                  }
                  required
                />
                <TextField
                  label="Price"
                  type="number"
                  inputProps={{ step: '0.01' }}
                  value={formData.price}
                  onChange={(event) =>
                    setFormData({ ...formData, price: event.target.value })
                  }
                  required
                />
                <TextField
                  label="Category"
                  value={formData.category}
                  onChange={(event) =>
                    setFormData({ ...formData, category: event.target.value })
                  }
                  required
                />
                <TextField
                  label="Image URL"
                  value={formData.image}
                  onChange={(event) =>
                    setFormData({ ...formData, image: event.target.value })
                  }
                />
                <TextField
                  label="Description"
                  multiline
                  minRows={3}
                  sx={{ gridColumn: { md: '1 / -1' } }}
                  value={formData.description}
                  onChange={(event) =>
                    setFormData({ ...formData, description: event.target.value })
                  }
                  required
                />
              </Box>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isVeg}
                      onChange={(event) =>
                        setFormData({ ...formData, isVeg: event.target.checked })
                      }
                    />
                  }
                  label="Vegetarian"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isPopular}
                      onChange={(event) =>
                        setFormData({ ...formData, isPopular: event.target.checked })
                      }
                    />
                  }
                  label="Popular"
                />
              </Stack>

              <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setShowForm(false);
                    setEditId(null);
                    setFormData(emptyForm);
                  }}
                >
                  Cancel
                </Button>
                <Button variant="contained" type="submit">
                  {editId ? 'Update item' : 'Save item'}
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Card>
      ) : null}

      <Card sx={{ backgroundColor: '#1A1715', borderRadius: '20px', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>Loading...</Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Price</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow
                  key={item._id}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.02)',
                    },
                  }}
                >
                  <TableCell>
                    <Stack spacing={0.75}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography sx={{ fontWeight: 700 }}>{item.name}</Typography>
                        {item.isVeg ? (
                          <Chip label="Veg" size="small" color="success" />
                        ) : null}
                        {item.isPopular ? (
                          <Chip
                            label="Popular"
                            size="small"
                            sx={{ backgroundColor: 'rgba(255,140,43,0.14)', color: '#FF9E45' }}
                          />
                        ) : null}
                      </Stack>
                      <Typography sx={{ color: 'text.secondary', maxWidth: 340 }}>
                        {item.description}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell sx={{ color: '#FF8C2B', fontWeight: 700 }}>
                    ${Number(item.price || 0).toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleEdit(item)}>
                      <EditRoundedIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(item._id)}
                      sx={{ color: '#EF4444' }}
                    >
                      <DeleteRoundedIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </Stack>
  );
}

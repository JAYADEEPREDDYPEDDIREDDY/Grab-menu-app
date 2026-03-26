import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import DragIndicatorRoundedIcon from '@mui/icons-material/DragIndicatorRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import LunchDiningRoundedIcon from '@mui/icons-material/LunchDiningRounded';
import PointOfSaleRoundedIcon from '@mui/icons-material/PointOfSaleRounded';
import CircleRoundedIcon from '@mui/icons-material/CircleRounded';

const columns = [
  { key: 'Pending', title: 'New / Pending', color: '#FBBF24' },
  { key: 'Preparing', title: 'Preparing', color: '#3B82F6' },
  { key: 'Completed', title: 'Ready / Completed', color: '#22C55E' },
];

const statusByColumn = {
  Pending: ['Pending'],
  Preparing: ['Preparing'],
  Completed: ['Ready', 'Completed'],
};

const actionConfig = {
  Pending: {
    label: 'Start Preparing',
    icon: <LunchDiningRoundedIcon sx={{ fontSize: 18 }} />,
    sx: {
      backgroundColor: '#2563EB',
      '&:hover': { backgroundColor: '#1D4ED8' },
    },
    nextStatus: 'Preparing',
  },
  Preparing: {
    label: 'Complete & Bill',
    icon: <PointOfSaleRoundedIcon sx={{ fontSize: 18 }} />,
    sx: {
      backgroundColor: '#16A34A',
      '&:hover': { backgroundColor: '#15803D' },
    },
    nextStatus: 'Completed',
  },
  Ready: {
    label: 'Complete & Bill',
    icon: <PointOfSaleRoundedIcon sx={{ fontSize: 18 }} />,
    sx: {
      backgroundColor: '#16A34A',
      '&:hover': { backgroundColor: '#15803D' },
    },
    nextStatus: 'Completed',
  },
};

function formatOrderId(order) {
  const value = order._id?.slice(-4) || '0';
  return `#${value.padStart(4, '0')}`;
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function SortableOrderCard({ order, onAdvance }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: order._id,
      data: { type: 'order', order },
    });

  return (
    <Card
      ref={setNodeRef}
      {...attributes}
      sx={{
        p: 2.5,
        borderRadius: '16px',
        backgroundColor: '#221F1C',
        border: '1px solid rgba(255,255,255,0.05)',
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.84 : 1,
        boxShadow: isDragging
          ? '0 28px 60px rgba(0,0,0,0.36)'
          : '0 8px 24px rgba(0,0,0,0.18)',
        '&:hover': {
          transform: `${CSS.Transform.toString(transform) || 'translate3d(0,0,0)'} scale(1.015)`,
          boxShadow: '0 20px 38px rgba(0,0,0,0.26)',
        },
      }}
    >
      <Stack spacing={2.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Stack direction="row" spacing={1.25} alignItems="flex-start">
            <Box
              {...listeners}
              sx={{
                mt: 0.4,
                color: 'text.secondary',
                cursor: 'grab',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <DragIndicatorRoundedIcon />
            </Box>

            <Box>
              <Stack
                direction="row"
                spacing={1.2}
                alignItems="center"
                useFlexGap
                flexWrap="wrap"
                sx={{ mb: 0.5 }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {formatOrderId(order)}
                </Typography>
                <Chip
                  label={`Table ${order.tableId?.tableNumber || '-'}`}
                  size="small"
                  sx={{
                    backgroundColor: alpha('#FF8C2B', 0.16),
                    color: '#FF9E45',
                    height: 28,
                    fontWeight: 700,
                  }}
                />
                {order.mergedTables?.length ? (
                  <Chip
                    label={`Merged ${order.mergedTables.length + 1}`}
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      color: 'text.secondary',
                      height: 28,
                    }}
                  />
                ) : null}
              </Stack>
              <Stack direction="row" spacing={0.75} alignItems="center" color="text.secondary">
                <AccessTimeRoundedIcon sx={{ fontSize: 18 }} />
                <Typography sx={{ fontSize: 15 }}>{formatTime(order.createdAt)}</Typography>
              </Stack>
            </Box>
          </Stack>

          <Typography
            sx={{
              color: '#FF8C2B',
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            ${Number(order.totalPrice || 0).toFixed(2)}
          </Typography>
        </Stack>

        <Stack spacing={1.2}>
          {order.items.map((item, index) => (
            <Stack key={`${order._id}-${index}`} direction="row" spacing={1.25}>
              <Typography sx={{ color: 'text.secondary', minWidth: 28, fontWeight: 700 }}>
                {item.quantity}x
              </Typography>
              <Typography sx={{ fontWeight: 700 }}>
                {item.menuItemId?.name || 'Menu item'}
              </Typography>
            </Stack>
          ))}
        </Stack>

        {order.status === 'Completed' ? (
          <Stack direction="row" spacing={1} alignItems="center" color="#22C55E">
            <CheckCircleRoundedIcon sx={{ fontSize: 20 }} />
            <Typography sx={{ fontWeight: 700 }}>Completed - Bill generated</Typography>
          </Stack>
        ) : (
          <Button
            fullWidth
            variant="contained"
            startIcon={actionConfig[order.status]?.icon}
            onClick={() => onAdvance(order._id, actionConfig[order.status]?.nextStatus)}
            sx={{
              borderRadius: '12px',
              py: 1.4,
              ...actionConfig[order.status]?.sx,
            }}
          >
            {actionConfig[order.status]?.label}
          </Button>
        )}
      </Stack>
    </Card>
  );
}

function KanbanColumn({ column, orders, badge, onAdvance }) {
  const { setNodeRef } = useDroppable({
    id: column.key,
  });

  return (
    <Card
      ref={setNodeRef}
      sx={{
        backgroundColor: '#1A1715',
        borderRadius: '16px',
        p: 2.5,
        minHeight: 680,
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <CircleRoundedIcon sx={{ color: column.color, fontSize: 16 }} />
            <Typography variant="h6">{column.title}</Typography>
          </Stack>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Chip
              label={badge}
              size="small"
              sx={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                color: '#FFFFFF',
                minWidth: 36,
              }}
            />
            {column.key === 'Completed' ? (
              <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>Auto-bills</Typography>
            ) : null}
          </Stack>
        </Stack>

        <SortableContext items={orders.map((order) => order._id)} strategy={verticalListSortingStrategy}>
          <Stack spacing={2.25}>
            {orders.length ? (
              orders.map((order) => (
                <SortableOrderCard key={order._id} order={order} onAdvance={onAdvance} />
              ))
            ) : (
              <Box
                sx={{
                  borderRadius: '16px',
                  border: '1px dashed rgba(255,255,255,0.08)',
                  minHeight: 180,
                  display: 'grid',
                  placeItems: 'center',
                  color: 'text.secondary',
                  textAlign: 'center',
                  px: 3,
                }}
              >
                Drop orders here as their status changes.
              </Box>
            )}
          </Stack>
        </SortableContext>
      </Stack>
    </Card>
  );
}

export default function Dashboard() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/orders', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setOrders(await res.json());
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    const socket = io('http://localhost:5000');

    socket.on('newOrder', (order) => {
      setOrders((current) => [{ ...order }, ...current.filter((item) => item._id !== order._id)]);
    });

    socket.on('orderStatusUpdate', (updatedOrder) => {
      setOrders((current) =>
        current.map((order) => (order._id === updatedOrder._id ? updatedOrder : order))
      );
    });

    return () => socket.disconnect();
  }, [token]);

  const updateOrderStatus = async (orderId, nextStatus) => {
    if (!nextStatus) return;

    setOrders((current) =>
      current.map((order) =>
        order._id === orderId ? { ...order, status: nextStatus } : order
      )
    );

    try {
      await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch (error) {
      console.error(error);
    }
  };

  const findColumnKeyForStatus = (status) =>
    columns.find((column) => statusByColumn[column.key].includes(status))?.key || 'Pending';

  const getColumnOrders = (columnKey) =>
    orders.filter((order) => statusByColumn[columnKey].includes(order.status));

  const handleDragEnd = ({ active, over }) => {
    if (!over) return;

    const activeOrder = orders.find((order) => order._id === active.id);
    if (!activeOrder) return;

    const activeColumn = findColumnKeyForStatus(activeOrder.status);
    const overOrder = orders.find((order) => order._id === over.id);
    const overColumn = overOrder
      ? findColumnKeyForStatus(overOrder.status)
      : columns.find((column) => column.key === over.id)?.key;

    if (!overColumn) return;

    if (activeColumn === overColumn) {
      const scopedOrders = getColumnOrders(activeColumn);
      const oldIndex = scopedOrders.findIndex((order) => order._id === active.id);
      const newIndex = overOrder
        ? scopedOrders.findIndex((order) => order._id === over.id)
        : scopedOrders.length - 1;

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      const reorderedScoped = arrayMove(scopedOrders, oldIndex, newIndex);
      const updatedOrders = [...orders];
      let pointer = 0;

      for (let index = 0; index < updatedOrders.length; index += 1) {
        if (findColumnKeyForStatus(updatedOrders[index].status) === activeColumn) {
          updatedOrders[index] = reorderedScoped[pointer];
          pointer += 1;
        }
      }

      setOrders(updatedOrders);
      return;
    }

    const nextStatus = overColumn === 'Completed' ? 'Completed' : overColumn;
    updateOrderStatus(active.id, nextStatus);
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress sx={{ color: '#FF8C2B' }} />
          <Typography color="text.secondary">Loading live orders...</Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Stack spacing={4}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        spacing={2}
      >
        <Box>
          <Typography variant="h3" sx={{ mb: 1 }}>
            Live Orders
          </Typography>
          <Typography variant="subtitle1">
            Drag orders across columns to update their status
          </Typography>
        </Box>

        <Chip
          icon={<CircleRoundedIcon sx={{ color: '#22C55E !important', fontSize: 14 }} />}
          label="Receiving live updates"
          sx={{
            height: 46,
            px: 1.25,
            borderRadius: '999px',
            backgroundColor: 'rgba(255,255,255,0.04)',
            color: '#FFFFFF',
            '& .MuiChip-label': { fontWeight: 700, px: 0.75 },
          }}
        />
      </Stack>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', xl: 'repeat(3, minmax(0, 1fr))' },
            gap: 3,
          }}
        >
          {columns.map((column) => (
            <KanbanColumn
              key={column.key}
              column={column}
              orders={getColumnOrders(column.key)}
              badge={getColumnOrders(column.key).length}
              onAdvance={updateOrderStatus}
            />
          ))}
        </Box>
      </DndContext>
    </Stack>
  );
}

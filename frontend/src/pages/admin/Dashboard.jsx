import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import {
  DndContext,
  PointerSensor,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Snackbar,
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
import { SOCKET_BASE_URL, getApiUrl } from '../../config/api';

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

const RUPEE_SYMBOL = '\u20B9';
const TITLE_SEPARATOR = '\u2022';

const normalizeOrders = (incomingOrders) =>
  incomingOrders.filter(
    (order) =>
      order &&
      order._id &&
      order.tableId &&
      Array.isArray(order.items) &&
      order.items.length > 0 &&
      order.items.every((item) => item.menuItemId)
  );

const isSameDay = (leftDate, rightDate) =>
  leftDate.getFullYear() === rightDate.getFullYear() &&
  leftDate.getMonth() === rightDate.getMonth() &&
  leftDate.getDate() === rightDate.getDate();

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
                touchAction: 'none',
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
            {RUPEE_SYMBOL}
            {Number(order.totalPrice || 0).toFixed(2)}
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
            <Typography sx={{ fontWeight: 700 }}>Completed - Ready for billing</Typography>
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
              <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>Ready to bill</Typography>
            ) : null}
          </Stack>
        </Stack>

        <SortableContext
          items={orders.map((order) => order._id)}
          strategy={verticalListSortingStrategy}
        >
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
                No live orders for this restaurant yet.
              </Box>
            )}
          </Stack>
        </SortableContext>
      </Stack>
    </Card>
  );
}

export default function Dashboard() {
  const { token, restaurant, user, refreshRestaurant } = useAuth();
  const [orders, setOrders] = useState([]);
  const [activeBills, setActiveBills] = useState([]);
  const [sessionOverview, setSessionOverview] = useState({
    counts: { active: 0, locked: 0, billing: 0 },
    sessions: [],
  });
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [incomingAlert, setIncomingAlert] = useState(null);
  const [releasingSessionId, setReleasingSessionId] = useState('');
  const [processingPaymentBillId, setProcessingPaymentBillId] = useState('');
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const restaurantId = user?.restaurantId;
  const knownOrderIdsRef = useRef(new Set());

  const showIncomingOrderNotification = (order) => {
    const tableNumber = order.tableId?.tableNumber || '-';
    const itemCount = Array.isArray(order.items)
      ? order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
      : 0;
    const message = `New order from Table ${tableNumber}: ${itemCount} item${itemCount === 1 ? '' : 's'}`;

    setIncomingAlert({
      key: `${order._id}-${Date.now()}`,
      title: 'New order received',
      message,
    });

    if (typeof document !== 'undefined') {
      document.title = `New Order ${TITLE_SEPARATOR} ${restaurant?.name || 'Dashboard'}`;
      window.setTimeout(() => {
        document.title = `${restaurant?.name || 'Restaurant'} Dashboard`;
      }, 4000);
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        const notification = new Notification('New order received', {
          body: message,
          tag: `order-${order._id}`,
        });
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      } else if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }
  };

  const showPaymentRequestNotification = (payload) => {
    setIncomingAlert({
      key: `${payload.sessionId || payload.billId}-${Date.now()}`,
      title: 'Cash payment requested',
      message: `Table ${payload.tableNumber || '-'} is waiting for cash collection.`,
      severity: 'warning',
    });
  };

  const fetchOrders = useCallback(
    async (showLoader = false) => {
      if (showLoader) {
        setLoading(true);
      }

      try {
        const res = await fetch(getApiUrl('/api/orders'), {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          return;
        }

        const normalized = normalizeOrders(await res.json());
        setOrders(normalized);
        knownOrderIdsRef.current = new Set(normalized.map((order) => order._id));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  const fetchSessionOverview = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl('/api/session/overview'), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        return;
      }

      const data = await res.json();
      setSessionOverview({
        counts: data.counts || { active: 0, locked: 0, billing: 0 },
        sessions: Array.isArray(data.sessions) ? data.sessions : [],
      });
    } catch (error) {
      console.error(error);
    }
  }, [token]);

  const fetchBillingOverview = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl('/api/billing/overview'), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        return;
      }

      const data = await res.json();
      setActiveBills(Array.isArray(data.activeBills) ? data.activeBills : []);
    } catch (error) {
      console.error(error);
    }
  }, [token]);

  useEffect(() => {
    let isMounted = true;

    fetchOrders();
    fetchSessionOverview();
    fetchBillingOverview();
    refreshRestaurant();

    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'default'
    ) {
      Notification.requestPermission().catch(() => {});
    }

    const socket = io(SOCKET_BASE_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
      fetchOrders();
      fetchSessionOverview();
      fetchBillingOverview();
    });

    socket.on('newOrder', (order) => {
      if (String(order.restaurantId) !== String(restaurantId)) {
        return;
      }

      const isExistingOrder = knownOrderIdsRef.current.has(order._id);
      knownOrderIdsRef.current.add(order._id);

      setOrders((current) =>
        normalizeOrders([{ ...order }, ...current.filter((item) => item._id !== order._id)])
      );

      if (!isExistingOrder) {
        showIncomingOrderNotification(order);
      }
    });

    socket.on('orderStatusUpdate', (updatedOrder) => {
      if (String(updatedOrder.restaurantId) !== String(restaurantId)) {
        return;
      }

      knownOrderIdsRef.current.add(updatedOrder._id);

      setOrders((current) =>
        normalizeOrders(
          current.map((order) => (order._id === updatedOrder._id ? updatedOrder : order))
        )
      );
      fetchSessionOverview();
      fetchBillingOverview();
    });

    socket.on('sessionUpdate', () => {
      fetchSessionOverview();
      fetchBillingOverview();
    });

    socket.on('paymentRequest', (payload) => {
      if (String(payload.restaurantId) !== String(restaurantId)) {
        return;
      }
      fetchSessionOverview();
      fetchBillingOverview();
      showPaymentRequestNotification(payload);
    });

    socket.on('billUpdate', (bill) => {
      if (String(bill.restaurantId) !== String(restaurantId)) {
        return;
      }
      fetchBillingOverview();
      fetchSessionOverview();
    });

    const scheduleNextDayRefresh = () => {
      const now = new Date();
      const nextMidnight = new Date(now);
      nextMidnight.setHours(24, 0, 5, 0);

      return window.setTimeout(async () => {
        if (!isMounted) return;

        setCurrentDate(new Date());
        await fetchOrders(true);
        await fetchSessionOverview();
        await fetchBillingOverview();
        refreshRestaurant();
      }, nextMidnight.getTime() - now.getTime());
    };

    let midnightTimeoutId = scheduleNextDayRefresh();
    const midnightIntervalId = window.setInterval(() => {
      window.clearTimeout(midnightTimeoutId);
      midnightTimeoutId = scheduleNextDayRefresh();
    }, 60 * 60 * 1000);

    return () => {
      isMounted = false;
      socket.disconnect();
      window.clearTimeout(midnightTimeoutId);
      window.clearInterval(midnightIntervalId);
    };
  }, [fetchBillingOverview, fetchOrders, fetchSessionOverview, refreshRestaurant, restaurantId]);

  const updateOrderStatus = async (orderId, nextStatus) => {
    if (!nextStatus) return;

    setOrders((current) =>
      current.map((order) =>
        order._id === orderId ? { ...order, status: nextStatus } : order
      )
    );

    try {
      await fetch(getApiUrl(`/api/orders/${orderId}/status`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch (error) {
      console.error(error);
      window.location.reload();
    }
  };

  const releaseTable = async (sessionId) => {
    try {
      setReleasingSessionId(sessionId);
      const response = await fetch(getApiUrl(`/api/session/${sessionId}/release`), {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const rawBody = await response.text();
      let data = {};

      try {
        data = rawBody ? JSON.parse(rawBody) : {};
      } catch (parseError) {
        data = { message: rawBody || 'Failed to release table' };
      }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to release table');
      }

      setIncomingAlert({
        key: `release-${sessionId}-${Date.now()}`,
        title: 'Table released',
        message: data.message || 'The table session has been released.',
        severity: 'success',
      });
    } catch (error) {
      console.error(error);
      setIncomingAlert({
        key: `release-error-${sessionId}-${Date.now()}`,
        title: 'Release failed',
        message: error.message || 'Unable to release the table session.',
        severity: 'error',
      });
    } finally {
      setReleasingSessionId('');
    }
  };

  const activeBillByTableId = useMemo(() => {
    const mapping = new Map();

    activeBills.forEach((bill) => {
      (bill.tableIds || []).forEach((table) => {
        const tableId = String(table?._id || table);
        if (!mapping.has(tableId)) {
          mapping.set(tableId, bill);
        }
      });
    });

    return mapping;
  }, [activeBills]);

  const approvePayment = async (bill) => {
    const billId = bill?._id;
    if (!billId) return;

    const endpoint =
      bill.paymentStatus === 'AWAITING_APPROVAL'
        ? getApiUrl(`/api/payment/approve-cash/${billId}`)
        : getApiUrl(`/api/billing/mark-paid/${billId}`);

    try {
      setProcessingPaymentBillId(billId);
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const rawBody = await response.text();
      let data = {};

      try {
        data = rawBody ? JSON.parse(rawBody) : {};
      } catch (parseError) {
        data = { message: rawBody || 'Failed to approve payment' };
      }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to approve payment');
      }

      setIncomingAlert({
        key: `payment-${billId}-${Date.now()}`,
        title:
          bill.paymentStatus === 'AWAITING_APPROVAL'
            ? 'Cash payment approved'
            : 'Payment marked as paid',
        message:
          data.message ||
          `Table ${bill.tableIds?.map((table) => table.tableNumber).join(', ') || '-'} has been settled.`,
        severity: 'success',
      });

      await fetchBillingOverview();
      await fetchSessionOverview();
    } catch (error) {
      console.error(error);
      setIncomingAlert({
        key: `payment-error-${billId}-${Date.now()}`,
        title: 'Payment update failed',
        message: error.message || 'Unable to update bill payment status.',
        severity: 'error',
      });
    } finally {
      setProcessingPaymentBillId('');
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

  const todayOrders = useMemo(
    () => orders.filter((order) => isSameDay(new Date(order.createdAt), currentDate)),
    [currentDate, orders]
  );

  const liveOrderCount = orders.filter((order) => order.status !== 'Completed').length;
  const totalRevenueToday = todayOrders.reduce(
    (sum, order) => sum + Number(order.totalPrice || 0),
    0
  );
  const completedCount = todayOrders.filter((order) => order.status === 'Completed').length;

  const summaryCards = useMemo(
    () => [
      { label: 'Live Orders', value: liveOrderCount },
      { label: 'Completed Today', value: completedCount },
      { label: 'Revenue Today', value: `${RUPEE_SYMBOL}${totalRevenueToday.toFixed(2)}` },
      { label: 'Active Tables', value: sessionOverview.counts.active },
      { label: 'Locked Tables', value: sessionOverview.counts.locked },
      { label: 'Billing In Progress', value: sessionOverview.counts.billing },
    ],
    [completedCount, liveOrderCount, sessionOverview.counts.active, sessionOverview.counts.billing, sessionOverview.counts.locked, totalRevenueToday]
  );

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
    <>
      <Stack spacing={4}>
        <Card sx={{ p: 3.5, borderRadius: '24px', backgroundColor: '#1A1715' }}>
          <Stack
            direction={{ xs: 'column', xl: 'row' }}
            spacing={3}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', xl: 'center' }}
          >
            <Box>
              <Typography variant="h3" sx={{ mb: 1 }}>
                {restaurant?.name || 'Restaurant'} Live Orders
              </Typography>
              <Typography variant="subtitle1">
                Only real customer orders from this restaurant and table flow into this board.
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

          <Box
            sx={{
              mt: 3,
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
              gap: 2,
            }}
          >
            {summaryCards.map((card) => (
              <Card
                key={card.label}
                sx={{ p: 2.25, borderRadius: '18px', backgroundColor: '#221F1C' }}
              >
                <Typography color="text.secondary" sx={{ mb: 0.75 }}>
                  {card.label}
                </Typography>
                <Typography variant="h5">{card.value}</Typography>
              </Card>
            ))}
          </Box>

          <Card
            sx={{
              mt: 3,
              p: 2.25,
              borderRadius: '18px',
              backgroundColor: '#221F1C',
            }}
          >
            <Typography variant="h6" sx={{ mb: 1.75 }}>
              Live Table Sessions
            </Typography>
            {sessionOverview.sessions.length ? (
              <Stack spacing={1.25}>
                {sessionOverview.sessions.slice(0, 6).map((tableSession) => (
                  (() => {
                    const activeBill = activeBillByTableId.get(
                      String(tableSession.tableId?._id || '')
                    );

                    return (
                  <Stack
                    key={tableSession._id}
                    direction={{ xs: 'column', md: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', md: 'center' }}
                    spacing={1}
                    sx={{
                      borderRadius: '14px',
                      px: 1.75,
                      py: 1.25,
                      backgroundColor: 'rgba(255,255,255,0.03)',
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 700 }}>
                        Table {tableSession.tableId?.tableNumber || '-'}
                      </Typography>
                      <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                        {tableSession.persons || 1} guest{Number(tableSession.persons || 1) === 1 ? '' : 's'}
                        {' | '}
                        {tableSession.orders?.length || 0} order{(tableSession.orders?.length || 0) === 1 ? '' : 's'}
                        {' | '}
                        cap {tableSession.tableId?.capacity || 4}
                      </Typography>
                      {activeBill ? (
                        <Typography sx={{ color: '#FFB067', fontSize: 13, mt: 0.5 }}>
                          {activeBill.paymentMethod || 'Payment'} {TITLE_SEPARATOR} {RUPEE_SYMBOL}
                          {Number(activeBill.totalAmount || 0).toFixed(2)} {TITLE_SEPARATOR}{' '}
                          {activeBill.paymentStatus === 'AWAITING_APPROVAL'
                            ? 'Awaiting approval'
                            : 'Pending payment'}
                        </Typography>
                      ) : null}
                    </Box>

                    <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                      <Chip
                        label={tableSession.status}
                        size="small"
                        color={tableSession.status === 'BILLING' ? 'warning' : 'success'}
                      />
                      {tableSession.paymentRequest?.status === 'awaiting_approval' ? (
                        <Chip label="Cash Request" size="small" color="warning" />
                      ) : null}
                      {activeBill ? (
                        <Button
                          size="small"
                          variant="contained"
                          color={
                            activeBill.paymentStatus === 'AWAITING_APPROVAL'
                              ? 'warning'
                              : 'success'
                          }
                          disabled={processingPaymentBillId === activeBill._id}
                          onClick={() => approvePayment(activeBill)}
                        >
                          {processingPaymentBillId === activeBill._id
                            ? 'Updating...'
                            : activeBill.paymentStatus === 'AWAITING_APPROVAL'
                              ? 'Approve Payment'
                              : 'Mark Paid'}
                        </Button>
                      ) : null}
                      <Button
                        size="small"
                        variant="outlined"
                        color="warning"
                        disabled={releasingSessionId === tableSession._id}
                        onClick={() => releaseTable(tableSession._id)}
                      >
                        {releasingSessionId === tableSession._id ? 'Releasing...' : 'Release Table'}
                      </Button>
                    </Stack>
                  </Stack>
                    );
                  })()
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary">
                No active table sessions right now.
              </Typography>
            )}
          </Card>
        </Card>

        <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
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

      <Snackbar
        key={incomingAlert?.key}
        open={Boolean(incomingAlert)}
        autoHideDuration={5000}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        onClose={() => setIncomingAlert(null)}
      >
        <Alert
          onClose={() => setIncomingAlert(null)}
          severity={incomingAlert?.severity || 'success'}
          variant="filled"
          sx={{
            minWidth: 320,
            borderRadius: '16px',
            backgroundColor:
              incomingAlert?.severity === 'warning'
                ? '#D97706'
                : incomingAlert?.severity === 'error'
                  ? '#DC2626'
                  : '#16A34A',
            color: '#FFFFFF',
            boxShadow: '0 18px 42px rgba(0,0,0,0.28)',
            '& .MuiAlert-message': { display: 'grid', gap: 0.25 },
          }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: 15 }}>
            {incomingAlert?.title}
          </Typography>
          <Typography sx={{ fontSize: 13.5, opacity: 0.92 }}>
            {incomingAlert?.message}
          </Typography>
        </Alert>
      </Snackbar>
    </>
  );
}

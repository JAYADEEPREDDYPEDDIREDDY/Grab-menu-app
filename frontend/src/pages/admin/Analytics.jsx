import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Card,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import DateRangeRoundedIcon from '@mui/icons-material/DateRangeRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import LocalFireDepartmentRoundedIcon from '@mui/icons-material/LocalFireDepartmentRounded';
import TableRestaurantRoundedIcon from '@mui/icons-material/TableRestaurantRounded';
import DonutLargeRoundedIcon from '@mui/icons-material/DonutLargeRounded';

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

const getStartOfWeek = (date) => {
  const nextDate = new Date(date);
  const day = nextDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  nextDate.setDate(nextDate.getDate() + diff);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
};

const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;

export default function Analytics() {
  const { token, restaurant } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/orders', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setOrders(normalizeOrders(await res.json()));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token]);

  const now = new Date();
  const startOfWeek = getStartOfWeek(now);

  const analyticsCards = useMemo(() => {
    const todayOrders = orders.filter((order) => isSameDay(new Date(order.createdAt), now));
    const weekOrders = orders.filter((order) => new Date(order.createdAt) >= startOfWeek);
    const totalItems = (collection) =>
      collection.reduce(
        (sum, order) =>
          sum +
          order.items.reduce((itemSum, item) => itemSum + Number(item.quantity || 0), 0),
        0
      );
    const totalRevenue = (collection) =>
      collection.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);

    return [
      {
        key: 'today',
        label: 'Today',
        icon: <CalendarTodayRoundedIcon sx={{ fontSize: 18 }} />,
        orders: todayOrders.length,
        revenue: totalRevenue(todayOrders),
        items: totalItems(todayOrders),
      },
      {
        key: 'week',
        label: 'This Week',
        icon: <DateRangeRoundedIcon sx={{ fontSize: 18 }} />,
        orders: weekOrders.length,
        revenue: totalRevenue(weekOrders),
        items: totalItems(weekOrders),
      },
      {
        key: 'overall',
        label: 'Overall',
        icon: <InsightsRoundedIcon sx={{ fontSize: 18 }} />,
        orders: orders.length,
        revenue: totalRevenue(orders),
        items: totalItems(orders),
      },
    ];
  }, [orders, now, startOfWeek]);

  const trendDays = useMemo(() => {
    const dayLabels = [];
    for (let index = 6; index >= 0; index -= 1) {
      const date = new Date(now);
      date.setDate(now.getDate() - index);
      date.setHours(0, 0, 0, 0);
      dayLabels.push(date);
    }

    const points = dayLabels.map((date) => {
      const dayOrders = orders.filter((order) => isSameDay(new Date(order.createdAt), date));
      return {
        key: date.toISOString(),
        label: date.toLocaleDateString([], { weekday: 'short' }),
        orders: dayOrders.length,
        revenue: dayOrders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0),
      };
    });

    const maxRevenue = Math.max(...points.map((point) => point.revenue), 1);
    return points.map((point) => ({
      ...point,
      height: `${Math.max((point.revenue / maxRevenue) * 100, point.revenue > 0 ? 18 : 8)}%`,
    }));
  }, [now, orders]);

  const topItems = useMemo(() => {
    const itemMap = new Map();

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const itemName = item.menuItemId?.name || 'Menu item';
        const current = itemMap.get(itemName) || {
          name: itemName,
          quantity: 0,
          revenue: 0,
        };

        current.quantity += Number(item.quantity || 0);
        current.revenue += Number(item.quantity || 0) * Number(item.priceAtTimeOfOrder || 0);
        itemMap.set(itemName, current);
      });
    });

    return Array.from(itemMap.values())
      .sort((left, right) => right.quantity - left.quantity)
      .slice(0, 5);
  }, [orders]);

  const busiestTables = useMemo(() => {
    const tableMap = new Map();

    orders.forEach((order) => {
      const tableNumber = order.tableId?.tableNumber ?? '-';
      const current = tableMap.get(tableNumber) || {
        table: tableNumber,
        orders: 0,
        revenue: 0,
      };

      current.orders += 1;
      current.revenue += Number(order.totalPrice || 0);
      tableMap.set(tableNumber, current);
    });

    return Array.from(tableMap.values())
      .sort((left, right) => right.orders - left.orders)
      .slice(0, 5);
  }, [orders]);

  const statusBreakdown = useMemo(() => {
    const counts = {
      Pending: 0,
      Preparing: 0,
      Ready: 0,
      Completed: 0,
    };

    orders.forEach((order) => {
      counts[order.status] = (counts[order.status] || 0) + 1;
    });

    const total = Math.max(orders.length, 1);
    return [
      { label: 'Pending', value: counts.Pending, color: '#FBBF24' },
      { label: 'Preparing', value: counts.Preparing, color: '#3B82F6' },
      { label: 'Ready', value: counts.Ready, color: '#14B8A6' },
      { label: 'Completed', value: counts.Completed, color: '#22C55E' },
    ].map((item) => ({
      ...item,
      percent: Math.round((item.value / total) * 100),
    }));
  }, [orders]);

  if (loading) {
    return (
      <Box sx={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress sx={{ color: '#FF8C2B' }} />
          <Typography color="text.secondary">Loading analytics...</Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h4" sx={{ mb: 1 }}>
          {restaurant?.name || 'Restaurant'} Analytics
        </Typography>
        <Typography variant="subtitle1">
          Day-wise, week-wise, and overall reporting for orders, revenue, items, and table activity.
        </Typography>
      </Box>

      <Card sx={{ p: 3.5, borderRadius: '24px', backgroundColor: '#1A1715' }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h5" sx={{ mb: 0.75 }}>
              Order Analytics
            </Typography>
            <Typography color="text.secondary">
              Track restaurant performance by day, week, and overall order volume.
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
              gap: 2,
            }}
          >
            {analyticsCards.map((card) => (
              <Card
                key={card.key}
                sx={{
                  p: 2.5,
                  borderRadius: '18px',
                  backgroundColor: '#221F1C',
                }}
              >
                <Stack spacing={1.75}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box
                      sx={{
                        width: 34,
                        height: 34,
                        borderRadius: '10px',
                        display: 'grid',
                        placeItems: 'center',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        color: '#FF8C2B',
                      }}
                    >
                      {card.icon}
                    </Box>
                    <Typography sx={{ fontWeight: 700 }}>{card.label}</Typography>
                  </Stack>

                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography color="text.secondary">Orders</Typography>
                      <Typography sx={{ fontWeight: 700 }}>{card.orders}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography color="text.secondary">Items Sold</Typography>
                      <Typography sx={{ fontWeight: 700 }}>{card.items}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography color="text.secondary">Revenue</Typography>
                      <Typography sx={{ fontWeight: 700, color: '#FF8C2B' }}>
                        {formatCurrency(card.revenue)}
                      </Typography>
                    </Stack>
                  </Stack>
                </Stack>
              </Card>
            ))}
          </Box>
        </Stack>
      </Card>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', xl: '1.2fr 0.8fr' },
          gap: 3,
        }}
      >
        <Card sx={{ p: 3.5, borderRadius: '24px', backgroundColor: '#1A1715' }}>
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <InsightsRoundedIcon sx={{ color: '#FF8C2B' }} />
              <Box>
                <Typography variant="h6">7-Day Revenue Trend</Typography>
                <Typography color="text.secondary" sx={{ fontSize: 14 }}>
                  Daily revenue movement over the last seven days.
                </Typography>
              </Box>
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                gap: 1.5,
                alignItems: 'end',
                minHeight: 240,
              }}
            >
              {trendDays.map((point) => (
                <Stack key={point.key} spacing={1} alignItems="center" justifyContent="flex-end">
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                    {formatCurrency(point.revenue)}
                  </Typography>
                  <Box
                    sx={{
                      width: '100%',
                      maxWidth: 56,
                      height: point.height,
                      minHeight: 18,
                      borderRadius: '14px 14px 8px 8px',
                      background:
                        'linear-gradient(180deg, rgba(255,159,71,0.95) 0%, rgba(255,140,43,0.75) 100%)',
                      boxShadow: '0 18px 30px rgba(255,140,43,0.18)',
                    }}
                  />
                  <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{point.label}</Typography>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                    {point.orders} orders
                  </Typography>
                </Stack>
              ))}
            </Box>
          </Stack>
        </Card>

        <Card sx={{ p: 3.5, borderRadius: '24px', backgroundColor: '#1A1715' }}>
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <DonutLargeRoundedIcon sx={{ color: '#FF8C2B' }} />
              <Box>
                <Typography variant="h6">Status Breakdown</Typography>
                <Typography color="text.secondary" sx={{ fontSize: 14 }}>
                  Current mix of orders across the kitchen flow.
                </Typography>
              </Box>
            </Stack>

            <Stack spacing={1.5}>
              {statusBreakdown.map((status) => (
                <Stack key={status.label} spacing={0.75}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          backgroundColor: status.color,
                        }}
                      />
                      <Typography>{status.label}</Typography>
                    </Stack>
                    <Typography sx={{ color: 'text.secondary' }}>
                      {status.value} orders
                    </Typography>
                  </Stack>
                  <Box
                    sx={{
                      height: 10,
                      borderRadius: '999px',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        width: `${status.percent}%`,
                        minWidth: status.value ? 10 : 0,
                        height: '100%',
                        borderRadius: '999px',
                        backgroundColor: status.color,
                      }}
                    />
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Stack>
        </Card>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', xl: 'repeat(2, minmax(0, 1fr))' },
          gap: 3,
        }}
      >
        <Card sx={{ p: 3.5, borderRadius: '24px', backgroundColor: '#1A1715' }}>
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <LocalFireDepartmentRoundedIcon sx={{ color: '#FF8C2B' }} />
              <Box>
                <Typography variant="h6">Top-Selling Items</Typography>
                <Typography color="text.secondary" sx={{ fontSize: 14 }}>
                  Best performers based on quantity sold.
                </Typography>
              </Box>
            </Stack>

            <Stack spacing={1.5}>
              {topItems.length ? (
                topItems.map((item, index) => (
                  <Card
                    key={item.name}
                    sx={{
                      p: 2,
                      borderRadius: '16px',
                      backgroundColor: '#221F1C',
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={1.25} alignItems="center">
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '10px',
                            display: 'grid',
                            placeItems: 'center',
                            backgroundColor: 'rgba(255,140,43,0.12)',
                            color: '#FF8C2B',
                            fontWeight: 800,
                            fontSize: 13,
                          }}
                        >
                          {index + 1}
                        </Box>
                        <Box>
                          <Typography sx={{ fontWeight: 700 }}>{item.name}</Typography>
                          <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                            {item.quantity} sold
                          </Typography>
                        </Box>
                      </Stack>
                      <Typography sx={{ color: '#FF8C2B', fontWeight: 700 }}>
                        {formatCurrency(item.revenue)}
                      </Typography>
                    </Stack>
                  </Card>
                ))
              ) : (
                <Typography color="text.secondary">No item sales yet.</Typography>
              )}
            </Stack>
          </Stack>
        </Card>

        <Card sx={{ p: 3.5, borderRadius: '24px', backgroundColor: '#1A1715' }}>
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <TableRestaurantRoundedIcon sx={{ color: '#FF8C2B' }} />
              <Box>
                <Typography variant="h6">Busiest Tables</Typography>
                <Typography color="text.secondary" sx={{ fontSize: 14 }}>
                  Tables driving the most orders and revenue.
                </Typography>
              </Box>
            </Stack>

            <Stack spacing={1.5}>
              {busiestTables.length ? (
                busiestTables.map((table, index) => (
                  <Card
                    key={table.table}
                    sx={{
                      p: 2,
                      borderRadius: '16px',
                      backgroundColor: '#221F1C',
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={1.25} alignItems="center">
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '10px',
                            display: 'grid',
                            placeItems: 'center',
                            backgroundColor: 'rgba(59,130,246,0.12)',
                            color: '#60A5FA',
                            fontWeight: 800,
                            fontSize: 13,
                          }}
                        >
                          {index + 1}
                        </Box>
                        <Box>
                          <Typography sx={{ fontWeight: 700 }}>Table {table.table}</Typography>
                          <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                            {table.orders} orders
                          </Typography>
                        </Box>
                      </Stack>
                      <Typography sx={{ color: '#FF8C2B', fontWeight: 700 }}>
                        {formatCurrency(table.revenue)}
                      </Typography>
                    </Stack>
                  </Card>
                ))
              ) : (
                <Typography color="text.secondary">No table activity yet.</Typography>
              )}
            </Stack>
          </Stack>
        </Card>
      </Box>
    </Stack>
  );
}

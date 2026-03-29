import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getApiUrl } from '../config/api';

const AuthContext = createContext();

const getStoredAuth = () => {
  const token = localStorage.getItem('adminToken');
  const storedUser = localStorage.getItem('adminUser');
  const storedRestaurant = localStorage.getItem('restaurantProfile');

  if (!token || !storedUser) {
    return {
      token: null,
      user: null,
      restaurant: null,
    };
  }

  try {
    return {
      token,
      user: JSON.parse(storedUser),
      restaurant: storedRestaurant ? JSON.parse(storedRestaurant) : null,
    };
  } catch (error) {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('restaurantProfile');
    return {
      token: null,
      user: null,
      restaurant: null,
    };
  }
};

export const AuthProvider = ({ children }) => {
  const [{ token, user, restaurant }, setAuthState] = useState(getStoredAuth);

  const setRestaurantProfile = useCallback((nextRestaurant) => {
    if (nextRestaurant) {
      localStorage.setItem('restaurantProfile', JSON.stringify(nextRestaurant));
    } else {
      localStorage.removeItem('restaurantProfile');
    }

    setAuthState((current) => ({ ...current, restaurant: nextRestaurant }));
  }, []);

  const login = useCallback((payload) => {
    if (typeof payload === 'string') {
      const nextState = { token: payload, user: null, restaurant: null };
      localStorage.setItem('adminToken', payload);
      localStorage.removeItem('adminUser');
      localStorage.removeItem('restaurantProfile');
      setAuthState(nextState);
      return;
    }

    const nextToken = payload?.token || null;
    const nextUser = payload?.user || null;
    const nextRestaurant = payload?.restaurant || null;

    if (!nextToken) {
      return;
    }

    localStorage.setItem('adminToken', nextToken);
    localStorage.setItem('adminUser', JSON.stringify(nextUser));
    if (nextRestaurant) {
      localStorage.setItem('restaurantProfile', JSON.stringify(nextRestaurant));
    } else {
      localStorage.removeItem('restaurantProfile');
    }
    setAuthState({ token: nextToken, user: nextUser, restaurant: nextRestaurant });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('restaurantProfile');
    setAuthState({ token: null, user: null, restaurant: null });
  }, []);

  const refreshRestaurant = useCallback(async () => {
    if (!token || user?.role !== 'RESTAURANT_ADMIN') {
      return null;
    }

    try {
      const response = await fetch(getApiUrl('/api/restaurants/current'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const rawBody = await response.text();
      let data = {};

      try {
        data = rawBody ? JSON.parse(rawBody) : {};
      } catch (parseError) {
        data = { message: rawBody || 'Failed to load restaurant profile' };
      }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load restaurant profile');
      }

      setRestaurantProfile(data);
      return data;
    } catch (error) {
      console.error(error);
      return null;
    }
  }, [setRestaurantProfile, token, user?.role]);

  useEffect(() => {
    if (!token || user?.role !== 'RESTAURANT_ADMIN') {
      if (restaurant) {
        setRestaurantProfile(null);
      }
      return;
    }

    if (!restaurant) {
      refreshRestaurant();
    }
  }, [token, user?.role]);

  const value = useMemo(
    () => ({
      token,
      user,
      restaurant,
      role: user?.role || null,
      isAuthenticated: Boolean(token),
      login,
      logout,
      refreshRestaurant,
      setRestaurantProfile,
    }),
    [login, logout, refreshRestaurant, restaurant, setRestaurantProfile, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

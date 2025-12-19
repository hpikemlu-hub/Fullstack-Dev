/**
 * Token utility functions for consistent token management
 */

export const getToken = () => {
  // Try localStorage first, then sessionStorage
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

export const setToken = (token) => {
  // Store in both localStorage and sessionStorage for reliability
  localStorage.setItem('token', token);
  sessionStorage.setItem('token', token);
};

export const removeToken = () => {
  // Clear from both storages
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
};

export const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    return true; // If we can't parse the token, consider it expired
  }
};

export const getTokenPayload = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (error) {
    return null;
  }
};
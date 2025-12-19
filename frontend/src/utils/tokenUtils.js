/**
 * Token utility functions for consistent token management
 */

export const getToken = () => {
  // Try localStorage first, then sessionStorage
  const localToken = localStorage.getItem('token');
  const sessionToken = sessionStorage.getItem('token');
  console.log('getToken - localStorage token:', localToken ? localToken.substring(0, 20) + '...' : 'null');
  console.log('getToken - sessionStorage token:', sessionToken ? sessionToken.substring(0, 20) + '...' : 'null');
  const token = localToken || sessionToken;
  console.log('getToken - returning token:', token ? token.substring(0, 20) + '...' : 'null');
  return token;
};

export const setToken = (token) => {
  // Store in both localStorage and sessionStorage for reliability
  console.log('setToken - storing token:', token ? token.substring(0, 20) + '...' : 'null');
  localStorage.setItem('token', token);
  sessionStorage.setItem('token', token);
  console.log('setToken - token stored successfully');
};

export const removeToken = () => {
  // Clear from both storages
  console.log('removeToken - clearing tokens');
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
  console.log('removeToken - tokens cleared');
};

export const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    const isExpired = payload.exp < currentTime;
    console.log('isTokenExpired - token expires at:', new Date(payload.exp * 1000).toISOString());
    console.log('isTokenExpired - current time:', new Date(currentTime * 1000).toISOString());
    console.log('isTokenExpired - is expired:', isExpired);
    return isExpired;
  } catch (error) {
    console.error('isTokenExpired - error parsing token:', error);
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
// Authentication helper functions for the unified fullstack app

export interface SessionData {
  id: string;
  namaLengkap: string;
  nip?: string;
  golongan?: string;
  jabatan?: string;
  username: string;
  email?: string;
  role: 'ADMIN' | 'USER';
  isActive: boolean;
}

export function getUserSession(): SessionData | null {
  if (typeof window === 'undefined') return null;
  
  try {
    // Try to get from cookie first
    const cookies = document.cookie.split(';');
    const userCookie = cookies.find(c => c.trim().startsWith('user='));
    
    if (userCookie) {
      const userData = decodeURIComponent(userCookie.split('=')[1]);
      const sessionData = JSON.parse(userData);
      if (sessionData?.id && sessionData?.role) {
        return sessionData;
      }
    }
    
    // Fallback to localStorage
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      const sessionData = JSON.parse(currentUser);
      if (sessionData?.authenticated && sessionData?.user) {
        return sessionData.user;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user session:', error);
    return null;
  }
}

export function setUserSession(userData: SessionData): void {
  try {
    // Set cookie
    const cookieData = encodeURIComponent(JSON.stringify(userData));
    document.cookie = `user=${cookieData}; path=/; max-age=${7 * 24 * 60 * 60}`; // 7 days
    
    // Set localStorage as fallback
    localStorage.setItem('currentUser', JSON.stringify({
      authenticated: true,
      user: userData
    }));
  } catch (error) {
    console.error('Error setting user session:', error);
  }
}

export function clearUserSession(): void {
  try {
    // Clear cookie
    document.cookie = 'user=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    
    // Clear localStorage
    localStorage.removeItem('currentUser');
  } catch (error) {
    console.error('Error clearing user session:', error);
  }
}
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const CurrentUserRoleLogger = () => {
  const { userRole, loggedIn, userId } = useAuth();

  useEffect(() => {
    console.log('Checking user authentication status...');
    if (loggedIn) {
      if (userRole) {
        console.log('Current User ID:', userId);
        console.log('Current User Role:', userRole);
      } else {
        console.log('Current User Role: Fetching role...');
      }
    } else {
      console.log('No user logged in.');
    }
  }, [userRole, loggedIn, userId]);

  return null; // This component does not render anything
};

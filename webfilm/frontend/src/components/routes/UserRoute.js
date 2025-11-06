import React from 'react';
import UserPanel from '../UserPanel';

export default function UserRoute({ user, tickets, onUserUpdate }) {
  return (
    <UserPanel 
      user={user} 
      tickets={tickets} 
      onUserUpdate={onUserUpdate} 
    />
  );
}

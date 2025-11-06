import React from 'react';
import Foods from '../Foods';

export default function FoodsRoute({ addItem, user, onAuthRequired }) {
  return (
    <Foods 
      addItem={addItem} 
      user={user} 
      onAuthRequired={onAuthRequired} 
    />
  );
}

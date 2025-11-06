import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminPanel from '../AdminPanel';

export default function AdminRoute({ user }) {
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    if (user?.isAdmin) {
      setAllowed(true);
    } else {
      alert('Bạn không có quyền truy cập khu vực admin.');
      navigate('/');
    }
  }, [user, navigate]);

  if (!allowed) return null;

  return <AdminPanel />;
}



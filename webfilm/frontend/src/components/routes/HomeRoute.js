import React from 'react';
import Home from '../Home';

export default function HomeRoute({ movies, loading, onOpenMovie, onBookMovie }) {
  return (
    <Home 
      movies={movies} 
      loading={loading} 
      onOpenMovie={onOpenMovie} 
      onBookMovie={onBookMovie} 
    />
  );
}

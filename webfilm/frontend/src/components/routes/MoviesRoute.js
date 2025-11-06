import React from 'react';
import Movies from '../Movies';

export default function MoviesRoute({ movies, loading, onOpenMovie, onBookMovie }) {
  return (
    <Movies 
      movies={movies} 
      loading={loading} 
      onOpenMovie={onOpenMovie} 
      onBookMovie={onBookMovie} 
    />
  );
}

import './MovieGrid.css'; import MovieCard from './MovieCard';
export default function MovieGrid({ movies, onOpen }) {
  return <div className="grid grid-4">{movies.map(m=><MovieCard key={m.id} m={m} onOpen={()=>onOpen(m)} />)}</div>;
}

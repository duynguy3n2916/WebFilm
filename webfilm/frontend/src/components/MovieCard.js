import './MovieCard.css'; import { Chip, Button } from './UI';
export default function MovieCard({ m, onOpen, onBook }) {
  const tags = Array.isArray(m.tags) ? m.tags : JSON.parse(m.tags || '[]');
  
  return (
    <div className="card shadow mc">
      <div className="imgwrap">
        <img src={m.poster_url || m.poster} alt={m.title} />
        <div className="chips">{(m.is_hot || m.hot) && <Chip>🔥 Hot</Chip>}<Chip>{m.rating}★</Chip></div>
      </div>
      <div className="content">
        <div className="title line-clamp-1">{m.title}</div>
        <div className="meta"><span>{m.duration} phút</span><span>•</span><span>{tags.join(', ')}</span></div>
        <div className="actions">
          <Button onClick={() => onBook(m)} className="action-btn book-btn">Đặt vé</Button>
          <Button variant="white" onClick={() => onOpen(m)} className="action-btn detail-btn">Chi tiết</Button>
        </div>
      </div>
    </div>
  );
}

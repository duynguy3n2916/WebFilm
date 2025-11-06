import './UI.css';
export const Chip = ({ children }) => <span className="badge">{children}</span>;
export const Button = ({ children, onClick, variant = "primary", disabled }) => {
  const cls = variant==="primary" ? "btn btn-primary" : 
             variant==="outline" ? "btn btn-outline" : 
             variant==="white" ? "btn btn-white" : 
             variant==="login" ? "btn btn-login" :
             "btn btn-ghost";
  return <button className={cls} onClick={onClick} disabled={disabled}>{children}</button>;
};
export const H2 = ({ children }) => <h2 className="h2">{children}</h2>;

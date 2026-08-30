import { jsx } from 'frontend-hamroun';

export default function Header({ isSSR, isHydrated }) {
  return (
    <header>
      <h1>Frontend Hamroun + Go WebAssembly</h1>
      <p>A powerful combination for high-performance web applications</p>
      
      <div className="rendering-info">
        <span className={`badge ${isSSR ? 'active' : ''}`}>
          Server Rendered
        </span>
        <span className={`badge ${isHydrated ? 'active' : ''}`}>
          Hydrated
        </span>
      </div>
    </header>
  );
}

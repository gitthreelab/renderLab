// Fixture desechable del spike (autorizado por el humano en esta sesión).
// HijoB no recibe props ni usa memo: solo el React Compiler puede evitar su render.
import { useState } from 'react';

function HijoA({ count }: { count: number }) {
  return <p>HijoA: {count}</p>;
}

function HijoB() {
  return <p>HijoB: sin props</p>;
}

function Padre() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Sumar</button>
      <HijoA count={count} />
      <HijoB />
    </div>
  );
}

export default function App() {
  return <Padre />;
}

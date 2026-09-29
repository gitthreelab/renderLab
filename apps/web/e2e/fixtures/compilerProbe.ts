// Fixtures del e2e del React Compiler: sustituyen al App.tsx de la receta
// estado-compartido (el test intercepta el módulo ?raw que sirve Vite), así que
// la receta real no se toca. Equivalen al fixture del spike
// (spikes/react-compiler/fixture/App.tsx). Autorizados por el humano en T05e.

// HijoB no recibe props ni usa memo: solo el React Compiler puede evitar su render.
export const COMPILER_FIXTURE = `import { useState } from 'react';

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
`;

// 'use no memo' en cada componente: el compiler no compila nada. (En la
// versión 1.0.0, la directiva a nivel de módulo no excluye el fichero.)
export const OPT_OUT_FIXTURE = COMPILER_FIXTURE.replace(
  /^(?:export default )?function .*\{$/gm,
  "$&\n  'use no memo';",
);

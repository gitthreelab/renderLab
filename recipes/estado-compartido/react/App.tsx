import { createContext, use, useState, type ReactNode } from 'react';

// Estado compartido con Context. EstadoProvider guarda el estado y lo pasa a
// sus descendientes; cada componente lo lee con useEstado().
//
// Al pulsar "Sumar" cambia el valor del contexto, así que se re-renderizan
// EstadoProvider y todos los componentes que leen el contexto (Boton,
// VerContador y VerNombre), aunque VerNombre no use el contador. Estatico no
// lee el contexto y llega como children: no se re-renderiza.

type Estado = {
  contador: number;
  nombre: string;
  sumar: () => void;
};

const EstadoContext = createContext<Estado | null>(null);

function EstadoProvider({ children }: { children: ReactNode }) {
  const [contador, setContador] = useState(0);
  const [nombre] = useState('Ada');

  function sumar() {
    setContador((n) => n + 1);
  }

  return <EstadoContext value={{ contador, nombre, sumar }}>{children}</EstadoContext>;
}

function useEstado(): Estado {
  const estado = use(EstadoContext);
  if (!estado) throw new Error('useEstado debe usarse dentro de <EstadoProvider>');
  return estado;
}

function Boton() {
  const { sumar } = useEstado();
  return (
    <button type="button" onClick={sumar}>
      Sumar
    </button>
  );
}

function VerContador() {
  const { contador } = useEstado();
  return <p>Contador: {contador}</p>;
}

function VerNombre() {
  const { nombre } = useEstado();
  return <p>Nombre: {nombre}</p>;
}

function Estatico() {
  return <p>Soy estático</p>;
}

export default function App() {
  return (
    <EstadoProvider>
      <Boton />
      <VerContador />
      <VerNombre />
      <Estatico />
    </EstadoProvider>
  );
}

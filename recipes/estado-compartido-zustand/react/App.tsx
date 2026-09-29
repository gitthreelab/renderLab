import { useEstado } from './store';

// Estado compartido con Zustand. No hay provider: cada componente se suscribe
// al store con un selector que elige solo lo que usa.
//
// Al pulsar "Sumar" cambia contador. Solo VerContador tiene un selector que
// devuelve otro valor, así que es el único que se re-renderiza. sumar y nombre
// siguen siendo los mismos: Boton y VerNombre no se re-renderizan.

function Boton() {
  const sumar = useEstado((estado) => estado.sumar);
  return (
    <button type="button" onClick={sumar}>
      Sumar
    </button>
  );
}

function VerContador() {
  const contador = useEstado((estado) => estado.contador);
  return <p>Contador: {contador}</p>;
}

function VerNombre() {
  const nombre = useEstado((estado) => estado.nombre);
  return <p>Nombre: {nombre}</p>;
}

function Estatico() {
  return <p>Soy estático</p>;
}

export default function App() {
  return (
    <>
      <Boton />
      <VerContador />
      <VerNombre />
      <Estatico />
    </>
  );
}

import { create } from 'zustand';

// El store vive fuera de React: es un módulo con estado y acciones. Cada
// componente se suscribe con un selector y solo se re-renderiza cuando cambia
// lo que ese selector devuelve.

type Estado = {
  contador: number;
  nombre: string;
  sumar: () => void;
};

export const useEstado = create<Estado>()((set) => ({
  contador: 0,
  nombre: 'Ada',
  sumar: () => set((estado) => ({ contador: estado.contador + 1 })),
}));

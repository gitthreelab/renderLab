# Spike T01a: sonda React

## Pregunta
¿Podemos contar renders de React dentro de Sandpack
sin tocar el código de la receta?

## Resultado
Pendiente.

## Lo que he aprendido
- La sonda con bippy funciona fuera de Sandpack: sus números
  cuadran con mis console.log, con y sin memo.
- La sonda tiene que importarse antes que React.
- Los componentes necesitan nombre para que la sonda los
  identifique.
- Con StrictMode activo, los console.log salen duplicados pero la
  sonda sigue contando 1 por commit. Cumple la métrica.
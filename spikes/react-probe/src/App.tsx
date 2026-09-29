import { memo, useState } from 'react'

function HijoA({ count }: { count: number }) {
  console.log('render HijoA')
  return <p>Contador: {count}</p>
}
const HijoB = memo(function HijoB() {
  console.log('render HijoB')
  return <p>Yo no recibo nada</p>
})

function Padre() {
  console.log('render padre')
  const [count, setCount] = useState(0)
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}> Sumar</button>
      <HijoA count={count} />
      <HijoB />
    </div>
  )
}


export default function App() {
  return <Padre />
}

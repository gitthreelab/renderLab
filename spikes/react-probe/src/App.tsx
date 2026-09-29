import { Sandpack } from '@codesandbox/sandpack-react'
import appSource from './sandbox/App.tsx?raw'
import indexSource from './sandbox/index.tsx?raw'
import probeSource from './sandbox/probe.ts?raw'

export default function App() {
  return (
    <Sandpack
      template="react-ts"
      files={{
        '/App.tsx': { code: appSource, active: true },
        '/index.tsx': { code: indexSource, hidden: true },
        '/probe.ts': { code: probeSource, hidden: true },
      }}
      customSetup={{
        dependencies: {
          react: '19.2.8',
          'react-dom': '19.2.8',
          bippy: '0.7.3',
        },
      }}
      options={{
        showConsole: true,
        showConsoleButton: true,
      }}
    />
  )
}

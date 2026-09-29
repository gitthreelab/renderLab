import { Sandpack } from '@codesandbox/sandpack-react';
import { getReactFiles } from '../recipes/reactFiles';

type ReactSandboxProps = {
  slug: string;
};

export default function ReactSandbox({ slug }: ReactSandboxProps) {
  const files = getReactFiles(slug);

  if (!files) return <p>Esta receta todavía no tiene parte React.</p>;

  return (
    <Sandpack
      template="react-ts"
      files={files}
      customSetup={{ dependencies: { react: '19.2.8', 'react-dom': '19.2.8' } }}
      options={{ showConsole: true }}
    />
  );
}

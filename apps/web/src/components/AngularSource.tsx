import { Suspense, use } from 'react';
import { getAngularFiles } from '../recipes/angularFiles';
import styles from './AngularSource.module.css';

type SourceFilesProps = {
  slug: string;
};

function SourceFiles({ slug }: SourceFilesProps) {
  const files = use(getAngularFiles(slug));

  if (files.length === 0)
    return <p className={styles.empty}>Esta receta no tiene parte Angular.</p>;

  return files.map((file) => (
    <figure key={file.path} className={styles.file}>
      <figcaption className={styles.name}>angular/{file.path}</figcaption>
      <pre className={styles.code} tabIndex={0}>
        <code>{file.code}</code>
      </pre>
    </figure>
  ));
}

type AngularSourceProps = {
  slug: string;
  id: string;
};

/** Código Angular de la receta, en solo lectura (el iframe muestra la app compilada). */
export default function AngularSource({ slug, id }: AngularSourceProps) {
  return (
    <div id={id} className={styles.drawer}>
      <Suspense fallback={<p className={styles.empty}>Cargando código…</p>}>
        <SourceFiles slug={slug} />
      </Suspense>
    </div>
  );
}

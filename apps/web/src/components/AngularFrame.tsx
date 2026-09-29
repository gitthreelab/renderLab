import styles from './AngularFrame.module.css';

type AngularFrameProps = {
  slug: string;
  /** Título de la receta, para el título accesible del iframe. */
  title: string;
};

/** La receta Angular real, servida por ng-host bajo /ng/<slug> (dev: proxy; build: estático). */
export default function AngularFrame({ slug, title }: AngularFrameProps) {
  return <iframe className={styles.frame} src={`/ng/${slug}`} title={`Vista Angular: ${title}`} />;
}

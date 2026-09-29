type PageMetaProps = {
  title: string;
  description: string;
};

// React 19 eleva <title> y <meta> a <head> desde cualquier punto del árbol:
// reutiliza el <title> de index.html y añade la meta description de la página.
export default function PageMeta({ title, description }: PageMetaProps) {
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
    </>
  );
}

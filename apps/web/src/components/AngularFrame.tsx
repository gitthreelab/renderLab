type AngularFrameProps = {
  slug: string;
};

export default function AngularFrame({ slug }: AngularFrameProps) {
  return (
    <iframe
      src={`/ng/${slug}`}
      title="Versión Angular"
      style={{ width: '100%', height: 300, border: '1px solid #ccc' }}
    />
  );
}

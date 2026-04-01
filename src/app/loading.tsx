import VertexLoading from '@/components/ui/VertexLoading';

export default function RootLoading() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-md">
      <VertexLoading />
    </div>
  );
}

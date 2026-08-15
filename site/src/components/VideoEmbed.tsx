interface VideoEmbedProps {
  videoId: string;
  title: string;
}

export function VideoEmbed({ videoId, title }: VideoEmbedProps) {
  if (!videoId) {
    return (
      <div className="aspect-video w-full rounded-xl border border-border bg-surface flex items-center justify-center">
        <p className="text-muted font-mono text-sm">Video coming soon</p>
      </div>
    );
  }

  return (
    <div className="aspect-video w-full rounded-xl overflow-hidden border border-border">
      <iframe
        src={`https://drive.google.com/file/d/${videoId}/preview`}
        title={title}
        allow="autoplay"
        allowFullScreen
        className="w-full h-full"
      />
    </div>
  );
}

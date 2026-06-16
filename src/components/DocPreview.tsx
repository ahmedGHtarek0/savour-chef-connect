import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText } from "lucide-react";

export function DocPreview({ bucket, path, label }: { bucket: string; path: string | null; label: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!path) return;
    (async () => {
      const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 600);
      if (data?.signedUrl) setUrl(data.signedUrl);
    })();
  }, [bucket, path]);
  if (!path) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
        <FileText className="mb-1 h-4 w-4" />
        {label}
        <span className="mt-0.5 opacity-60">Missing</span>
      </div>
    );
  }
  return (
    <a href={url ?? "#"} target="_blank" rel="noreferrer" className="group block">
      <div className="aspect-[4/3] overflow-hidden rounded-md border border-border bg-muted">
        {url ? (
          <img src={url} alt={label} className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <FileText className="h-5 w-5" />
          </div>
        )}
      </div>
      <p className="mt-1 text-center text-xs text-muted-foreground">{label}</p>
    </a>
  );
}
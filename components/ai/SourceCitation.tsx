import { Badge } from "@/components/ui/badge";
import type { SourceCitation as SourceCitationType } from "@/lib/types";

type Props = {
  sources: SourceCitationType[];
};

export function SourceCitation({ sources }: Props) {
  if (!sources.length) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {sources.map((source, index) => (
        <Badge key={`${source.noteId}-${index}`} variant="secondary" className="text-xs font-normal">
          {source.noteTitle}
          {source.attachmentName ? ` · ${source.attachmentName}` : ""}
          {source.approxPage ? ` · p.${source.approxPage}` : ""}
        </Badge>
      ))}
    </div>
  );
}

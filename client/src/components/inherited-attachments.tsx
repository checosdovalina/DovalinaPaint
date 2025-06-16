import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Image, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size?: number;
}

interface InheritedAttachmentsProps {
  images?: Attachment[] | null;
  documents?: Attachment[] | null;
  title?: string;
}

export function InheritedAttachments({ 
  images, 
  documents, 
  title = "Project Attachments" 
}: InheritedAttachmentsProps) {
  const hasAttachments = (images && images.length > 0) || (documents && documents.length > 0);

  if (!hasAttachments) {
    return null;
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <FileText className="h-4 w-4" />
          {title}
          <Badge variant="secondary" className="ml-auto">
            Inherited from Project
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {images && images.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Image className="h-4 w-4" />
              Images ({images.length})
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {images.map((image) => (
                <div key={image.id} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => window.open(image.url, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                  <div className="mt-1">
                    <p className="text-xs font-medium truncate" title={image.name}>
                      {image.name}
                    </p>
                    {image.size && (
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(image.size)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {documents && documents.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents ({documents.length})
            </h4>
            <div className="space-y-2">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" title={document.name}>
                        {document.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{document.type}</span>
                        {document.size && (
                          <>
                            <span>•</span>
                            <span>{formatFileSize(document.size)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(document.url, '_blank')}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
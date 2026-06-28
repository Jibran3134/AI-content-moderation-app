'use client';
import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, ImagePlus } from 'lucide-react';

interface Preview {
  file: File;
  dataUrl: string;
}

export default function UploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [dragging, setDragging] = useState(false);

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
    const availableSlots = 10 - previews.length;
    if (availableSlots <= 0) return;
    const fresh = arr.slice(0, availableSlots);

    fresh.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews((prev) => {
          if (prev.some((p) => p.file === file)) return prev;
          return [...prev, { file, dataUrl: e.target?.result as string }];
        });
      };
      reader.readAsDataURL(file);
    });
  }, [previews]);

  const removePreview = (index: number) => {
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  const handleSubmit = async () => {
    if (previews.length === 0) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      previews.forEach((p) => formData.append('images', p.file));
      await api.post('/submissions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Submitted successfully! Images are being analyzed.');
      router.push('/submissions');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Upload failed';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Upload Images</h1>
        <p className="text-muted-foreground mt-1">
          Upload up to 10 images for AI content moderation analysis.
        </p>
      </div>

      {/* Drop zone */}
      <Card
        className={`border-2 border-dashed transition-colors cursor-pointer mb-6 ${
          dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Upload className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-base font-medium text-foreground">
            Drag & drop images here
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            or <span className="text-primary underline">browse files</span> · Images only · Max 10 files · 5 MB each
          </p>
        </CardContent>
      </Card>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && addFiles(e.target.files)}
      />

      {/* Previews */}
      {previews.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-foreground">
              {previews.length} image{previews.length > 1 ? 's' : ''} selected
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={previews.length >= 10}
            >
              <ImagePlus className="h-4 w-4 mr-1" /> Add more
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {previews.map((p, i) => (
              <div key={i} className="relative group">
                <img
                  src={p.dataUrl}
                  alt={p.file.name}
                  className="w-full h-28 object-cover rounded-md border border-border"
                />
                <button
                  className="absolute top-1 right-1 bg-black/70 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); removePreview(i); }}
                >
                  <X className="h-3 w-3 text-white" />
                </button>
                <p className="text-xs text-muted-foreground mt-1 truncate">{p.file.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          onClick={handleSubmit}
          disabled={previews.length === 0 || submitting}
          className="min-w-32"
        >
          {submitting ? 'Analyzing images…' : `Submit ${previews.length > 0 ? `(${previews.length})` : ''}`}
        </Button>
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={submitting}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

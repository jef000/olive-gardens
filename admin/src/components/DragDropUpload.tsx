import { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';

export default function DragDropUpload({ onFiles, multiple = true }: { onFiles: (files: File[]) => void; multiple?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const accept = (files: FileList | null) => {
    if (!files) return;
    const selected = Array.from(files).slice(0, multiple ? 10 : 1);
    const invalid = selected.find((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type));
    if (invalid) return;
    onFiles(selected);
  };
  return <div className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${dragging ? 'border-[#8b9172] bg-[#8b9172]/10' : 'border-gray-300'}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); accept(event.dataTransfer.files); }}><UploadCloud className="mx-auto h-8 w-8 text-gray-500" /><p className="mt-2 text-sm text-gray-600">Drop images here or <button type="button" className="underline" onClick={() => inputRef.current?.click()}>browse</button></p><input ref={inputRef} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" multiple={multiple} onChange={(event) => accept(event.target.files)} /></div>;
}

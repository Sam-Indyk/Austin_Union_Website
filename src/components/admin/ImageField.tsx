'use client';

import { useEffect, useRef, useState } from 'react';
import type { ImageRef } from '@/lib/content/types';

/**
 * Image upload with a live preview and a focal-point picker: click the part of
 * the photo that must stay visible when it is cropped (faces, a speaker…).
 */
export function ImageField({ value, aspect = 3 / 2, label = 'Picture', required }: { value: ImageRef | null; aspect?: number; label?: string; required?: boolean }) {
  const [preview, setPreview] = useState<string | null>(value?.src ?? null);
  const [focal, setFocal] = useState({ x: value?.focalX ?? 50, y: value?.focalY ?? 50 });
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
  }, [preview]);

  const pick = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setFocal({ x: 50, y: 50 });
  };

  return (
    <div className="image-field">
      <span className="ui-label">{label}</span>
      <div
        className={`image-field__drop${dragging ? ' is-drag' : ''}${preview ? ' has-image' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (input.current && e.dataTransfer.files.length) {
            input.current.files = e.dataTransfer.files;
            pick(e.dataTransfer.files);
          }
        }}
      >
        {preview ? (
          <>
            <div
              className="image-field__preview"
              style={{ aspectRatio: aspect }}
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setFocal({ x: Math.round(((e.clientX - r.left) / r.width) * 100), y: Math.round(((e.clientY - r.top) / r.height) * 100) });
              }}
              title="Click to set what stays in view when the picture is cropped"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- local preview of an upload */}
              <img src={preview} alt="" style={{ objectPosition: `${focal.x}% ${focal.y}%` }} />
              <span className="image-field__focus" style={{ left: `${focal.x}%`, top: `${focal.y}%` }} aria-hidden="true" />
            </div>
            <p className="ui-hint">Click the photo to choose what stays in view when it’s cropped.</p>
          </>
        ) : (
          <p className="image-field__empty">Drop a photo here, or choose one below.</p>
        )}
        <label className="ui-btn ui-btn--ghost ui-btn--small image-field__choose">
          {preview ? 'Replace photo' : 'Choose photo'}
          <input ref={input} type="file" name="image_file" accept="image/*" hidden onChange={(e) => pick(e.target.files)} required={required && !value} />
        </label>
      </div>
      {value && <input type="hidden" name="image_json" value={JSON.stringify(value)} />}
      <input type="hidden" name="focal_x" value={focal.x} />
      <input type="hidden" name="focal_y" value={focal.y} />
    </div>
  );
}

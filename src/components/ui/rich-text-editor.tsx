import { lazy, Suspense, type ReactElement } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { RichTextEditorProps } from './rich-text-editor.types';

const RichTextEditorLazy = lazy(async () => {
  const mod = await import('./rich-text-editor-impl');
  return { default: mod.RichTextEditorImpl };
});

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
  disabled = false,
}: RichTextEditorProps): ReactElement {
  return (
    <Suspense
      fallback={
        <div className={cn('border rounded-md p-4', className)}>
          <Skeleton className="h-24 w-full" />
        </div>
      }
    >
      <RichTextEditorLazy
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
      />
    </Suspense>
  );
}

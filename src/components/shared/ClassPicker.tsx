import { useState, useRef, useEffect } from 'react';
import type { WoWClass } from '../../types';
import { WOW_CLASSES, getClassDef } from '../../data/classes';
import { ChevronDown } from 'lucide-react';

interface ClassPickerProps {
  value: WoWClass;
  onChange: (c: WoWClass) => void;
}

export function ClassPicker({ value, onChange }: ClassPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cls = getClassDef(value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 8px',
          border: '1px solid var(--color-wow-border)',
          borderRadius: 4,
          background: 'var(--color-wow-dark)',
          color: cls.color,
          cursor: 'pointer',
          fontSize: 12,
          minWidth: 100,
        }}
      >
        <img src={cls.iconPath} alt="" style={{ width: 20, height: 20 }} />
        <span style={{ flex: 1, textAlign: 'left' }}>{cls.label}</span>
        <ChevronDown size={14} />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 2,
            background: 'var(--color-wow-panel)',
            border: '1px solid var(--color-wow-border)',
            borderRadius: 6,
            padding: 4,
            zIndex: 1000,
            maxHeight: 200,
            overflow: 'auto',
            minWidth: 140,
          }}
        >
          {WOW_CLASSES.map((c) => (
            <button
              key={c.key}
              onClick={() => {
                onChange(c.key);
                setOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '6px 8px',
                border: 'none',
                borderRadius: 4,
                background: c.key === value ? 'rgba(199,156,110,0.15)' : 'transparent',
                color: c.color,
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              <img src={c.iconPath} alt="" style={{ width: 22, height: 22 }} />
              {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

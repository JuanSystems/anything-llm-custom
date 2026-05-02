import { useRef, useState, useCallback } from "react";

// Module-level state — survives ALL React reconciliations
const STATE = new Map();
let _counter = 0;

export default function CollapsibleContent({ message, children }) {
  // Short messages never collapse
  if (message && message.length < 200) {
    return <div>{children}</div>;
  }

  // Generate a stable ID that NEVER changes across reconciliations
  // useRef preserves its value across re-renders of the same React component instance
  const idRef = useRef(null);
  if (!idRef.current) {
    idRef.current = `__cc_${_counter++}`;
  }

  // Lazy initializer — only runs once when the component first mounts
  const [expanded, setExpanded] = useState(() => {
    const entry = STATE.get(idRef.current);
    return entry ? entry.expanded : false;
  });

  const toggle = useCallback(() => {
    const key = idRef.current;
    const current = STATE.get(key) ?? { expanded: false };
    const next = { expanded: !current.expanded };
    STATE.set(key, next);
    setExpanded(next.expanded);
  }, []);

  return (
    <>
      <div
        className="overflow-hidden"
        style={{
          maxHeight: !expanded ? "300px" : "none",
        }}
      >
        {children}
      </div>
      <button
        type="button"
        onClick={toggle}
        className="self-end mt-1 text-xs text-white/60 light:text-slate-500 hover:text-white/90 light:hover:text-slate-800 transition-colors underline underline-offset-2"
      >
        {expanded ? "Mostrar menos" : "Mostrar más"}
      </button>
    </>
  );
}

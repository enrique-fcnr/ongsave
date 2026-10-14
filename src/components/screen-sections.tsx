"use client";
import {
  Children,
  cloneElement,
  Fragment,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Section = { id: string; label: string; content: ReactNode };

function flatten(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap((child) =>
    isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment
      ? flatten(child.props.children)
      : [child],
  );
}

export function FormSections({ children, labels }: { children: ReactNode; labels: string[] }) {
  if (labels.length === 1) return <div className="stack">{children}</div>;
  return (
    <ScreenSections
      sections={flatten(children).map((content, i) => ({
        id: `section-${i}`,
        label: labels[i] || `Etapa ${i + 1}`,
        content,
      }))}
    />
  );
}

// Panels stay mounted so switching sections never discards edits or map selection.
export function ScreenSections({
  sections,
  label = "Seções da página",
}: {
  sections: Section[];
  label?: string;
}) {
  const uid = useId();
  const [active, setActive] = useState(sections[0]?.id);
  const root = useRef<HTMLDivElement>(null);
  const sectionIds = sections.map((section) => section.id).join("|");
  useEffect(() => {
    const ids = sectionIds.split("|");
    const selectHash = () => {
      const hash = window.location.hash.slice(1);
      if (ids.includes(hash)) setActive(hash);
    };
    selectHash();
    window.addEventListener("hashchange", selectHash);
    return () => window.removeEventListener("hashchange", selectHash);
  }, [sectionIds]);
  const selected = sections.some((s) => s.id === active) ? active : sections[0]?.id;
  return (
    <div
      className="screen-sections"
      ref={root}
      onInvalidCapture={(e) => {
        const panel = [...(root.current?.children || [])].find(
          (child) => child.hasAttribute("data-screen-panel") && child.contains(e.target as Node),
        ) as HTMLElement | undefined;
        if (panel?.dataset.screenPanel) {
          e.preventDefault();
          setActive(panel.dataset.screenPanel);
          requestAnimationFrame(() => (e.target as HTMLElement).focus());
        }
      }}
    >
      <div className="section-tabs" role="tablist" aria-label={label}>
        {sections.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            id={`${uid}-tab-${s.id}`}
            aria-controls={`${uid}-panel-${s.id}`}
            aria-selected={selected === s.id}
            tabIndex={selected === s.id ? 0 : -1}
            onClick={() => setActive(s.id)}
            onKeyDown={(e) => {
              const index =
                e.key === "ArrowRight"
                  ? (i + 1) % sections.length
                  : e.key === "ArrowLeft"
                    ? (i - 1 + sections.length) % sections.length
                    : e.key === "Home"
                      ? 0
                      : e.key === "End"
                        ? sections.length - 1
                        : -1;
              if (index < 0) return;
              e.preventDefault();
              setActive(sections[index].id);
              root.current?.firstElementChild
                ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
                [index]?.focus();
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
      {sections.map((s) => (
        <div
          key={s.id}
          id={`${uid}-panel-${s.id}`}
          role="tabpanel"
          aria-labelledby={`${uid}-tab-${s.id}`}
          data-screen-panel={s.id}
          className="screen-panel stack"
          hidden={selected !== s.id}
          tabIndex={0}
        >
          {s.content}
        </div>
      ))}
    </div>
  );
}

export function PagedItems({
  children,
  className,
  pageSize = 3,
  mobilePageSize = 1,
  label = "Itens",
  tableHeaders,
}: {
  children: ReactNode;
  className?: string;
  pageSize?: number;
  mobilePageSize?: number;
  label?: string;
  tableHeaders?: string[];
}) {
  const items = Children.toArray(children);
  const [mobile, setMobile] = useState(false);
  const [compact, setCompact] = useState(false);
  const [page, setPage] = useState(0);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const height = window.matchMedia("(max-height: 740px)");
    const update = () => {
      setMobile(query.matches);
      setCompact(height.matches);
    };
    update();
    query.addEventListener("change", update);
    height.addEventListener("change", update);
    return () => {
      query.removeEventListener("change", update);
      height.removeEventListener("change", update);
    };
  }, []);
  const size = mobile ? (compact ? 1 : mobilePageSize) : compact ? Math.min(2, pageSize) : pageSize;
  const pages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(page, pages - 1);
  return (
    <div
      className="paged-items stack"
      onInvalidCapture={(e) => {
        const item = (e.target as HTMLElement).closest<HTMLElement>("[data-page-item]");
        if (!item) return;
        e.preventDefault();
        setPage(Math.floor(Number(item.dataset.pageItem) / size));
        requestAnimationFrame(() => (e.target as HTMLElement).focus());
      }}
    >
      {tableHeaders ? (
        <div className="scroll-x">
          <table className="report-table">
            <thead>
              <tr>
                {tableHeaders.map((heading) => (
                  <th key={heading}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) =>
                isValidElement<{ hidden?: boolean }>(item)
                  ? cloneElement(item, { hidden: Math.floor(i / size) !== current })
                  : item,
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={className ?? "paged-content"}>
          {items.map((item, i) => (
            <div
              className="paged-item"
              key={i}
              data-page-item={i}
              hidden={Math.floor(i / size) !== current}
            >
              {item}
            </div>
          ))}
        </div>
      )}
      {pages > 1 && (
        <nav className="pagination" aria-label={`Paginação: ${label}`}>
          <button
            type="button"
            disabled={current === 0}
            aria-label={`Página anterior: ${label}`}
            onClick={() => setPage(current - 1)}
          >
            <ChevronLeft size={17} /> Anterior
          </button>
          <span className="small muted" role="status">
            {current + 1} de {pages}
          </span>
          <button
            type="button"
            disabled={current === pages - 1}
            aria-label={`Próxima página: ${label}`}
            onClick={() => setPage(current + 1)}
          >
            Próxima <ChevronRight size={17} />
          </button>
        </nav>
      )}
    </div>
  );
}

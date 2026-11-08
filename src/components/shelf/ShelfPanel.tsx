"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { WORK_TITLE } from "@/components/sections/SelectedWork";
import { TOOLS_TITLE } from "@/components/sections/Tools";
import { SHELF_BOOKS } from "@/config/shelf";
import { GITHUB } from "@/data/contact";
import { stack, type Tool } from "@/data/tools";
import { work } from "@/data/work";
import { shelfPanel } from "./panelState";

const TITLE_ID = "shelf-panel-title";

// The stack by group, as the "Daily drivers" section shows it, with the book's tool in lime.
function Stack({ marked }: { marked: Tool | null }) {
  return (
    <dl className="m-0 border-t border-rule">
      {stack.map((group) => (
        <div
          key={group.label}
          className="flex flex-wrap gap-x-8 gap-y-2 border-b border-rule py-4"
        >
          <dt className="label flex-[0_0_150px] pt-1 text-dim">
            {group.label}
          </dt>
          <dd className="m-0 flex min-w-0 flex-[1_1_240px] flex-wrap gap-x-4 gap-y-1 text-[22px] leading-[1.2] font-semibold tracking-[-0.02em]">
            {group.items.map((item) => (
              <span
                key={item}
                aria-current={item === marked ? "true" : undefined}
                className={item === marked ? "text-lime" : undefined}
              >
                {item}
              </span>
            ))}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// The projects, as "Live in production" lists them, as compact rows.
function Projects() {
  return (
    <ul className="m-0 list-none border-t border-rule p-0">
      {work.map((item) => (
        <li key={item.title} className="border-b border-rule py-5">
          <div className="font-mono text-[13px] text-dim">{item.years}</div>
          <h4 className="mt-1 mb-0 text-[26px] leading-[1.05] font-bold tracking-[-0.03em]">
            {item.title}
          </h4>
          <p className="mt-2 mb-0 text-[15px] leading-normal text-pretty text-dim">
            {item.description}
          </p>
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block border-b border-lime pb-0.5 font-mono text-[13px] tracking-[0.02em] whitespace-pre text-lime"
          >
            {item.site}
          </a>
        </li>
      ))}
    </ul>
  );
}

// The panel a shelf book opens (ShelfObjects): an HTML dialog over the canvas, not part of the
// scene, in the portfolio's design. A modal <dialog> sits in the top layer, keeps focus inside it and
// makes the page behind it inert; Escape, the close button or a click outside it closes it, and focus
// goes back to where it was. The page does not scroll meanwhile (globals.css, html[data-panel-open]),
// so the camera and the pinned hero stay where they are.
//
// The objects only take the mouse, so keyboard users get a button for the panel and a link to the
// GitHub profile (what the figurine opens); they stay hidden until focused, and exist only in 3D
// mode: in the static page the same content is in #content.
export function ShelfPanel() {
  const panel = useSyncExternalStore(
    shelfPanel.subscribe,
    shelfPanel.get,
    () => null,
  );
  const dialog = useRef<HTMLDialogElement>(null);
  const returnTo = useRef<Element | null>(null);

  useEffect(() => {
    const el = dialog.current;
    if (!el) {
      return;
    }
    if (panel && !el.open) {
      returnTo.current = document.activeElement;
      document.documentElement.dataset.panelOpen = "";
      el.showModal();
    } else if (!panel && el.open) {
      el.close();
    }
  }, [panel]);

  // Escape closes the dialog at once, but its close event comes a task later: clear the state on
  // cancel too, so a click straight after Escape already reaches the scene.
  const release = () => {
    delete document.documentElement.dataset.panelOpen;
    shelfPanel.close();
  };
  const onClose = () => {
    release();
    const back = returnTo.current;
    returnTo.current = null;
    if (back instanceof HTMLElement && back.isConnected) {
      back.focus({ preventScroll: true });
    }
  };

  const book = panel?.book == null ? null : SHELF_BOOKS[panel.book];
  const launch =
    "sr-only rounded-full bg-lime px-4 py-2 font-mono text-[13px] text-ink uppercase focus-visible:not-sr-only";

  return (
    <>
      <div className="shelf-launch fixed left-4 top-16 z-20 flex-col gap-2">
        <button
          type="button"
          className={launch}
          onClick={() => shelfPanel.open({ book: null })}
        >
          {TOOLS_TITLE}
        </button>
        <a
          href={GITHUB.href}
          target="_blank"
          rel="noopener noreferrer"
          className={launch}
        >
          {GITHUB.label}
        </a>
      </div>
      <dialog
        ref={dialog}
        aria-labelledby={TITLE_ID}
        onCancel={release}
        onClose={onClose}
        onClick={(event) => {
          // the dialog has no padding of its own: a click on it is a click on the backdrop
          if (event.target === event.currentTarget) {
            event.currentTarget.close();
            release();
          }
        }}
        className="shelf-panel folio m-auto max-h-[min(85dvh,46rem)] w-[min(92vw,40rem)] overflow-y-auto overscroll-contain border border-rule p-0 shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
      >
        <div className="relative px-6 pt-8 pb-10 md:px-9">
          <div className="flex items-start justify-between gap-6">
            <div>
              {book && (
                <p className="label m-0 text-dim">{book.tool ?? book.spine}</p>
              )}
              <h2
                id={TITLE_ID}
                className="mt-2 mb-0 text-[44px] leading-[0.92] font-extrabold tracking-[-0.045em] uppercase"
              >
                {TOOLS_TITLE}
              </h2>
            </div>
            <form method="dialog" onSubmit={release}>
              <button
                type="submit"
                aria-label="Close"
                className="flex size-11 items-center justify-center rounded-full border border-faint text-xl leading-none transition-colors hover:border-lime hover:text-lime"
              >
                <span aria-hidden="true">×</span>
              </button>
            </form>
          </div>
          <div className="mt-8">
            <Stack marked={book?.tool ?? null} />
          </div>
          <h3 className="mt-12 mb-5 text-[28px] leading-none font-extrabold tracking-[-0.04em] uppercase">
            {WORK_TITLE}
          </h3>
          <Projects />
        </div>
      </dialog>
    </>
  );
}

"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { CONTACT_TITLE, ContactList } from "@/components/sections/Contact";
import {
  EXPERIENCE_TITLE,
  ExperienceList,
} from "@/components/sections/Experience";
import { WORK_TITLE, WorkList } from "@/components/sections/SelectedWork";
import { TOOLS_TITLE, ToolList } from "@/components/sections/Tools";
import { SHELF_BOOKS } from "@/config/shelf";
import { about } from "@/data/about";
import { type ShelfPanelId, shelfPanel } from "./panelState";

const TITLE_ID = "shelf-panel-title";

function Subheading({ children }: { children: string }) {
  return (
    <h3 className="mb-4 mt-10 text-sm font-semibold uppercase tracking-[0.14em] text-muted">
      {children}
    </h3>
  );
}

function ToolsPanel({ book }: { book: number | null }) {
  return (
    <>
      <h2 id={TITLE_ID} className="mb-6 text-2xl font-semibold tracking-tight">
        {TOOLS_TITLE}
      </h2>
      <ToolList marked={book === null ? null : SHELF_BOOKS[book]?.tool} />
      <Subheading>{WORK_TITLE}</Subheading>
      <WorkList compact />
    </>
  );
}

function AboutPanel() {
  return (
    <>
      <h2 id={TITLE_ID} className="text-2xl font-semibold tracking-tight">
        {about.name}
      </h2>
      <p className="mt-2 text-muted">{about.tagline}</p>
      {about.bio ? (
        <p className="mt-6 max-w-prose">{about.bio}</p>
      ) : (
        <p className="mt-6 rounded-card border border-dashed border-lamp/60 px-4 py-3 text-sm text-lamp">
          [Placeholder: bio not written yet. Add it to src/data/about.ts.]
        </p>
      )}
      <Subheading>{EXPERIENCE_TITLE}</Subheading>
      <ExperienceList compact />
      <Subheading>{CONTACT_TITLE}</Subheading>
      <ContactList inline />
    </>
  );
}

function PanelBody({ panel }: { panel: ShelfPanelId }) {
  return panel.kind === "tools" ? (
    <ToolsPanel book={panel.book} />
  ) : (
    <AboutPanel />
  );
}

// The panels the shelf's objects open (ShelfObjects): an HTML dialog over the canvas, not part of the
// scene. A modal <dialog> sits in the top layer, keeps focus inside it and makes the page behind it
// inert; Escape, the close button or a click outside it closes it, and focus goes back to where it
// was. The page does not scroll meanwhile (globals.css, html[data-panel-open]), so the camera and the
// pinned hero stay where they are.
//
// The objects only take the mouse, so keyboard users get a button for each panel; they stay hidden
// until focused, and exist only in 3D mode: in the static page the same content is in #content.
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

  return (
    <>
      <div className="shelf-launch fixed left-4 top-16 z-20 flex-col gap-2">
        <button
          type="button"
          className="sr-only rounded-card bg-card px-3 py-2 text-sm text-fg focus-visible:not-sr-only"
          onClick={() => shelfPanel.open({ kind: "tools", book: null })}
        >
          {TOOLS_TITLE}
        </button>
        <button
          type="button"
          className="sr-only rounded-card bg-card px-3 py-2 text-sm text-fg focus-visible:not-sr-only"
          onClick={() => shelfPanel.open({ kind: "about" })}
        >
          {about.name}
        </button>
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
        className="shelf-panel m-auto max-h-[min(85dvh,46rem)] w-[min(92vw,36rem)] overflow-y-auto overscroll-contain rounded-card border border-line bg-bg p-0 text-fg shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
      >
        <div className="relative px-6 pb-8 pt-12 md:px-8">
          <form
            method="dialog"
            onSubmit={release}
            className="absolute right-3 top-3"
          >
            <button
              type="submit"
              aria-label="Close"
              className="flex size-9 items-center justify-center rounded-full text-xl leading-none text-muted transition-colors hover:bg-line hover:text-fg"
            >
              <span aria-hidden="true">×</span>
            </button>
          </form>
          {panel && <PanelBody panel={panel} />}
        </div>
      </dialog>
    </>
  );
}

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Matrix3, MathUtils, type Object3D, Vector3 } from "three";
import { shelfPanel } from "@/components/shelf/panelState";
import { motionScale } from "./motionState";
import { type SceneTarget, useSceneTarget } from "./ScenePointer";

// How far a shelf object rises while the pointer is over it (or while its panel is open), in metres.
// The camera sits just below the shelf top, so their bases stay hidden behind the shelf's front edge
// and a book seems to be drawn up out of the row.
const LIFT = { book: 0.014, figurine: 0.008 };

const BOOK = /^book_(\d+)$/;

type Lifted = { base: Vector3; up: Vector3; level: number };

// The world's up direction in an object's own space (its parent's, really): the compressed models carry
// a scale on each node, so a world-space lift has to be turned into it.
function localUp(object: Object3D) {
  const up = new Vector3(0, 1, 0);
  if (object.parent) {
    object.parent.updateWorldMatrix(true, false);
    up.applyMatrix3(
      new Matrix3().setFromMatrix4(object.parent.matrixWorld).invert(),
    );
  }
  return up;
}

// The books and the figurine on the shelf. Each book opens the tools panel with its tool marked; the
// figurine opens the About panel (ShelfPanel shows them). Hovering one lifts it a little.
export function ShelfObjects() {
  const lifted = useRef(new Map<Object3D, Lifted>());
  const hovered = useRef<{ object: Object3D; lift: number } | null>(null);
  const opened = useRef<{ object: Object3D; lift: number } | null>(null);

  const books = useMemo<SceneTarget>(
    () => ({
      root: "books",
      part: (hit) => {
        let object: Object3D | null = hit;
        while (object && !BOOK.test(object.name)) {
          object = object.parent;
        }
        return object;
      },
      onHover: (part) => {
        hovered.current = part && { object: part, lift: LIFT.book };
      },
      onActivate: (part) => {
        opened.current = { object: part, lift: LIFT.book };
        shelfPanel.open({
          kind: "tools",
          book: Number(BOOK.exec(part.name)?.[1]),
        });
      },
    }),
    [],
  );
  const figurine = useMemo<SceneTarget>(
    () => ({
      root: "figurine",
      onHover: (part) => {
        hovered.current = part && { object: part, lift: LIFT.figurine };
      },
      onActivate: (part) => {
        opened.current = { object: part, lift: LIFT.figurine };
        shelfPanel.open({ kind: "about" });
      },
    }),
    [],
  );
  useSceneTarget(books);
  useSceneTarget(figurine);

  useFrame((_, delta) => {
    if (opened.current && shelfPanel.get() === null) {
      opened.current = null;
    }
    const raise = [hovered.current, opened.current];
    for (const want of raise) {
      if (want && !lifted.current.has(want.object)) {
        lifted.current.set(want.object, {
          base: want.object.position.clone(),
          up: localUp(want.object),
          level: 0,
        });
      }
    }
    lifted.current.forEach((state, object) => {
      const target = raise.find((want) => want?.object === object)?.lift ?? 0;
      state.level =
        motionScale.value > 0
          ? MathUtils.damp(state.level, target, 16, delta)
          : target;
      object.position.copy(state.base).addScaledVector(state.up, state.level);
    });
  });

  return null;
}

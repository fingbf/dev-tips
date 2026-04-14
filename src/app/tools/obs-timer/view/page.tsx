import type { Metadata } from "next";
import { Suspense } from "react";
import { OBSTimerView } from "./obs-timer-view";

export const metadata: Metadata = {
  title: "OBS Timer",
  robots: "noindex",
};

export default function OBSTimerViewPage() {
  return (
    <Suspense>
      <OBSTimerView />
    </Suspense>
  );
}

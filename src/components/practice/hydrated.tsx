"use client";

import { useEffect } from "react";

/** Đánh dấu app Sổ Khách đã hydrate xong để page.goto() của pw-lite biết lúc nào thao tác được. */
export function HydratedMark() {
  useEffect(() => {
    document.body.dataset.hydrated = "1";
  }, []);
  return null;
}

"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import WorkspacePage from "@/app/platform/workspace/page";

export default function ProjectByIdPage() {
  const params = useParams();
  const id = decodeURIComponent(params.id as string);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("project") !== id) {
      url.searchParams.set("project", id);
      window.history.replaceState({}, "", url.toString());
    }
    setReady(true);
  }, [id]);

  if (!ready) return null;
  return <WorkspacePage />;
}

"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProjectByIdPage() {
  const params = useParams();
  const router = useRouter();
  const id = decodeURIComponent(params.id as string);

  useEffect(() => {
    router.replace(`/platform/workspace?project=${encodeURIComponent(id)}`);
  }, [id, router]);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#9AA0A6" }}>
      Loading project...
    </div>
  );
}

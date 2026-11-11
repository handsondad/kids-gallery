import { useEffect, useState } from "react";
import { WallPage } from "./pages/WallPage.tsx";
import { WorkPage } from "./pages/WorkPage.tsx";
import { workById } from "./works/index.ts";

type Route = { page: "wall" } | { page: "work"; id: string };

function parseRoute(hash: string): Route {
  const [, page, param] = hash.replace(/^#/, "").split("/");
  if (page === "work" && param && workById(param)) return { page: "work", id: param };
  return { page: "wall" };
}

export default function App() {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash));
  useEffect(() => {
    const onHash = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  useEffect(() => { window.scrollTo(0, 0); }, [route]);

  if (route.page === "work") {
    const work = workById(route.id);
    if (work) return <WorkPage work={work} />;
  }
  return <WallPage />;
}

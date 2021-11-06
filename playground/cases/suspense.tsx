import * as React from "react";
import { useTrackRender } from "../helpers";
import { TestCase } from "../types";

export default {
  title: "Using suspense",
  Root,
} as TestCase;

function Root() {
  useTrackRender();

  return (
    <React.Suspense fallback={<Spinner />}>
      <LazyContent />
    </React.Suspense>
  );
}

const LazyContent = React.lazy(() => Promise.resolve({ default: Content }));
function Content() {
  useTrackRender();

  return (
    <React.Suspense fallback={<Spinner />}>
      <LazyContent2 />
    </React.Suspense>
  );
}

const LazyContent2 = React.lazy(() => Promise.resolve({ default: Content2 }));
function Content2() {
  useTrackRender();

  return <>OK</>;
}

function Spinner() {
  useTrackRender();

  return <>Loading...</>;
}

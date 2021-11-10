import React from "../react";
import { TestCase } from "../types";

export default {
  title: "Using suspense",
  Root,
} as TestCase;

function Root() {
  return (
    <React.Suspense fallback={<Spinner />}>
      <LazyContent />
    </React.Suspense>
  );
}

const LazyContent = React.lazy(() => Promise.resolve({ default: Content }));
function Content() {
  return (
    <React.Suspense fallback={<Spinner />}>
      <LazyContent2 />
    </React.Suspense>
  );
}

const LazyContent2 = React.lazy(() => Promise.resolve({ default: Content2 }));
function Content2() {
  return <>OK</>;
}

function Spinner() {
  return <>Loading...</>;
}

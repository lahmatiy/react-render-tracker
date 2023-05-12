import * as React from "react";
import { useReactRenderers } from "../../utils/react-renderers";
import { RendererBundleType } from "common-types";

const fullyFunctional = "Fully functional";
const partiallyFunctional =
  "Partially functional due to lack of some internals in this type of React bundle which are necessary for the full capturing of data";
const bundleTypeInfo: Record<
  RendererBundleType,
  { abbr: string; description: string }
> = {
  development: { abbr: "dev", description: fullyFunctional },
  production: {
    abbr: "prod",
    description: partiallyFunctional,
  },
  profiling: { abbr: "prof", description: partiallyFunctional },
  unknown: { abbr: "unknown", description: "" },
};

export function Renderer() {
  const { selected: currentRenderer } = useReactRenderers();

  if (!currentRenderer) {
    return null;
  }

  return (
    <div
      className="renderer-info"
      title={`${currentRenderer.name} v${currentRenderer.version}`}
    >
      <span
        className="renderer-info__type"
        data-type={currentRenderer.bundleType}
        title={`${currentRenderer.bundleType.replace(/^./, m =>
          m.toLocaleUpperCase()
        )} React bundle\n\n${
          bundleTypeInfo[currentRenderer.bundleType].description
        }`}
      >
        {bundleTypeInfo[currentRenderer.bundleType].abbr}
      </span>
      <span className="renderer-info__name">{currentRenderer.name}</span>
      <span className="renderer-info__version">
        <span>{currentRenderer.version}</span>
      </span>
    </div>
  );
}

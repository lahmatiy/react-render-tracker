import * as React from "react";
import { useReactRenderers } from "../../utils/react-renderers";

export default function WaitingForRenderer() {
  const { selected: selectedReactInstance, unsupportedRenderers } =
    useReactRenderers();

  if (selectedReactInstance) {
    return null;
  }

  return (
    <div className="waiting-for-renderer">
      Waiting for a supported React renderer to be connected...
      {!unsupportedRenderers.length ? null : (
        <div className="unsupported-renderers">
          <div>Detected unsupported renderers:</div>
          <ul className="unsupported-renderers__list">
            {unsupportedRenderers.map(info => (
              <li key={info.id}>
                <b>
                  {info.name} v{info.version}
                </b>
                {" – "}
                {info.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

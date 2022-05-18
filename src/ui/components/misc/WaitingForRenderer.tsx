import * as React from "react";
import { useReactRenderers } from "../../utils/react-renderers";

export default function WaitingForRenderer() {
  const { selected: selectedReactInstance } = useReactRenderers();

  if (selectedReactInstance) {
    return null;
  }

  return (
    <div className="waiting-for-renderer">
      Waiting for a React renderer to be connected...
    </div>
  );
}

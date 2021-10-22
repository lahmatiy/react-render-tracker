import * as React from "react";
import { MessageFiber } from "../../../types";
import { useProviderCustomers } from "../../../utils/fiber-maps";
import { FiberInfoSection } from "./FiberInfoSection";

export function FiberInfoSectionConsumers({ fiber }: { fiber: MessageFiber }) {
  const fibers = useProviderCustomers(fiber.id);

  return (
    <FiberInfoSection header="Consumers">
      <>{fibers.length}</>
    </FiberInfoSection>
  );
}

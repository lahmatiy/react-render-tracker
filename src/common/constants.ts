export const ElementTypeClass = 1;
export const ElementTypeFunction = 2;
export const ElementTypeMemo = 3;
export const ElementTypeForwardRef = 4;
export const ElementTypeProvider = 5;
export const ElementTypeConsumer = 6;
export const ElementTypeHostRoot = 7;
export const ElementTypeHostComponent = 8;
export const ElementTypeSuspense = 9;
export const ElementTypeSuspenseList = 10;
export const ElementTypeProfiler = 11;
export const ElementTypeOtherOrUnknown = 12;

export const fiberTypeName = {
  [ElementTypeClass]: "Class component",
  [ElementTypeFunction]: "Function component",
  [ElementTypeMemo]: "Memo",
  [ElementTypeForwardRef]: "ForwardRef",
  [ElementTypeProvider]: "Provider",
  [ElementTypeConsumer]: "Consumer",
  [ElementTypeHostRoot]: "Render root",
  [ElementTypeHostComponent]: "Host component",
  [ElementTypeSuspense]: "Suspense",
  [ElementTypeSuspenseList]: "Suspense list",
  [ElementTypeProfiler]: "Profiler",
  [ElementTypeOtherOrUnknown]: "Unknown",
};

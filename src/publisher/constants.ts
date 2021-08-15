export const ElementTypeClass = 1;
export const ElementTypeContext = 2;
export const ElementTypeFunction = 5;
export const ElementTypeForwardRef = 6;
export const ElementTypeHostComponent = 7;
export const ElementTypeMemo = 8;
export const ElementTypeOtherOrUnknown = 9;
export const ElementTypeProfiler = 10;
export const ElementTypeRoot = 11;
export const ElementTypeSuspense = 12;
export const ElementTypeSuspenseList = 13;

export const FunctionComponent = 0;
export const ClassComponent = 1;
export const IndeterminateComponent = 2; // Before we know whether it is function or class
export const HostRoot = 3; // Root of a host tree. Could be nested inside another node.
export const HostPortal = 4; // A subtree. Could be an entry point to a different renderer.
export const HostComponent = 5;
export const HostText = 6;
export const Fragment = 7;
export const Mode = 8;
export const ContextConsumer = 9;
export const ContextProvider = 10;
export const ForwardRef = 11;
export const Profiler = 12;
export const SuspenseComponent = 13;
export const MemoComponent = 14;
export const SimpleMemoComponent = 15;
export const LazyComponent = 16;
export const IncompleteClassComponent = 17;
export const DehydratedFragment = 18;
export const SuspenseListComponent = 19;
export const ScopeComponent = 21;
export const OffscreenComponent = 22;
export const LegacyHiddenComponent = 23;
export const CacheComponent = 24;

export const CONCURRENT_MODE_NUMBER = 0xeacf;
export const CONCURRENT_MODE_SYMBOL_STRING = "Symbol(react.concurrent_mode)";

export const CONTEXT_NUMBER = 0xeace;
export const CONTEXT_SYMBOL_STRING = "Symbol(react.context)";

export const DEPRECATED_ASYNC_MODE_SYMBOL_STRING = "Symbol(react.async_mode)";

export const ELEMENT_NUMBER = 0xeac7;
export const ELEMENT_SYMBOL_STRING = "Symbol(react.element)";

export const DEBUG_TRACING_MODE_NUMBER = 0xeae1;
export const DEBUG_TRACING_MODE_SYMBOL_STRING =
  "Symbol(react.debug_trace_mode)";

export const FORWARD_REF_NUMBER = 0xead0;
export const FORWARD_REF_SYMBOL_STRING = "Symbol(react.forward_ref)";

export const FRAGMENT_NUMBER = 0xeacb;
export const FRAGMENT_SYMBOL_STRING = "Symbol(react.fragment)";

export const LAZY_NUMBER = 0xead4;
export const LAZY_SYMBOL_STRING = "Symbol(react.lazy)";

export const MEMO_NUMBER = 0xead3;
export const MEMO_SYMBOL_STRING = "Symbol(react.memo)";

export const OPAQUE_ID_NUMBER = 0xeae0;
export const OPAQUE_ID_SYMBOL_STRING = "Symbol(react.opaque.id)";

export const PORTAL_NUMBER = 0xeaca;
export const PORTAL_SYMBOL_STRING = "Symbol(react.portal)";

export const PROFILER_NUMBER = 0xead2;
export const PROFILER_SYMBOL_STRING = "Symbol(react.profiler)";

export const PROVIDER_NUMBER = 0xeacd;
export const PROVIDER_SYMBOL_STRING = "Symbol(react.provider)";

export const SCOPE_NUMBER = 0xead7;
export const SCOPE_SYMBOL_STRING = "Symbol(react.scope)";

export const STRICT_MODE_NUMBER = 0xeacc;
export const STRICT_MODE_SYMBOL_STRING = "Symbol(react.strict_mode)";

export const SUSPENSE_NUMBER = 0xead1;
export const SUSPENSE_SYMBOL_STRING = "Symbol(react.suspense)";

export const SUSPENSE_LIST_NUMBER = 0xead8;
export const SUSPENSE_LIST_SYMBOL_STRING = "Symbol(react.suspense_list)";

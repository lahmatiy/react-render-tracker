var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// playground/react.tsx
var react_default;
var init_react = __esm({
  "playground/react.tsx"() {
    react_default = window.React;
  }
});

// playground/cases/class-component.tsx
var class_component_exports = {};
__export(class_component_exports, {
  default: () => class_component_default
});
function Root() {
  const [, setState] = react_default.useState(0);
  return /* @__PURE__ */ react_default.createElement(react_default.Fragment, null, /* @__PURE__ */ react_default.createElement(ClassComponent, {
    value: "OK"
  }), /* @__PURE__ */ react_default.createElement(MemoClassComponent, {
    value: "OK"
  }), /* @__PURE__ */ react_default.createElement(ClassComponentWithSetState, null), /* @__PURE__ */ react_default.createElement(ClassComponentWithShouldComponentUpdate, null), /* @__PURE__ */ react_default.createElement(ShouldComponentUpdateChildWrapper, null), /* @__PURE__ */ react_default.createElement(PureComponentWrapper, null), /* @__PURE__ */ react_default.createElement(ClassComponentWithForceUpdate, null), /* @__PURE__ */ react_default.createElement("button", {
    onClick: () => setState(Date.now())
  }, "Trigger update"));
}
function Child({ value }) {
  return /* @__PURE__ */ react_default.createElement(react_default.Fragment, null, "[", value, "]");
}
var class_component_default, ClassComponent, ClassComponentWithSetState, ClassComponentWithShouldComponentUpdate, ShouldComponentUpdateChildWrapper, ShouldComponentUpdateChild, PureComponentWrapper, PureComponent, ChildPureComponent, ClassComponentWithForceUpdate, MemoClassComponent;
var init_class_component = __esm({
  "playground/cases/class-component.tsx"() {
    init_react();
    class_component_default = {
      title: "Class components",
      Root
    };
    __name(Root, "Root");
    ClassComponent = class extends react_default.Component {
      constructor() {
        super(...arguments);
        this.state = { test: 1 };
      }
      render() {
        const { value } = this.props;
        return /* @__PURE__ */ react_default.createElement(Child, {
          value
        });
      }
    };
    __name(ClassComponent, "ClassComponent");
    ClassComponentWithSetState = class extends react_default.Component {
      constructor() {
        super(...arguments);
        this.initial = true;
        this.state = { test: false };
      }
      render() {
        if (this.initial) {
          setTimeout(() => this.setState({ test: true }));
          this.initial = false;
        }
        return /* @__PURE__ */ react_default.createElement(Child, {
          value: this.state.test ? "OK" : "FAIL"
        });
      }
    };
    __name(ClassComponentWithSetState, "ClassComponentWithSetState");
    ClassComponentWithShouldComponentUpdate = class extends react_default.Component {
      constructor() {
        super(...arguments);
        this.initial = true;
        this.state = { test: false };
      }
      shouldComponentUpdate() {
        return false;
      }
      render() {
        if (this.initial) {
          setTimeout(() => this.setState({ test: true }));
          this.initial = false;
        }
        return /* @__PURE__ */ react_default.createElement(Child, {
          value: this.state.test ? "FAIL" : "OK"
        });
      }
    };
    __name(ClassComponentWithShouldComponentUpdate, "ClassComponentWithShouldComponentUpdate");
    ShouldComponentUpdateChildWrapper = class extends react_default.Component {
      constructor() {
        super(...arguments);
        this.initial = true;
        this.state = { test: false, update: 1 };
      }
      render() {
        if (this.initial) {
          setTimeout(() => this.setState({ test: true, update: 2 }));
          setTimeout(() => this.setState({ test: true, update: 3 }), 5);
          setTimeout(() => this.setState({ test: true, update: 4 }), 10);
          this.initial = false;
        }
        return /* @__PURE__ */ react_default.createElement(ShouldComponentUpdateChild, {
          update: this.state.update,
          value: this.state.test ? "OK" : "FAIL"
        });
      }
    };
    __name(ShouldComponentUpdateChildWrapper, "ShouldComponentUpdateChildWrapper");
    ShouldComponentUpdateChild = class extends react_default.Component {
      shouldComponentUpdate(nextProps) {
        return this.props.value !== nextProps.value;
      }
      render() {
        const { value } = this.props;
        return /* @__PURE__ */ react_default.createElement(Child, {
          value
        });
      }
    };
    __name(ShouldComponentUpdateChild, "ShouldComponentUpdateChild");
    PureComponentWrapper = class extends react_default.Component {
      constructor() {
        super(...arguments);
        this.initial = true;
        this.state = { test: 1 };
      }
      render() {
        if (this.initial) {
          setTimeout(() => this.setState({ test: 1 }));
          setTimeout(() => this.setState({ test: 2 }), 50);
          this.initial = false;
        }
        return /* @__PURE__ */ react_default.createElement(PureComponent, {
          value: this.state.test
        });
      }
    };
    __name(PureComponentWrapper, "PureComponentWrapper");
    PureComponent = class extends react_default.PureComponent {
      constructor() {
        super(...arguments);
        this.initial = true;
        this.state = { test: 1 };
      }
      render() {
        if (this.initial) {
          setTimeout(() => this.setState({ test: 2 }));
          setTimeout(() => this.setState({ test: 3 }), 5);
          setTimeout(() => this.setState({ test: 3 }), 10);
          this.initial = false;
        }
        return /* @__PURE__ */ react_default.createElement(ChildPureComponent, {
          value: this.state.test !== 3 ? "FAIL" : "OK"
        });
      }
    };
    __name(PureComponent, "PureComponent");
    ChildPureComponent = class extends react_default.PureComponent {
      render() {
        const { value } = this.props;
        return /* @__PURE__ */ react_default.createElement(Child, {
          value
        });
      }
    };
    __name(ChildPureComponent, "ChildPureComponent");
    ClassComponentWithForceUpdate = class extends react_default.Component {
      constructor() {
        super(...arguments);
        this.initial = true;
      }
      forceUpdate() {
        super.forceUpdate();
      }
      render() {
        const initial = this.initial;
        if (this.initial) {
          setTimeout(() => this.forceUpdate());
          this.initial = false;
        }
        return /* @__PURE__ */ react_default.createElement(Child, {
          value: !initial ? "OK" : "FAIL"
        });
      }
    };
    __name(ClassComponentWithForceUpdate, "ClassComponentWithForceUpdate");
    MemoClassComponent = react_default.memo(ClassComponent);
    __name(Child, "Child");
  }
});

// playground/cases/basic-nested-set-state.tsx
var basic_nested_set_state_exports = {};
__export(basic_nested_set_state_exports, {
  default: () => basic_nested_set_state_default
});
function Root2() {
  return /* @__PURE__ */ react_default.createElement(Child2, null);
}
function Child2() {
  const [mounted, setMounted] = react_default.useState("Fail: waiting for mount");
  react_default.useEffect(() => {
    setMounted("OK");
  }, []);
  return /* @__PURE__ */ react_default.createElement(react_default.Fragment, null, mounted);
}
var basic_nested_set_state_default;
var init_basic_nested_set_state = __esm({
  "playground/cases/basic-nested-set-state.tsx"() {
    init_react();
    basic_nested_set_state_default = {
      title: "Basic nested render with setState() via useEffect()",
      Root: Root2
    };
    __name(Root2, "Root");
    __name(Child2, "Child");
  }
});

// playground/cases/props-changes.tsx
var props_changes_exports = {};
__export(props_changes_exports, {
  default: () => props_changes_default
});
function Root3() {
  const [counter, setCounter] = react_default.useState(0);
  const [mounted, setMounted] = react_default.useState("Fail: waiting for mount");
  const [memoArray, memoObj] = react_default.useMemo(() => [[counter], { mounted, [mounted[0]]: "test" }], [mounted]);
  react_default.useEffect(() => {
    if (counter === 2) {
      setMounted("OK");
    } else {
      setCounter(counter + 1);
    }
  }, [counter]);
  return /* @__PURE__ */ react_default.createElement(react_default.Fragment, null, /* @__PURE__ */ react_default.createElement(Child3, {
    mounted,
    array: [counter],
    obj: { mounted, [mounted[0]]: "test" },
    memo: /* @__PURE__ */ react_default.createElement(Memo, null),
    forwardRef: /* @__PURE__ */ react_default.createElement(ForwardRef, {
      ref: () => {
      }
    }),
    lazy: /* @__PURE__ */ react_default.createElement(Lazy, null),
    mix: /* @__PURE__ */ react_default.createElement(Mix, null)
  }), /* @__PURE__ */ react_default.createElement(MemoChild, {
    mounted,
    array: memoArray,
    obj: memoObj
  }));
}
function Child3({
  mounted
}) {
  return /* @__PURE__ */ react_default.createElement(react_default.Fragment, null, mounted);
}
function Stub() {
  return /* @__PURE__ */ react_default.createElement(react_default.Fragment, null, "Stub");
}
var props_changes_default, MemoChild, Memo, ForwardRef, Lazy, Mix;
var init_props_changes = __esm({
  "playground/cases/props-changes.tsx"() {
    init_react();
    props_changes_default = {
      title: "Props changes",
      Root: Root3
    };
    __name(Root3, "Root");
    __name(Child3, "Child");
    Child3.displayName = "Child";
    MemoChild = react_default.memo(Child3);
    MemoChild.displayName = "MemoChild";
    __name(Stub, "Stub");
    Memo = react_default.memo(Stub);
    ForwardRef = react_default.forwardRef(Stub);
    Lazy = react_default.lazy(() => Promise.resolve({ default: Stub }));
    Mix = react_default.memo(react_default.forwardRef(Stub));
    Memo.displayName = "MemoStub";
    ForwardRef.displayName = "ForwardRefStub";
    Mix.displayName = "Mix";
  }
});

// playground/cases/basic-parent-element-change.tsx
var basic_parent_element_change_exports = {};
__export(basic_parent_element_change_exports, {
  default: () => basic_parent_element_change_default
});
function Root4() {
  return /* @__PURE__ */ react_default.createElement(ChildWrapper, null);
}
function ChildWrapper() {
  const [mounted, setMounted] = react_default.useState("Fail: waiting for mount");
  react_default.useEffect(() => {
    setMounted("OK");
  }, []);
  return /* @__PURE__ */ react_default.createElement("p", null, mounted, /* @__PURE__ */ react_default.createElement(Child4, null));
}
function Child4() {
  return /* @__PURE__ */ react_default.createElement(react_default.Fragment, null, "child element");
}
var basic_parent_element_change_default;
var init_basic_parent_element_change = __esm({
  "playground/cases/basic-parent-element-change.tsx"() {
    init_react();
    basic_parent_element_change_default = {
      title: "Basic render with changed parent element",
      Root: Root4
    };
    __name(Root4, "Root");
    __name(ChildWrapper, "ChildWrapper");
    __name(Child4, "Child");
  }
});

// playground/cases/context.tsx
var context_exports = {};
__export(context_exports, {
  default: () => context_default
});
function Root5() {
  return /* @__PURE__ */ react_default.createElement(MyContextProvider, null, /* @__PURE__ */ react_default.createElement(HookConsumer, null), /* @__PURE__ */ react_default.createElement(ElementConsumer, null), /* @__PURE__ */ react_default.createElement(MemoPaypassConsumer, null));
}
function HookConsumer() {
  const contextValue = react_default.useContext(MyContext);
  return /* @__PURE__ */ react_default.createElement(Child5, {
    value: contextValue || "Fail"
  });
}
function ElementConsumer() {
  const memoCallback = react_default.useCallback((contextValue) => /* @__PURE__ */ react_default.createElement(Child5, {
    value: contextValue
  }), []);
  return /* @__PURE__ */ react_default.createElement(react_default.Fragment, null, /* @__PURE__ */ react_default.createElement(MyContext.Consumer, null, (contextValue) => /* @__PURE__ */ react_default.createElement(Child5, {
    value: contextValue
  })), /* @__PURE__ */ react_default.createElement(MyContext.Consumer, null, memoCallback));
}
function Child5({ value }) {
  return /* @__PURE__ */ react_default.createElement(react_default.Fragment, null, value || "Fail: no value");
}
function MemoPaypassConsumer() {
  return /* @__PURE__ */ react_default.createElement(MemoWrapper, null);
}
function PaypassConsumerTarget() {
  react_default.useContext(MyContext);
  const contextValue = react_default.useContext(MyContext);
  const [state, setState] = react_default.useState(contextValue);
  if (state !== contextValue) {
    setState(contextValue);
  }
  return /* @__PURE__ */ react_default.createElement(Child5, {
    value: state
  });
}
function MyContextProvider({ children }) {
  const [value, setValue] = react_default.useState(0);
  react_default.useEffect(() => {
    if (value < 5) {
      setValue(value + 1);
    }
  }, [value]);
  return /* @__PURE__ */ react_default.createElement(MyContext.Provider, {
    value: value > 0 ? "OK" + value : "Fail: waiting for context change"
  }, children);
}
var context_default, MemoWrapper, MyContext;
var init_context = __esm({
  "playground/cases/context.tsx"() {
    init_react();
    context_default = {
      title: "Context",
      Root: Root5
    };
    __name(Root5, "Root");
    __name(HookConsumer, "HookConsumer");
    __name(ElementConsumer, "ElementConsumer");
    __name(Child5, "Child");
    __name(MemoPaypassConsumer, "MemoPaypassConsumer");
    MemoWrapper = react_default.memo(function() {
      return /* @__PURE__ */ react_default.createElement(PaypassConsumerTarget, null);
    });
    MemoWrapper.displayName = "MemoWrapper";
    __name(PaypassConsumerTarget, "PaypassConsumerTarget");
    MyContext = react_default.createContext("Fail: waiting for context change");
    MyContext.displayName = "MyContext";
    __name(MyContextProvider, "MyContextProvider");
  }
});

// playground/cases/hooks.tsx
var hooks_exports = {};
__export(hooks_exports, {
  default: () => hooks_default
});
function Root6() {
  const [isVisible, setIsVisible] = react_default.useState(false);
  const [test, setTest] = react_default.useState(0);
  const [state, dispatch] = react_default.useReducer((_, value) => value, false, () => ({
    a: false
  }));
  react_default.useCallback(() => isVisible ? setTest : dispatch, [isVisible]);
  react_default.useMemo(() => [isVisible, test, state], [isVisible, test, state]);
  react_default.useDebugValue(Date.now());
  react_default.useRef({ ref: Date.now() });
  react_default.useEffect(/* @__PURE__ */ __name(function effect() {
    if (!isVisible) {
      setIsVisible(true);
      setTest(333);
      dispatch({ a: 1 });
    }
    return /* @__PURE__ */ __name(function teardown() {
    }, "teardown");
  }, "effect"), [isVisible]);
  react_default.useLayoutEffect(/* @__PURE__ */ __name(function layoutEffect() {
    return /* @__PURE__ */ __name(function teardown() {
    }, "teardown");
  }, "layoutEffect"), [isVisible]);
  react_default.useContext(CtxA);
  react_default.useContext(CtxB);
  useFoo();
  return /* @__PURE__ */ react_default.createElement(Child6, {
    prop: 42
  });
}
function useFoo() {
  return useBar();
}
function useBar() {
  return react_default.useContext(CtxA);
}
var hooks_default, CtxA, CtxB, Child6;
var init_hooks = __esm({
  "playground/cases/hooks.tsx"() {
    init_react();
    hooks_default = {
      title: "Hooks",
      Root: Root6
    };
    CtxA = react_default.createContext(1);
    CtxB = react_default.createContext(2);
    __name(Root6, "Root");
    __name(useFoo, "useFoo");
    __name(useBar, "useBar");
    Child6 = react_default.forwardRef(/* @__PURE__ */ __name(function Child7({ prop = 123 }, ref) {
      react_default.useImperativeHandle(ref, () => ({
        focus() {
          console.log();
        }
      }), [prop]);
      return /* @__PURE__ */ react_default.createElement(react_default.Fragment, null, "OK");
    }, "Child"));
  }
});

// playground/cases/bailouts.tsx
var bailouts_exports = {};
__export(bailouts_exports, {
  default: () => bailouts_default
});
function Root7() {
  const [state, setState] = react_default.useState(0);
  react_default.useEffect(() => {
    if (state < 1) {
      setState(state + 1);
    }
  }, [state]);
  return /* @__PURE__ */ react_default.createElement(react_default.Fragment, null, /* @__PURE__ */ react_default.createElement(FunctionNewChild, null), /* @__PURE__ */ react_default.createElement(FunctionSameChild, null), /* @__PURE__ */ react_default.createElement(FunctionSameProps, null), /* @__PURE__ */ react_default.createElement(ClassNewChild, null), /* @__PURE__ */ react_default.createElement(ClassSameChild, null), /* @__PURE__ */ react_default.createElement(ClassSameProps, null), /* @__PURE__ */ react_default.createElement(MemoNoPropsBailout, null), /* @__PURE__ */ react_default.createElement(MemoWithPropsBailout, {
    value: "test"
  }), /* @__PURE__ */ react_default.createElement(FunctionStateNoChangeBailout, null), /* @__PURE__ */ react_default.createElement(ClassStateNoChangeBailout, null));
}
function FunctionNewChild() {
  return /* @__PURE__ */ react_default.createElement(ShouldUpdate, {
    value: "test"
  });
}
function FunctionSameChild() {
  const child = react_default.useMemo(() => /* @__PURE__ */ react_default.createElement(ShouldNotUpdate, {
    value: "test"
  }), []);
  return child;
}
function FunctionSameProps() {
  const childProps = react_default.useMemo(() => ({ value: "test" }), []);
  return /* @__PURE__ */ react_default.createElement(ShouldUpdate, {
    ...childProps
  });
}
function ShouldUpdate({ value }) {
  const updateCount = react_default.useRef(0);
  updateCount.current++;
  return /* @__PURE__ */ react_default.createElement(react_default.Fragment, null, "[", value !== value || updateCount.current === 1 ? "FAIL" : "OK", "]");
}
function ShouldNotUpdate({ value }) {
  const updateCount = react_default.useRef(0);
  updateCount.current++;
  return /* @__PURE__ */ react_default.createElement(react_default.Fragment, null, "[", value === value && updateCount.current === 1 ? "OK" : "FAIL", "]");
}
var bailouts_default, ClassNewChild, ClassSameChild, ClassSameProps, MemoNoPropsBailout, MemoWithPropsBailout, FunctionStateNoChangeBailout, ClassStateNoChangeBailout;
var init_bailouts = __esm({
  "playground/cases/bailouts.tsx"() {
    init_react();
    bailouts_default = {
      title: "Bailouts",
      Root: Root7
    };
    __name(Root7, "Root");
    __name(FunctionNewChild, "FunctionNewChild");
    __name(FunctionSameChild, "FunctionSameChild");
    __name(FunctionSameProps, "FunctionSameProps");
    ClassNewChild = class extends react_default.Component {
      render() {
        return /* @__PURE__ */ react_default.createElement(ShouldUpdate, {
          value: "test"
        });
      }
    };
    __name(ClassNewChild, "ClassNewChild");
    ClassSameChild = class extends react_default.Component {
      constructor() {
        super(...arguments);
        this.child = null;
      }
      render() {
        if (this.child === null) {
          this.child = /* @__PURE__ */ react_default.createElement(ShouldNotUpdate, {
            value: "test"
          });
        }
        return this.child;
      }
    };
    __name(ClassSameChild, "ClassSameChild");
    ClassSameProps = class extends react_default.Component {
      constructor() {
        super(...arguments);
        this.childProps = { value: "test" };
      }
      render() {
        return /* @__PURE__ */ react_default.createElement(ShouldUpdate, {
          ...this.childProps
        });
      }
    };
    __name(ClassSameProps, "ClassSameProps");
    MemoNoPropsBailout = react_default.memo(function() {
      return /* @__PURE__ */ react_default.createElement(ShouldNotUpdate, {
        value: "test"
      });
    });
    MemoNoPropsBailout.displayName = "MemoNoPropsBailout";
    MemoWithPropsBailout = react_default.memo(function({
      value
    }) {
      return /* @__PURE__ */ react_default.createElement(ShouldNotUpdate, {
        value
      });
    });
    MemoWithPropsBailout.displayName = "MemoWithPropsBailout";
    FunctionStateNoChangeBailout = react_default.memo(function() {
      const [, setState] = react_default.useState(1);
      react_default.useEffect(() => {
        setState(2);
        setState(1);
      }, []);
      return /* @__PURE__ */ react_default.createElement(ShouldNotUpdate, {
        value: "test"
      });
    });
    FunctionStateNoChangeBailout.displayName = "FunctionStateNoChangeBailout";
    ClassStateNoChangeBailout = react_default.memo(/* @__PURE__ */ __name(class ClassStateNoChangeBailout2 extends react_default.Component {
      constructor() {
        super(...arguments);
        this.initial = true;
        this.state = { value: 1 };
      }
      componentDidMount() {
        this.setState(() => ({ value: 2 }));
        this.setState(() => ({ value: 1 }));
      }
      render() {
        if (this.initial) {
          this.initial = false;
        }
        return /* @__PURE__ */ react_default.createElement(ShouldNotUpdate, {
          value: "test"
        });
      }
    }, "ClassStateNoChangeBailout"));
    ClassStateNoChangeBailout.displayName = "ClassStateNoChangeBailout";
    __name(ShouldUpdate, "ShouldUpdate");
    __name(ShouldNotUpdate, "ShouldNotUpdate");
  }
});

// playground/cases/mount-unmount.tsx
var mount_unmount_exports = {};
__export(mount_unmount_exports, {
  default: () => mount_unmount_default
});
function Root8() {
  const [isVisible, setIsVisible] = react_default.useState(false);
  const [isFirstRender, setIsFirstRender] = react_default.useState(true);
  react_default.useEffect(() => {
    let mounted = true;
    const timer = setTimeout(() => mounted && setIsFirstRender(false), 1);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [isFirstRender]);
  return /* @__PURE__ */ react_default.createElement(react_default.Fragment, null, /* @__PURE__ */ react_default.createElement("button", {
    onClick: () => setIsVisible(!isVisible)
  }, isVisible ? "Hide" : "Show"), (isVisible || isFirstRender) && /* @__PURE__ */ react_default.createElement(Child8, null));
}
function Child8() {
  return /* @__PURE__ */ react_default.createElement(react_default.Fragment, null, "OK");
}
var mount_unmount_default;
var init_mount_unmount = __esm({
  "playground/cases/mount-unmount.tsx"() {
    init_react();
    mount_unmount_default = {
      title: "Mount/unmount",
      Root: Root8
    };
    __name(Root8, "Root");
    __name(Child8, "Child");
  }
});

// playground/cases/complex-composition-on-one-component.tsx
var complex_composition_on_one_component_exports = {};
__export(complex_composition_on_one_component_exports, {
  default: () => complex_composition_on_one_component_default
});
function Root9() {
  return /* @__PURE__ */ react_default.createElement(Foo, null, /* @__PURE__ */ react_default.createElement(Bar, null), /* @__PURE__ */ react_default.createElement(Baz, null, /* @__PURE__ */ react_default.createElement(Bar, null, /* @__PURE__ */ react_default.createElement(Qux, null))), /* @__PURE__ */ react_default.createElement(BarMemo, null, "K"));
}
function Foo({ children }) {
  return /* @__PURE__ */ react_default.createElement(react_default.Fragment, null, children);
}
function Bar({ children }) {
  return /* @__PURE__ */ react_default.createElement(react_default.Fragment, null, children);
}
function Baz({ children }) {
  return /* @__PURE__ */ react_default.createElement(react_default.Fragment, null, children);
}
function Qux() {
  return /* @__PURE__ */ react_default.createElement(react_default.Fragment, null, "O");
}
var complex_composition_on_one_component_default, BarMemo;
var init_complex_composition_on_one_component = __esm({
  "playground/cases/complex-composition-on-one-component.tsx"() {
    init_react();
    complex_composition_on_one_component_default = {
      title: "Complex composition on one component",
      Root: Root9
    };
    __name(Root9, "Root");
    __name(Foo, "Foo");
    __name(Bar, "Bar");
    BarMemo = react_default.memo(Baz);
    __name(Baz, "Baz");
    __name(Qux, "Qux");
  }
});

// playground/cases/set-state-by-event-handler.tsx
var set_state_by_event_handler_exports = {};
__export(set_state_by_event_handler_exports, {
  default: () => set_state_by_event_handler_default
});
function Root10() {
  return /* @__PURE__ */ react_default.createElement(Child9, null);
}
function Child9() {
  const [ok, setOk] = react_default.useState(false);
  if (!ok) {
    return /* @__PURE__ */ react_default.createElement("div", {
      "data-send-event": "click",
      onClick: () => setOk(true)
    }, "Failed: waiting for click event");
  }
  return /* @__PURE__ */ react_default.createElement(react_default.Fragment, null, "OK");
}
var set_state_by_event_handler_default;
var init_set_state_by_event_handler = __esm({
  "playground/cases/set-state-by-event-handler.tsx"() {
    init_react();
    set_state_by_event_handler_default = {
      title: "Set state by event handler",
      Root: Root10
    };
    __name(Root10, "Root");
    __name(Child9, "Child");
  }
});

// playground/cases/use-effects.tsx
var use_effects_exports = {};
__export(use_effects_exports, {
  default: () => use_effects_default
});
function Root11() {
  const [isVisible, setIsVisible] = react_default.useState(true);
  const [, setState] = react_default.useState(0);
  react_default.useEffect(() => {
    setState(Date.now());
  }, []);
  return /* @__PURE__ */ react_default.createElement(react_default.Fragment, null, /* @__PURE__ */ react_default.createElement("button", {
    onClick: () => setIsVisible(!isVisible)
  }, isVisible ? "Hide" : "Show"), isVisible && /* @__PURE__ */ react_default.createElement(Child10, null));
}
function usePassiveEffects() {
  react_default.useEffect(() => {
    return () => {
    };
  });
  react_default.useEffect(() => {
  });
}
function useLayoutEffects() {
  react_default.useLayoutEffect(() => {
    return () => {
    };
  });
  react_default.useLayoutEffect(() => {
  });
}
function useEffects() {
  usePassiveEffects();
  useLayoutEffects();
}
function Child10() {
  useEffects();
  return /* @__PURE__ */ react_default.createElement(react_default.Fragment, null, "OK");
}
var use_effects_default;
var init_use_effects = __esm({
  "playground/cases/use-effects.tsx"() {
    init_react();
    use_effects_default = {
      title: "useEffect()/useLayoutEffect()",
      Root: Root11
    };
    __name(Root11, "Root");
    __name(usePassiveEffects, "usePassiveEffects");
    __name(useLayoutEffects, "useLayoutEffects");
    __name(useEffects, "useEffects");
    __name(Child10, "Child");
  }
});

// playground/cases/suspense.tsx
var suspense_exports = {};
__export(suspense_exports, {
  default: () => suspense_default
});
function Root12() {
  return /* @__PURE__ */ react_default.createElement(react_default.Suspense, {
    fallback: /* @__PURE__ */ react_default.createElement(Spinner, null)
  }, /* @__PURE__ */ react_default.createElement(LazyContent, null));
}
function Content() {
  return /* @__PURE__ */ react_default.createElement(react_default.Suspense, {
    fallback: /* @__PURE__ */ react_default.createElement(Spinner, null)
  }, /* @__PURE__ */ react_default.createElement(LazyContent2, null));
}
function Content2() {
  return /* @__PURE__ */ react_default.createElement(react_default.Fragment, null, "OK");
}
function Spinner() {
  return /* @__PURE__ */ react_default.createElement(react_default.Fragment, null, "Loading...");
}
var suspense_default, LazyContent, LazyContent2;
var init_suspense = __esm({
  "playground/cases/suspense.tsx"() {
    init_react();
    suspense_default = {
      title: "Using suspense",
      Root: Root12
    };
    __name(Root12, "Root");
    LazyContent = react_default.lazy(() => Promise.resolve({ default: Content }));
    __name(Content, "Content");
    LazyContent2 = react_default.lazy(() => Promise.resolve({ default: Content2 }));
    __name(Content2, "Content2");
    __name(Spinner, "Spinner");
  }
});

// playground/cases/app.tsx
var app_exports = {};
__export(app_exports, {
  default: () => app_default
});
function Root13() {
  const [name, setName] = react_default.useState("World");
  return /* @__PURE__ */ react_default.createElement("div", {
    className: "app"
  }, /* @__PURE__ */ react_default.createElement(Toolbar, {
    input: /* @__PURE__ */ react_default.createElement(Input, {
      value: name,
      onInput: setName
    }),
    button: /* @__PURE__ */ react_default.createElement(Button, {
      caption: "Click me!",
      onClick: () => alert(`Hello, ${name}!`)
    })
  }), /* @__PURE__ */ react_default.createElement(List, null, ["This", "is", "example"].map((text) => /* @__PURE__ */ react_default.createElement(ListItem, {
    key: text,
    caption: text
  }))));
}
function Toolbar({
  input,
  button
}) {
  return /* @__PURE__ */ react_default.createElement("div", {
    id: "toolbar"
  }, input, button);
}
function Input({
  value,
  onInput
}) {
  return /* @__PURE__ */ react_default.createElement("input", {
    value,
    onChange: (e) => onInput(e.target.value)
  });
}
function Button({
  caption,
  onClick
}) {
  return /* @__PURE__ */ react_default.createElement("button", {
    onClick
  }, caption);
}
function ListItem({ caption }) {
  return /* @__PURE__ */ react_default.createElement("li", null, caption);
}
var app_default, List;
var init_app = __esm({
  "playground/cases/app.tsx"() {
    init_react();
    app_default = {
      title: "App #1",
      Root: Root13
    };
    __name(Root13, "Root");
    __name(Toolbar, "Toolbar");
    __name(Input, "Input");
    __name(Button, "Button");
    List = /* @__PURE__ */ __name(function List2({ children }) {
      return /* @__PURE__ */ react_default.createElement("ul", null, children);
    }, "List");
    __name(ListItem, "ListItem");
  }
});

// playground/cases/screenshot-demo.tsx
var screenshot_demo_exports = {};
__export(screenshot_demo_exports, {
  default: () => screenshot_demo_default
});
function App() {
  const [user, setUser] = react_default.useState(null);
  const [items, setItems] = react_default.useState(null);
  const [selectedId, setSelectedId] = react_default.useState(null);
  react_default.useEffect(() => {
    setSelectedId(23.01);
    setItems([]);
    Promise.resolve([
      { id: 1, caption: "Foo", checked: false },
      { id: 23, caption: "Bar", checked: true },
      { id: 566, caption: "Baz", checked: false }
    ]).then((items2) => {
      setSelectedId(23);
      setItems(items2);
    });
    Promise.resolve({ id: 123, name: "User", avatar: "url to image" }).then(setUser);
  }, []);
  return /* @__PURE__ */ react_default.createElement(Settings.Provider, {
    value: { darkmode: false }
  }, /* @__PURE__ */ react_default.createElement(Header, {
    title: "Demo app for a screenshot",
    datetime: new Date(),
    user
  }), /* @__PURE__ */ react_default.createElement(List3, {
    items: items || [],
    limit: 10,
    selectedId: Math.round(selectedId || 1)
  }), /* @__PURE__ */ react_default.createElement(Overlay, null));
}
function Avatar({ name, image }) {
  return /* @__PURE__ */ react_default.createElement(react_default.Fragment, null, /* @__PURE__ */ react_default.createElement("img", {
    src: image
  }), " ", name);
}
function ListItem2({
  caption,
  checked,
  selected
}) {
  const [localChecked, setChecked] = react_default.useState(checked);
  return /* @__PURE__ */ react_default.createElement("li", {
    className: [
      localChecked ? "done" : "incomplete",
      selected ? "selected" : ""
    ].filter(Boolean).join(" ")
  }, /* @__PURE__ */ react_default.createElement(Checkbox, {
    checked: localChecked,
    onChange: setChecked
  }), caption);
}
function Checkbox({
  checked,
  onChange
}) {
  const darkmode = useDarkmode();
  react_default.useEffect(() => {
    if (checked) {
      setTimeout(() => onChange(false));
    }
  }, [checked]);
  return /* @__PURE__ */ react_default.createElement("input", {
    className: darkmode ? "darkmode" : "lightmode",
    type: "checkbox",
    checked,
    onChange: (e) => onChange(e.target.checked)
  });
}
function Overlay() {
  const [visible, setVisible] = react_default.useState(true);
  if (!visible) {
    return null;
  }
  return /* @__PURE__ */ react_default.createElement("div", {
    className: "react-overlay"
  }, /* @__PURE__ */ react_default.createElement("button", {
    style: { position: "absolute", bottom: 0 },
    onClick: () => setVisible(false)
  }, "x"));
}
function Loader({ children }) {
  return /* @__PURE__ */ react_default.createElement(react_default.Fragment, null, children);
}
function AvatarPlaceholder() {
  return /* @__PURE__ */ react_default.createElement(react_default.Fragment, null, "placeholder");
}
function useFormattedDate(datetime) {
  const formattedDate = react_default.useMemo(() => datetime.toISOString(), [datetime]);
  return formattedDate;
}
function useDarkmode() {
  const { darkmode } = react_default.useContext(Settings);
  return darkmode;
}
var screenshot_demo_default, Settings, Header, List3;
var init_screenshot_demo = __esm({
  "playground/cases/screenshot-demo.tsx"() {
    init_react();
    screenshot_demo_default = {
      title: "RRT readme demo screenshot",
      Root: App
    };
    Settings = react_default.createContext({ darkmode: false });
    Settings.displayName = "Settings";
    __name(App, "App");
    Header = react_default.memo(function({
      title,
      datetime,
      user
    }) {
      const formattedDate = useFormattedDate(datetime);
      const avatar = react_default.useMemo(() => user ? /* @__PURE__ */ react_default.createElement(Avatar, {
        name: user.name,
        image: user.avatar
      }) : /* @__PURE__ */ react_default.createElement(Loader, null, /* @__PURE__ */ react_default.createElement(AvatarPlaceholder, null)), [user?.name, user?.avatar]);
      return /* @__PURE__ */ react_default.createElement("h1", null, avatar, title, " (", formattedDate, ")");
    });
    Header.displayName = "Header";
    __name(Avatar, "Avatar");
    List3 = react_default.memo(function({
      items,
      limit,
      selectedId
    }) {
      const [, setConfig] = react_default.useState({ initial: true, dataset: "none", rest: 123, rest2: 123 });
      react_default.useEffect(() => {
        setConfig({ dataset: "default", rest: 123, rest2: 123 });
      }, []);
      if (!items || !items.length) {
        return /* @__PURE__ */ react_default.createElement(Loader, null, "loading...");
      }
      return /* @__PURE__ */ react_default.createElement("ul", null, items.slice(0, limit).map((item) => /* @__PURE__ */ react_default.createElement(ListItem2, {
        key: item.id,
        selected: item.id === selectedId,
        caption: item.caption,
        checked: item.checked
      })));
    });
    List3.displayName = "List";
    __name(ListItem2, "ListItem");
    __name(Checkbox, "Checkbox");
    __name(Overlay, "Overlay");
    __name(Loader, "Loader");
    __name(AvatarPlaceholder, "AvatarPlaceholder");
    __name(useFormattedDate, "useFormattedDate");
    __name(useDarkmode, "useDarkmode");
  }
});

// playground/index.tsx
init_react();

// playground/cases/index.ts
var cases_default = [
  getDefault(Promise.resolve().then(() => (init_class_component(), class_component_exports))),
  getDefault(Promise.resolve().then(() => (init_basic_nested_set_state(), basic_nested_set_state_exports))),
  getDefault(Promise.resolve().then(() => (init_props_changes(), props_changes_exports))),
  getDefault(Promise.resolve().then(() => (init_basic_parent_element_change(), basic_parent_element_change_exports))),
  getDefault(Promise.resolve().then(() => (init_context(), context_exports))),
  getDefault(Promise.resolve().then(() => (init_hooks(), hooks_exports))),
  getDefault(Promise.resolve().then(() => (init_bailouts(), bailouts_exports))),
  getDefault(Promise.resolve().then(() => (init_mount_unmount(), mount_unmount_exports))),
  getDefault(Promise.resolve().then(() => (init_complex_composition_on_one_component(), complex_composition_on_one_component_exports))),
  getDefault(Promise.resolve().then(() => (init_set_state_by_event_handler(), set_state_by_event_handler_exports))),
  getDefault(Promise.resolve().then(() => (init_use_effects(), use_effects_exports))),
  getDefault(Promise.resolve().then(() => (init_suspense(), suspense_exports))),
  getDefault(Promise.resolve().then(() => (init_app(), app_exports))),
  getDefault(Promise.resolve().then(() => (init_screenshot_demo(), screenshot_demo_exports)))
];
function getDefault(dynImport) {
  return dynImport.then((exports) => exports.default);
}
__name(getDefault, "getDefault");

// playground/react-dom.tsx
var react_dom_default = window.ReactDOM;

// playground/dom-utils.ts
var { hasOwnProperty } = Object.prototype;
function createElement(tag, attrs, children) {
  const el = document.createElement(tag);
  if (typeof attrs === "string") {
    attrs = {
      class: attrs
    };
  }
  for (const attrName in attrs) {
    if (typeof attrName === "string" && hasOwnProperty.call(attrs, attrName)) {
      const value = attrs[attrName];
      if (typeof value === "undefined") {
        continue;
      }
      if (typeof value === "function") {
        el.addEventListener(attrName.slice(2), value);
      } else {
        el.setAttribute(attrName, value);
      }
    }
  }
  if (Array.isArray(children)) {
    el.append(...children);
  } else if (typeof children === "string") {
    el.innerHTML = children;
  }
  return el;
}
__name(createElement, "createElement");

// playground/create-test-case-wrapper.ts
var emulateEventAttribute = "data-send-event";
function emulateEvent(target) {
  const value = target.getAttribute(emulateEventAttribute);
  switch (value) {
    case "click":
      target.click();
      break;
    default:
      console.warn(`Unknown event type "${value}" in "${emulateEventAttribute}" attribute`);
  }
}
__name(emulateEvent, "emulateEvent");
function create_test_case_wrapper_default(testcase) {
  let reactRoot;
  let reactRootEl;
  const rootEl = createElement("div", "case-wrapper", [
    createElement("h2", null, [createElement("span", null, testcase.title)]),
    reactRootEl = createElement("div", {
      id: testcase.title,
      class: "content"
    })
  ]);
  let observing = false;
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      switch (mutation.type) {
        case "attributes":
          if (mutation.attributeName === emulateEventAttribute) {
            emulateEvent(mutation.target);
          }
          break;
        case "childList":
          for (const node of Array.from(mutation.addedNodes)) {
            const target = node;
            if (target.nodeType === 1 && target.hasAttribute(emulateEventAttribute)) {
              emulateEvent(target);
            }
          }
          break;
      }
    }
  });
  return {
    id: encodeURIComponent(testcase.title.replace(/\s+/g, "-")),
    testcase,
    render(containerEl, element) {
      if (!containerEl.contains(rootEl)) {
        containerEl.append(rootEl);
      }
      if (!observing) {
        observing = true;
        observer.observe(reactRootEl, {
          subtree: true,
          childList: true,
          attributes: true,
          attributeFilter: [emulateEventAttribute]
        });
      }
      if (react_dom_default.createRoot) {
        reactRoot = react_dom_default.createRoot(reactRootEl);
        reactRoot.render(element);
      } else {
        react_dom_default.render(element, reactRootEl);
      }
    },
    dispose() {
      observing = false;
      observer.disconnect();
      if (reactRoot) {
        reactRoot.unmount();
      } else {
        react_dom_default.unmountComponentAtNode(reactRootEl);
      }
      rootEl.remove();
    }
  };
}
__name(create_test_case_wrapper_default, "default");

// playground/index.tsx
var initialHashParams = new URLSearchParams(location.hash.slice(1));
var isProdBundle = initialHashParams.has("prod");
var reactVersion = initialHashParams.get("version");
var versions = [
  "18.1.0",
  "18.0.0",
  "17.0.2",
  "17.0.1",
  "17.0.0",
  "16.14.0",
  "16.13.1",
  "16.13.0",
  "16.12.0",
  "16.11.0",
  "16.10.2",
  "16.10.1",
  "16.9.0"
];
function createHash(version, prod = false, id = null) {
  const params = new URLSearchParams();
  if (version) {
    params.append("version", version);
  }
  if (prod) {
    params.append("prod", "");
  }
  if (id) {
    params.append("case", id);
  }
  return `#${params}`;
}
__name(createHash, "createHash");
function createTocItem(id, title) {
  return createElement("li", null, [
    createElement("a", { href: createHash(reactVersion, isProdBundle, id) }, title)
  ]);
}
__name(createTocItem, "createTocItem");
function selectElement(selector) {
  return document.querySelector(selector);
}
__name(selectElement, "selectElement");
Promise.all(cases_default).then((testCases) => {
  const testCaseWrappers = testCases.map((test) => create_test_case_wrapper_default(test));
  const headerEl = selectElement(".playground__header");
  const sidebarEl = selectElement(".playground__sidebar");
  const contentEl = selectElement(".playground__content");
  const tocEl = sidebarEl.appendChild(createElement("ul", "playground__toc", [createTocItem(void 0, "All")]));
  headerEl.append("React version:\xA0", createElement("select", {
    onchange() {
      location.hash = createHash(this.value, isProdBundle, selectedTestCaseId);
    }
  }, versions.map((version) => createElement("option", version === reactVersion ? { selected: "" } : {}, version))), createElement("label", null, [
    createElement("input", {
      type: "checkbox",
      checked: isProdBundle ? "" : void 0,
      onchange() {
        location.hash = createHash(reactVersion, this.checked, selectedTestCaseId);
      }
    }),
    "production"
  ]));
  for (const testCaseWrapper of testCaseWrappers) {
    const { id, testcase } = testCaseWrapper;
    tocEl.append(createTocItem(id, testcase.title));
  }
  let selectedTestCaseId = null;
  const renderedTestCases = /* @__PURE__ */ new Set();
  const syncSelectedTestCase = /* @__PURE__ */ __name(() => {
    const params = new URLSearchParams(location.hash.slice(1));
    const newSelectedTestCaseId = params.get("case") || null;
    const newSelectedHash = createHash(reactVersion, isProdBundle, newSelectedTestCaseId);
    for (const link of tocEl.querySelectorAll("a[href]")) {
      link.classList.toggle("selected", link.getAttribute("href") === newSelectedHash);
    }
    for (const testCaseWrapper of renderedTestCases) {
      renderedTestCases.delete(testCaseWrapper);
      testCaseWrapper.dispose();
    }
    selectedTestCaseId = newSelectedTestCaseId;
    for (const testCaseWrapper of testCaseWrappers) {
      const { id, render, testcase } = testCaseWrapper;
      const { Root: Root14, title } = testcase;
      if (selectedTestCaseId !== null && selectedTestCaseId !== decodeURIComponent(id)) {
        continue;
      }
      renderedTestCases.add(testCaseWrapper);
      render(contentEl, /* @__PURE__ */ react_default.createElement(Root14, {
        title
      }));
    }
  }, "syncSelectedTestCase");
  syncSelectedTestCase();
  addEventListener("hashchange", syncSelectedTestCase);
});
//# sourceMappingURL=index.js.map

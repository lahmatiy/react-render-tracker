import * as React from "react";
import { TestCase } from "../types";

export default {
  title: "Props changes",
  Root,
} as TestCase;

function Root() {
  const [counter, setCounter] = React.useState(0);
  const [mounted, setMounted] = React.useState("Fail: waiting for mount");
  const [memoArray, memoObj] = React.useMemo(
    () => [[counter], { mounted, [mounted[0]]: "test" }],
    [mounted]
  );

  React.useEffect(() => {
    if (counter === 2) {
      setMounted("OK");
    } else {
      setCounter(counter + 1);
    }
  }, [counter]);

  return (
    <>
      <Child
        mounted={mounted}
        array={[counter]}
        obj={{ mounted, [mounted[0]]: "test" }}
        memo={<Memo />}
        forwardRef={
          <ForwardRef
            ref={() => {
              /*noop*/
            }}
          />
        }
        lazy={<Lazy />}
        mix={<Mix />}
      />
      <MemoChild mounted={mounted} array={memoArray} obj={memoObj} />
    </>
  );
}

function Child({
  mounted,
}: {
  mounted: string;
  array: any[];
  obj: Record<any, any>;
  memo?: any;
  forwardRef?: any;
  lazy?: any;
  mix?: any;
}) {
  return <>{mounted}</>;
}
Child.displayName = "Child";

const MemoChild = React.memo(Child);
MemoChild.displayName = "MemoChild";

function Stub() {
  return <>Stub</>;
}

const Memo = React.memo(Stub);
const ForwardRef = React.forwardRef(Stub);
const Lazy = React.lazy(() => Promise.resolve({ default: Stub }));
const Mix = React.memo(React.forwardRef(Stub));
Memo.displayName = "MemoStub";
ForwardRef.displayName = "ForwardRefStub";
// Lazy.displayName = "LazyStub";
Mix.displayName = "Mix";

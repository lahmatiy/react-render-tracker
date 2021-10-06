import * as React from "react";
import { notifyById, subscribeById, Subscriptions } from "./subscription";

type MatchResult = [offset: number, length: number] | null;
type MatchChangedHandler = (match: MatchResult) => void;
interface MatchContextValue {
  setPattern(pattern: string): void;
  match(value: string | null): MatchResult;
  subscribe(value: string | null, fn: MatchChangedHandler): () => void;
}

const FindMatchContext = React.createContext<MatchContextValue>({
  setPattern: () => undefined,
  match: () => null,
  subscribe: () => () => undefined,
});
export const useFindMatchContext = () => React.useContext(FindMatchContext);
export const FindMatchContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [pattern, setPatternState] = React.useState("");
  const { subscriptions, awaitingNotify, matches, matchValue, setPattern } =
    React.useMemo(() => {
      const subscriptions = new Map<
        string,
        Subscriptions<MatchChangedHandler>
      >();
      const awaitingNotify = new Set<string>();
      const matches = new Map<string, MatchResult>();
      const matchValue = (value: string) => {
        let result: MatchResult = null;

        if (typeof pattern === "string" && pattern !== "") {
          const offset = value.toLowerCase().indexOf(pattern.toLowerCase());

          if (offset !== -1) {
            result = [offset, pattern.length];
          }
        }

        matches.set(value, result);

        return result;
      };

      let pattern = "";
      const setPattern = (nextPattern: string | null) => {
        nextPattern ||= "";

        if (nextPattern === pattern) {
          return;
        }

        pattern = nextPattern;

        for (const [value, prevMatch] of matches) {
          const nextMatch = matchValue(value);

          if (prevMatch !== nextMatch) {
            awaitingNotify.add(value);
          }
        }

        setPatternState(pattern);
      };

      return {
        subscriptions,
        awaitingNotify,
        matches,
        matchValue,
        setPattern,
      };
    }, []);

  const value = React.useMemo<MatchContextValue>(() => {
    return {
      setPattern,
      match(value) {
        if (value === null) {
          return null;
        }

        if (matches.has(value)) {
          return matches.get(value) || null;
        }

        return matchValue(value);
      },
      subscribe(value, fn) {
        return subscribeById(subscriptions, value, fn);
      },
    };
  }, []);

  // flush awaiting updates
  React.useEffect(() => {
    for (const value of awaitingNotify) {
      notifyById(subscriptions, value, matches.get(value) || null);
    }

    awaitingNotify.clear();
  }, [pattern]);

  return (
    <FindMatchContext.Provider value={value}>
      {children}
    </FindMatchContext.Provider>
  );
};

export const useFindMatch = (value: string | null) => {
  const { match, subscribe } = useFindMatchContext();
  const [state, setState] = React.useState<MatchResult>(() => match(value));

  React.useEffect(() => subscribe(value, setState), [value]);

  return state;
};

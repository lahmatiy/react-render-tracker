import * as React from "react";

type matchResult = [offset: number, length: number] | null;
type matchFn = (id: number, value: string | null) => matchResult;

const FindMatchContext = React.createContext<matchFn>(() => null);
export const useFindMatchContext = () => React.useContext(FindMatchContext);
export const FindMatchContextProvider = ({
  pattern,
  children,
}: {
  pattern: string | null;
  children: React.ReactNode;
}) => {
  const match = React.useMemo<matchFn>(() => {
    const matches = new Map<number, matchResult>();
    const matched = new Set<number>();

    return (id, value) => {
      if (!matches.has(id)) {
        let range: matchResult = null;

        if (
          typeof value === "string" &&
          typeof pattern === "string" &&
          pattern !== ""
        ) {
          const offset = value.toLowerCase().indexOf(pattern.toLowerCase());

          if (offset !== -1) {
            matched.add(id);
            range = [offset, pattern.length];
          }
        }

        matches.set(id, range);
      }

      return matches.get(id) || null;
    };
  }, [pattern]);

  return (
    <FindMatchContext.Provider value={match}>
      {children}
    </FindMatchContext.Provider>
  );
};

export const useFindMatch = (id: number, value: string | null) => {
  const match = useFindMatchContext();

  return match(id, value);
};

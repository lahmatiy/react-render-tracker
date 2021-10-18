import * as React from "react";
import { OpenSourceSettings } from "rempl";
import { remoteSubscriber } from "../rempl-subscriber";

interface OpenFileContext {
  anchorAttrs(loc: string):
    | {
        href: string;
        onClick?: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
      }
    | undefined;
  available: boolean;
}

const OpenFileContext = React.createContext<OpenFileContext>({
  anchorAttrs: () => undefined,
  available: false,
});
export const useOpenFile = () => React.useContext(OpenFileContext);
export function OpenFileContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, setSettings] = React.useState<OpenSourceSettings>(null);
  const value = React.useMemo<OpenFileContext>(() => {
    return {
      available: Boolean(settings),
      anchorAttrs(loc) {
        if (settings) {
          try {
            const [, path = "", line = "1", column = "1"] =
              loc.match(/^(.+?)(?::(\d+)(?::(\d+))?)?$/) || [];
            const filepath =
              settings.root +
              new URL(path, "http://test" + settings.base).pathname;
            const resolvedLoc = `${filepath}:${line}:${column}`;
            const values = {
              loc: resolvedLoc,
              file: resolvedLoc,
              filepath,
              line,
              column,
              line0: String(parseInt(line, 10) - 1),
              column0: String(parseInt(column, 10) - 1),
            };

            const href = settings.pattern.replace(
              /\[([a-z]+\d?)\]/g,
              (m, key: keyof typeof values) =>
                values.hasOwnProperty(key) ? values[key] : m
            );

            if (/^https?:\/\//.test(href)) {
              return {
                href,
                onClick(e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) {
                  e.preventDefault();
                  fetch(href);
                },
              };
            }

            return { href };
          } catch (e) {}
        }

        return undefined;
      },
    };
  }, [settings]);

  React.useEffect(() => {
    remoteSubscriber.ns("open-source-settings").subscribe(settings => {
      setSettings(settings);
    });
  }, []);

  return (
    <OpenFileContext.Provider value={value}>
      {children}
    </OpenFileContext.Provider>
  );
}

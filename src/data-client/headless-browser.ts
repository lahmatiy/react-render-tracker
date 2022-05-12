import fs from "fs";
import path from "path";
import * as ns from "./index";

type DataClient = typeof ns;
type LazyDataClient = {
  [T in keyof DataClient]: (...args: Parameters<DataClient[T]>) => Promise<any>;
};
type JSHandler = {
  evaluate<T extends keyof DataClient>(
    fn: (
      exports: DataClient,
      name: T,
      ...args: Parameters<DataClient[T]>
    ) => void
  ): Promise<ReturnType<DataClient[T]>>;
  getProperties(): Promise<Map<keyof DataClient, any>>;
};
type HeadlessBrowserPage = {
  on(event: string, callback: () => void): void;
  evaluateHandle(fn: (...args: any[]) => any): JSHandler;
} & (
  | {
      addInitScript(fn: string | (() => void)): Promise<void>;
    }
  | {
      evaluateOnNewDocument(fn: string | (() => void)): Promise<void>;
    }
);

const distFolder = __dirname;
const scripts = {
  "react-render-tracker": path.join(distFolder, "react-render-tracker.js"),
  "data-client": path.join(distFolder, "data-client.js"),
};

function readScript(name: keyof typeof scripts) {
  return fs.readFileSync(scripts[name], "utf8");
}

function readScriptWithExports<T>(name: keyof typeof scripts) {
  const exportSymbols: (keyof T)[] = [];
  const source = readScript(name).replace(
    /export(\{.+?\})/,
    (_: any, e: string) =>
      "const api=" +
      e.replace(/([a-z]+) as ([a-z]+)/gi, (_, localName, exportName) => {
        exportSymbols.push(exportName);

        return `${exportName}:${localName}`;
      }) +
      ";return api.isReady().then(()=>api)"
  );

  return {
    source,
    exportSymbols,
  };
}

async function initDataClient(page: HeadlessBrowserPage) {
  const dataClient = Object.create(null);
  const module = readScriptWithExports("data-client");
  const dataClientHandle = await page.evaluateHandle(
    new Function(module.source) as () => Promise<DataClient>
  );

  for (const name of (await dataClientHandle.getProperties()).keys()) {
    dataClient[name] = <T extends keyof DataClient>(
      ...args: Parameters<DataClient[T]>
    ) =>
      // TODO: get rid of "as any"
      (dataClientHandle.evaluate as any)(
        (
          client: DataClient,
          name: keyof DataClient,
          ...args: Parameters<DataClient[T]>
        ) => (client[name] as any)(...args), // TODO: get rid of "as any"
        name,
        ...args
      );
  }

  return dataClient as LazyDataClient;
}

module.exports = async function newPageDataClient(page: HeadlessBrowserPage) {
  let pageSessionDataClient: Promise<LazyDataClient>;
  const addInitScript =
    "addInitScript" in page ? page.addInitScript : page.evaluateOnNewDocument;

  addInitScript.call(page, readScript("react-render-tracker"));
  page.on("framenavigated", () => {
    pageSessionDataClient = initDataClient(page);
  });

  const client: LazyDataClient = Object.create(null);
  const { exportSymbols } =
    readScriptWithExports<LazyDataClient>("data-client");
  for (const method of exportSymbols) {
    client[method] = async (
      ...args: Parameters<LazyDataClient[typeof method]>
    ) => ((await pageSessionDataClient)[method] as any)(...args);
  }

  return client;
};

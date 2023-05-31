import * as ns from "./index";

type DataClient = typeof ns;
type LazyDataClient = {
  [T in keyof DataClient]: (...args: Parameters<DataClient[T]>) => Promise<any>;
};
type JSHandlerPayload<T extends keyof DataClient> = {
  name: T;
  args: Parameters<DataClient[T]>;
};
type JSHandler = {
  evaluate<T extends keyof DataClient>(
    fn: (
      exports: DataClient,
      payload: JSHandlerPayload<T>
    ) => ReturnType<DataClient[T]>,
    payload: JSHandlerPayload<T>
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

declare const __RRT_SOURCE__ = "source of dist/react-render-tracker.js";
declare const __DATA_CLIENT_SOURCE__ = "source of dist/data-client.js";
const RRT_SOURCE = __RRT_SOURCE__;
const DATA_CLIENT_SOURCE = __DATA_CLIENT_SOURCE__;
type ScriptSource = typeof RRT_SOURCE | typeof DATA_CLIENT_SOURCE;

function readScriptWithExports<T>(scriptSource: ScriptSource) {
  const exportSymbols: (keyof T)[] = [];
  const source = scriptSource.replace(
    /export\s*(\{(.|\s)+?\})/,
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

async function initDataClient(
  page: HeadlessBrowserPage,
  module: ReturnType<typeof readScriptWithExports<DataClient>>
) {
  const dataClient = Object.create(null);
  const dataClientHandle = await page.evaluateHandle(
    new Function(module.source) as () => Promise<DataClient>
  );

  for (const name of module.exportSymbols) {
    dataClient[name] = <T extends keyof DataClient>(
      ...args: Parameters<DataClient[T]>
    ) =>
      dataClientHandle.evaluate(
        (client: DataClient, { name, args }) => (client[name] as any)(...args), // TODO: get rid of "as any"
        { name, args }
      );
  }

  return dataClient as LazyDataClient;
}

module.exports = async function newPageDataClient(page: HeadlessBrowserPage) {
  let pageSessionDataClient: Promise<LazyDataClient>;
  const dataClientModule =
    readScriptWithExports<DataClient>(DATA_CLIENT_SOURCE);
  const addInitScript =
    "addInitScript" in page ? page.addInitScript : page.evaluateOnNewDocument;

  addInitScript.call(page, RRT_SOURCE);
  page.on("framenavigated", () => {
    pageSessionDataClient = initDataClient(page, dataClientModule);
  });

  const client: LazyDataClient = Object.create(null);

  for (const method of dataClientModule.exportSymbols) {
    client[method] = async (
      ...args: Parameters<LazyDataClient[typeof method]>
    ) => ((await pageSessionDataClient)[method] as any)(...args);
  }

  return client;
};

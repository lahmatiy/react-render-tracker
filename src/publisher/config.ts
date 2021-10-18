type OpenSourceSettings = {
  pattern: string;
  root: string;
  base: string;
};
let config: { inpage?: boolean; openSourceLoc?: OpenSourceSettings } = {};

function normOpenSourceLoc(
  value: Partial<OpenSourceSettings> | string | undefined
): OpenSourceSettings | undefined {
  if (!value) {
    return undefined;
  }

  let {
    // eslint-disable-next-line prefer-const
    pattern,
    root = "",
    base = "",
  } = typeof value === "string" ? { pattern: value } : value;

  if (typeof pattern !== "string") {
    return undefined;
  } else {
    pattern = /^[a-z]+:/.test(pattern)
      ? pattern
      : new URL(pattern, location.origin).href;
  }

  if (typeof root !== "string") {
    root = "";
  } else {
    root = root.trim().replace(/\\/g, "/").replace(/\/+$/, "");
  }

  if (typeof base !== "string") {
    base = "";
  } else {
    base = base
      .trim()
      .replace(/\\/g, "/")
      .replace(/^\/+|\/+$/g, "");
    base = base ? `/${base}/` : "/";
  }

  return { pattern, root, base };
}

if (typeof document !== "undefined") {
  const rawConfig = document.currentScript?.dataset.config;

  if (typeof rawConfig === "string") {
    try {
      const parsedConfig: Omit<typeof config, "openSourceLoc"> & {
        openSourceLoc?: string | Partial<OpenSourceSettings>;
      } = Function(`return{${rawConfig}}`)();
      const parsedOpenSourceSettings = normOpenSourceLoc(
        parsedConfig.openSourceLoc
      );

      config = {
        ...parsedConfig,
        openSourceLoc: parsedOpenSourceSettings,
      };
    } catch (error) {
      console.error(
        `[React Render Tracker] Config parse error\nConfig: ${rawConfig}\n`,
        error
      );
    }
  }
}

export default config;

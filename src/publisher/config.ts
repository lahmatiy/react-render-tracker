type OpenSourceSettings = {
  pattern: string;
  projectRoot: string;
  basedir: string;
  basedirJsx: string;
};
let config: { inpage?: boolean; openSourceLoc?: OpenSourceSettings } = {};

function normBasedir(basedir: string) {
  basedir = basedir
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "");
  basedir = basedir ? `/${basedir}/` : "/";
  return basedir;
}

function normOpenSourceLoc(
  value: Partial<OpenSourceSettings> | string | undefined
): OpenSourceSettings | undefined {
  if (!value) {
    return undefined;
  }

  let {
    // eslint-disable-next-line prefer-const
    pattern,
    projectRoot = "",
    basedir = "",
    basedirJsx = null,
  } = typeof value === "string" ? { pattern: value } : value;

  if (typeof pattern !== "string") {
    return undefined;
  } else {
    pattern = /^[a-z]+:/.test(pattern)
      ? pattern
      : new URL(pattern, location.origin).href;
  }

  if (typeof projectRoot !== "string") {
    projectRoot = "";
  } else {
    projectRoot = projectRoot.trim().replace(/\\/g, "/").replace(/\/+$/, "");
  }

  basedir = typeof basedir !== "string" ? "" : normBasedir(basedir);
  basedirJsx =
    typeof basedirJsx !== "string" ? basedir : normBasedir(basedirJsx);

  return { pattern, projectRoot, basedir, basedirJsx };
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

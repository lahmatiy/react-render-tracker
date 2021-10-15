let config: { inpage?: boolean; openFileUrl?: string } = {};

if (typeof document !== "undefined") {
  const rawConfig = document.currentScript?.dataset.config || "";

  try {
    config = Function(`return{${rawConfig}}`)();
  } catch (error) {
    console.error(
      `[React Render Tracker] Config parse error\nConfig: ${rawConfig}\n`,
      error
    );
  }
}

export default config;

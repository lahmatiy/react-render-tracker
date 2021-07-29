import { ReactRenderer } from "../types";

export function detectReactBuildType(renderer: ReactRenderer) {
  try {
    if (typeof renderer.version === "string") {
      // React DOM Fiber (16+)
      if (renderer.bundleType > 0) {
        // This is not a production build.
        // We are currently only using 0 (PROD) and 1 (DEV)
        // but might add 2 (PROFILE) in the future.
        return "development";
      }

      // React 16 uses flat bundles. If we report the bundle as production
      // version, it means we also minified and envified it ourselves.
      return "production";
      // Note: There is still a risk that the CommonJS entry point has not
      // been envified or uglified. In this case the user would have *both*
      // development and production bundle, but only the prod one would run.
      // This would be really bad. We have a separate check for this because
      // it happens *outside* of the renderer injection. See `checkDCE` below.
    }

    const toString = Function.prototype.toString;
    if (renderer.Mount && renderer.Mount._renderNewRootComponent) {
      // React DOM Stack
      const renderRootCode = toString.call(
        renderer.Mount._renderNewRootComponent
      );
      // Filter out bad results (if that is even possible):
      if (renderRootCode.indexOf("function") !== 0) {
        // Hope for the best if we're not sure.
        return "production";
      }
      // Check for React DOM Stack < 15.1.0 in development.
      // If it contains "storedMeasure" call, it's wrapped in ReactPerf (DEV only).
      // This would be true even if it's minified, as method name still matches.
      if (renderRootCode.indexOf("storedMeasure") !== -1) {
        return "development";
      }
      // For other versions (and configurations) it's not so easy.
      // Let's quickly exclude proper production builds.
      // If it contains a warning message, it's either a DEV build,
      // or an PROD build without proper dead code elimination.
      if (renderRootCode.indexOf("should be a pure function") !== -1) {
        // Now how do we tell a DEV build from a bad PROD build?
        // If we see NODE_ENV, we're going to assume this is a dev build
        // because most likely it is referring to an empty shim.
        if (renderRootCode.indexOf("NODE_ENV") !== -1) {
          return "development";
        }
        // If we see "development", we're dealing with an envified DEV build
        // (such as the official React DEV UMD).
        if (renderRootCode.indexOf("development") !== -1) {
          return "development";
        }
        // I've seen process.env.NODE_ENV !== 'production' being smartly
        // replaced by `true` in DEV by Webpack. I don't know how that
        // works but we can safely guard against it because `true` was
        // never used in the function source since it was written.
        if (renderRootCode.indexOf("true") !== -1) {
          return "development";
        }
        // By now either it is a production build that has not been minified,
        // or (worse) this is a minified development build using non-standard
        // environment (e.g. "staging"). We're going to look at whether
        // the function argument name is mangled:
        if (
          // 0.13 to 15
          renderRootCode.indexOf("nextElement") !== -1 ||
          // 0.12
          renderRootCode.indexOf("nextComponent") !== -1
        ) {
          // We can't be certain whether this is a development build or not,
          // but it is definitely unminified.
          return "unminified";
        } else {
          // This is likely a minified development build.
          return "development";
        }
      }
      // By now we know that it's envified and dead code elimination worked,
      // but what if it's still not minified? (Is this even possible?)
      // Let's check matches for the first argument name.
      if (
        // 0.13 to 15
        renderRootCode.indexOf("nextElement") !== -1 ||
        // 0.12
        renderRootCode.indexOf("nextComponent") !== -1
      ) {
        return "unminified";
      }
      // Seems like we're using the production version.
      // However, the branch above is Stack-only so this is 15 or earlier.
      return "outdated";
    }
  } catch (err) {
    // Weird environments may exist.
    // This code needs a higher fault tolerance
    // because it runs even with closed DevTools.
    // TODO: should we catch errors in all injected code, and not just this part?
  }
  return "production";
}

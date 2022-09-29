import versionGreaterThanOrEqual from "semver/functions/gte";
import { ReactInternals, RendererBundleType } from "../types";

const MIN_SUPPORTED_VERSION = "16.9.0";
const BUNDLE_TYPE_PROD = 0;
const BUNDLE_TYPE_DEV = 1;

type RendererInfoProps = Pick<
  ReactInternals,
  "rendererPackageName" | "version" | "bundleType" | "injectProfilingHooks"
>;

function resolveBundleType(
  bundleType: number | undefined,
  version: string,
  injectProfilingHooks: (() => void) | undefined
): RendererBundleType {
  if (bundleType === BUNDLE_TYPE_DEV) {
    return "development";
  }

  if (bundleType === BUNDLE_TYPE_PROD) {
    if (
      version !== "unknown" &&
      versionGreaterThanOrEqual(version, "18.0.0") &&
      typeof injectProfilingHooks === "function"
    ) {
      return "profiling";
    }

    return "production";
  }

  return "unknown";
}

export function getRendererInfo({
  rendererPackageName,
  version,
  bundleType,
  injectProfilingHooks,
}: RendererInfoProps) {
  if (typeof version !== "string" || !/^\d+\.\d+\.\d+(-\S+)?$/.test(version)) {
    version = "unknown";
  }

  return {
    name: rendererPackageName || "unknown",
    version,
    bundleType: resolveBundleType(bundleType, version, injectProfilingHooks),
  };
}

export function isUnsupportedRenderer(renderer: RendererInfoProps) {
  const info = getRendererInfo(renderer);

  if (info.name !== "react-dom" && info.name !== "react-native-renderer") {
    return {
      reason: `Unsupported renderer name, only "react-dom" is supported`,
      info,
    };
  }

  if (
    info.version === "unknown" ||
    !versionGreaterThanOrEqual(info.version, MIN_SUPPORTED_VERSION)
  ) {
    return {
      reason: `Unsupported renderer version, only v${MIN_SUPPORTED_VERSION}+ is supported`,
      info,
    };
  }

  if (info.bundleType !== "development") {
    return {
      reason: `Unsupported renderer bundle type "${info.bundleType}" (${renderer.bundleType}), only "development" (${BUNDLE_TYPE_DEV}) is supported`,
      info,
    };
  }

  return false;
}

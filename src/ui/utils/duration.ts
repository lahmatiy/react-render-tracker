export function formatDuration(duration: number) {
  if (duration >= 100) {
    duration = Math.round(duration);

    if (duration >= 10000) {
      return (duration / 1000).toFixed(1) + "s";
    }

    return duration + "ms";
  }

  return duration.toFixed(1) + "ms";
}

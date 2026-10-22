/**
 * Tiny timing helper for finding slow steps. Silent unless PERF_LOG=1 is set
 * (add `PERF_LOG=1` to .env.local, restart, and watch the terminal for "[perf] ..." lines).
 */
export async function timed<T>(label: string, fn: () => PromiseLike<T> | T): Promise<T> {
  if (process.env.PERF_LOG !== "1") return await fn();
  const start = performance.now();
  try {
    return await fn();
  } finally {
    console.log(`[perf] ${label} ${Math.round(performance.now() - start)}ms`);
  }
}

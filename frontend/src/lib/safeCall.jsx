export async function safeCall(fn, defaultValue = null) {
  try {
    const result = await fn();
    return {
      success: true,
      data: result ?? defaultValue,
      error: null
    };
  } catch (err) {
    return {
      success: false,
      data: defaultValue,
      error: err.message || "Unknown error"
    };
  }
}

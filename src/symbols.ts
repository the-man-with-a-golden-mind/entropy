/** Stores the reactive key-path prefix on reactive objects and functions */
export const enPrefix = Symbol('@en/prefix');

/**
 * Set on functions returned as the *result* of a computed call.
 * Prevents the proxy get-trap from calling them a second time.
 * Replaces the original DONT_CALL symbol hack – kept in a WeakSet on the
 * context so there is no property mutation on arbitrary user functions.
 */
export const COMPUTED_RESULT_TAG = Symbol('@en/computed-result');

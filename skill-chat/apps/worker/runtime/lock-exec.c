#include <errno.h>
#include <seccomp.h>

// Called by the trusted runtime wrapper before any user code. The inherited
// filter cannot be removed by the guest, including through native/FFI code.
int hashcod_lock_exec(void) {
  scmp_filter_ctx filter = seccomp_init(SCMP_ACT_ALLOW);
  if (!filter) return -1;
  int result = seccomp_attr_set(filter, SCMP_FLTATR_CTL_NNP, 0);
  if (!result) result = seccomp_attr_set(filter, SCMP_FLTATR_CTL_TSYNC, 1);
  if (!result) result = seccomp_rule_add(filter, SCMP_ACT_ERRNO(EPERM), SCMP_SYS(execve), 0);
  if (!result) result = seccomp_rule_add(filter, SCMP_ACT_ERRNO(EPERM), SCMP_SYS(execveat), 0);
  if (!result) result = seccomp_load(filter);
  seccomp_release(filter);
  return result;
}

#ifdef HASHCOD_NODE
#include <node_api.h>
static napi_value initialize(napi_env env, napi_value exports) {
  if (hashcod_lock_exec() != 0) {
    napi_throw_error(env, "SANDBOX_EXEC_LOCK", "Runtime execution lock unavailable");
    return NULL;
  }
  return exports;
}
NAPI_MODULE(NODE_GYP_MODULE_NAME, initialize)
#endif

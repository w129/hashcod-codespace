"""Narrow mandatory Linux syscall launcher; no untrusted Python execution.

Landlock confines paths; seccomp denies network, process-memory inspection and
process-group escape; limits constrain native allocations. There is no fallback.
"""
import ctypes
import errno
import os
import resource
import sys

READ_FILE, READ_DIR, EXEC = 4, 8, 1
ALL_FS = (1 << 15) - 1  # Landlock ABI 3 includes REFER and TRUNCATE.


def restrict(input_dir, output_dir, runtime_dir):
    if os.getuid() == 0 or os.getuid() != 53219:
        raise RuntimeError('dedicated_unprivileged_uid_required')
    libc = ctypes.CDLL(None, use_errno=True)
    libc.syscall.restype = ctypes.c_long
    if libc.prctl(38, 1, 0, 0, 0) != 0:
        raise RuntimeError('no_new_privs_unavailable')
    if libc.prctl(4, 0, 0, 0, 0) != 0:
        raise RuntimeError('dumpable_control_unavailable')
    affinity = sorted(os.sched_getaffinity(0))
    os.sched_setaffinity(0, affinity[:1])
    abi = libc.syscall(444, 0, 0, 1)
    if abi < 3:
        raise RuntimeError('landlock_abi3_required')
    class Ruleset(ctypes.Structure):
        _fields_ = [('handled_access_fs', ctypes.c_uint64)]
    class PathRule(ctypes.Structure):
        _pack_ = 1
        _fields_ = [('allowed_access', ctypes.c_uint64), ('parent_fd', ctypes.c_int)]
    ruleset = Ruleset(ALL_FS)
    fd = libc.syscall(444, ctypes.byref(ruleset), ctypes.sizeof(ruleset), 0)
    if fd < 0:
        raise RuntimeError('landlock_ruleset_unavailable')
    try:
        paths = [(input_dir, READ_FILE | READ_DIR), (output_dir, ALL_FS & ~EXEC),
                 (runtime_dir, READ_FILE | READ_DIR), ('/usr/lib', READ_FILE | READ_DIR),
                 ('/usr/lib64', READ_FILE | READ_DIR),
                 ('/lib', READ_FILE | READ_DIR), ('/lib64', READ_FILE | READ_DIR),
                 ('/dev/null', READ_FILE | 2), ('/dev/urandom', READ_FILE),
                 ('/dev/random', READ_FILE), ('/etc/localtime', READ_FILE)]
        # glibc pthread_getattr_np needs the main thread's own stack map.
        # The rule anchors this PID's inode, not the /proc tree or other PIDs.
        paths.append(('/proc/self/maps', READ_FILE))
        for exe in ['node/bin/node', 'dart/bin/dart', 'dart/bin/dartaotruntime', 'dart/bin/dartvm']:
            paths.append((runtime_dir + '/' + exe, EXEC | READ_FILE))
        # ELF exec also checks its PT_INTERP loader. Permit the exact Debian
        # amd64 loader, without allowing executable programs under /usr or /lib.
        paths.append(('/lib64/ld-linux-x86-64.so.2', EXEC | READ_FILE))
        for path, access in paths:
            if not os.path.exists(path):
                continue
            parent = os.open(path, os.O_PATH | os.O_CLOEXEC)
            try:
                entry = PathRule(access, parent)
                if libc.syscall(445, fd, 1, ctypes.byref(entry), 0) != 0:
                    raise RuntimeError('landlock_path_failed')
            finally:
                os.close(parent)
        if libc.syscall(446, fd, 0) != 0:
            raise RuntimeError('landlock_restrict_failed')
    finally:
        os.close(fd)
    resource.setrlimit(resource.RLIMIT_CPU, (5, 5))
    # Native V8/Dart reserve multi-GiB virtual address space, not resident memory.
    # DATA bounds anonymous mappings; supervisor independently enforces aggregate
    # process-group RSS 256MiB and kills the group on breach every 10ms.
    resource.setrlimit(resource.RLIMIT_AS, (8 * 1024 ** 3, 8 * 1024 ** 3))
    resource.setrlimit(resource.RLIMIT_DATA, (256 * 1024 ** 2, 256 * 1024 ** 2))
    resource.setrlimit(resource.RLIMIT_FSIZE, (16 * 1024 ** 2, 16 * 1024 ** 2))
    resource.setrlimit(resource.RLIMIT_NOFILE, (64, 64))
    resource.setrlimit(resource.RLIMIT_NPROC, (32, 32))
    resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
    sec = ctypes.CDLL('libseccomp.so.2', use_errno=True)
    sec.seccomp_init.argtypes = [ctypes.c_uint32]
    sec.seccomp_init.restype = ctypes.c_void_p
    sec.seccomp_rule_add.argtypes = [ctypes.c_void_p, ctypes.c_uint32, ctypes.c_int, ctypes.c_uint]
    sec.seccomp_syscall_resolve_name.argtypes = [ctypes.c_char_p]
    sec.seccomp_syscall_resolve_name.restype = ctypes.c_int
    sec.seccomp_load.argtypes = [ctypes.c_void_p]
    sec.seccomp_release.argtypes = [ctypes.c_void_p]
    ctx = sec.seccomp_init(0x7fff0000)
    if not ctx:
        raise RuntimeError('seccomp_unavailable')
    try:
        denied = ['socket', 'connect', 'bind', 'listen', 'accept', 'accept4', 'sendto', 'sendmsg',
                  'recvfrom', 'recvmsg', 'ptrace', 'process_vm_readv', 'process_vm_writev',
                  'kill', 'tkill', 'rt_sigqueueinfo', 'pidfd_open', 'pidfd_getfd', 'pidfd_send_signal',
                  'mount', 'umount2', 'pivot_root', 'chroot', 'unshare', 'setns',
                  'bpf', 'keyctl', 'add_key', 'request_key', 'perf_event_open', 'userfaultfd',
                  'reboot', 'kexec_load', 'init_module', 'finit_module', 'delete_module', 'iopl', 'ioperm',
                  'fsopen', 'fsconfig', 'fsmount', 'move_mount', 'open_tree', 'mount_setattr', 'open_by_handle_at', 'name_to_handle_at',
                  'setsid', 'setpgid', 'setrlimit', 'memfd_create', 'execveat', 'chmod', 'fchmod', 'fchmodat', 'fchmodat2',
                  'chown', 'fchown', 'fchownat', 'lchown', 'setuid', 'setgid', 'setreuid',
                  'setregid', 'setresuid', 'setresgid', 'setgroups', 'capset', 'io_uring_setup',
                  'io_uring_enter', 'io_uring_register', 'prctl']
        for name in denied:
            number = sec.seccomp_syscall_resolve_name(name.encode())
            if number >= 0 and sec.seccomp_rule_add(ctx, 0x50000 | errno.EPERM, number, 0) != 0:
                raise RuntimeError('seccomp_rule_failed')
        # Native runtimes need read-only prlimit64 (pthread stack bounds) and
        # FIONBIO on stdio pipes. No limit mutation or other ioctl is permitted.
        class Compare(ctypes.Structure):
            _fields_ = [('arg', ctypes.c_uint), ('op', ctypes.c_uint),
                        ('datum_a', ctypes.c_uint64), ('datum_b', ctypes.c_uint64)]
        sec.seccomp_rule_add_array.argtypes = [ctypes.c_void_p, ctypes.c_uint32, ctypes.c_int, ctypes.c_uint, ctypes.POINTER(Compare)]
        for syscall, arg, value in [('prlimit64', 2, 0), ('ioctl', 1, 0x5421),
                                    ('tgkill', 0, os.getpid()), ('rt_tgsigqueueinfo', 0, os.getpid())]:
            comparison = Compare(arg, 1, value, 0)  # SCMP_CMP_NE
            number = sec.seccomp_syscall_resolve_name(syscall.encode())
            if number >= 0 and sec.seccomp_rule_add_array(ctx, 0x50000 | errno.EPERM, number, 1, ctypes.byref(comparison)) != 0:
                raise RuntimeError('seccomp_conditional_failed')
        # glibc requires ENOSYS to fall back to clone for native SDK threads.
        clone3 = sec.seccomp_syscall_resolve_name(b'clone3')
        if clone3 >= 0 and sec.seccomp_rule_add(ctx, 0x50000 | errno.ENOSYS, clone3, 0) != 0:
            raise RuntimeError('seccomp_clone3_failed')
        if sec.seccomp_load(ctx) != 0:
            raise RuntimeError('seccomp_load_failed')
    finally:
        sec.seccomp_release(ctx)
    os.umask(0o077)
    os.chdir(input_dir)


if __name__ == '__main__':
    try:
        if len(sys.argv) < 6:
            raise RuntimeError('invalid_launcher_arguments')
        restrict(os.path.realpath(sys.argv[1]), os.path.realpath(sys.argv[2]), os.path.realpath(sys.argv[3]))
        os.execv(sys.argv[4], sys.argv[4:])
    except Exception as error:
        # Fixed launcher reasons contain neither paths nor secret values.
        print('Sandbox unavailable: ' + str(error), file=sys.stderr)
        sys.exit(125)

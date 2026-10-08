"""Trusted launcher. Fail closed before importing/executing any untrusted source."""
import ctypes
import ctypes.util
import errno
import os
import resource
import sys


def restrict(directory, readonly=False, compilation=False):
    libc = ctypes.CDLL(None, use_errno=True)
    libc.syscall.restype=ctypes.c_long
    if libc.prctl(38,1,0,0,0)!=0: raise RuntimeError('no_new_privs')
    # Constrain native pools even when the host reports every physical core.
    allowed=sorted(os.sched_getaffinity(0))
    os.sched_setaffinity(0,allowed[:2])
    abi=libc.syscall(444,0,0,1)
    class Ruleset(ctypes.Structure): _fields_=[('handled_access_fs',ctypes.c_uint64)]
    class Path(ctypes.Structure):
        _pack_=1
        _fields_=[('allowed_access',ctypes.c_uint64),('parent_fd',ctypes.c_int)]
    mask=(1<<15)-1
    rule=Ruleset(mask)
    fd=libc.syscall(444,ctypes.byref(rule),ctypes.sizeof(rule),0) if abi>=3 else -1
    try:
        # Native scanners initialize OpenSSL even for offline scans. Permit
        # only its public config/trust anchors, never /etc/ssl/private.
        for path,access in ([(directory,1|4|8 if readonly else mask),('/usr',1|4|8),('/lib',1|4|8),('/lib64',1|4|8),('/etc/ssl/certs',4|8),('/etc/ssl/openssl.cnf',4),('/dev/null',2|4),('/dev/urandom',4)] if fd>=0 else []):
            if not os.path.exists(path): continue
            pfd=os.open(path,os.O_PATH|os.O_CLOEXEC)
            try:
                entry=Path(access,pfd)
                if libc.syscall(445,fd,1,ctypes.byref(entry),0)!=0: raise RuntimeError('landlock_path')
            finally: os.close(pfd)
        if fd>=0 and libc.syscall(446,fd,0)!=0: raise RuntimeError('landlock_restrict')
    finally:
        if fd>=0: os.close(fd)
    sec=ctypes.CDLL(ctypes.util.find_library('seccomp') or 'libseccomp.so.2')
    sec.seccomp_init.argtypes=[ctypes.c_uint32]; sec.seccomp_init.restype=ctypes.c_void_p
    sec.seccomp_rule_add.argtypes=[ctypes.c_void_p,ctypes.c_uint32,ctypes.c_int,ctypes.c_uint]
    sec.seccomp_load.argtypes=[ctypes.c_void_p]; sec.seccomp_release.argtypes=[ctypes.c_void_p]
    sec.seccomp_syscall_resolve_name.argtypes=[ctypes.c_char_p]; sec.seccomp_syscall_resolve_name.restype=ctypes.c_int
    ctx=sec.seccomp_init(0x7fff0000)
    if not ctx: raise RuntimeError('seccomp_init')
    try:
        # socketpair supplies anonymous local IPC for the trusted scanner's
        # event loop. Creating/connecting/listening on network sockets is denied.
        for name in ['socket','connect','bind','listen','accept','accept4','sendto','sendmsg','recvfrom','recvmsg',
                     'ptrace','process_vm_readv','process_vm_writev','kill','tkill','tgkill','mount','umount2','pivot_root','chroot',
                     'unshare','setns','bpf','keyctl','add_key','request_key','perf_event_open','userfaultfd','reboot','kexec_load']+(['setsid','setpgid'] if compilation else []):
            number=sec.seccomp_syscall_resolve_name(name.encode())
            if number>=0 and sec.seccomp_rule_add(ctx,0x50000|errno.EPERM,number,0)!=0: raise RuntimeError('seccomp_rule')
        if sec.seccomp_load(ctx)!=0: raise RuntimeError('seccomp_load')
    finally: sec.seccomp_release(ctx)
    resource.setrlimit(resource.RLIMIT_CPU,(20,20))
    # Go/Node reserve large virtual ranges. Guest linear memory is independently
    # capped at 256MiB; container memory limits bound native analyzer residency.
    resource.setrlimit(resource.RLIMIT_AS,(8*1024*1024*1024,8*1024*1024*1024))
    file_limit=(128 if compilation else 1)*1024*1024
    resource.setrlimit(resource.RLIMIT_FSIZE,(file_limit,file_limit))
    resource.setrlimit(resource.RLIMIT_NOFILE,(64,64))
    # Linux counts this per real UID, including sibling containers on a shared
    # host. Keep a finite ceiling with room for those existing native threads.
    # Submitted code has no host process/thread imports through WASI.
    resource.setrlimit(resource.RLIMIT_NPROC,(512,512))
    resource.setrlimit(resource.RLIMIT_CORE,(0,0))


if __name__=='__main__':
    try:
        restrict(os.path.realpath(sys.argv[1]),sys.argv[2] in ('readonly','vm'),sys.argv[2] in ('vm','compiler'))
        os.chdir(sys.argv[1])
    except Exception as error:
        if os.environ.get('REVIEW_STARTUP_DIAGNOSTIC')=='1': print('Launcher startup: '+type(error).__name__+': '+str(error),file=sys.stderr)
        sys.exit(125)
    os.execv(sys.argv[3],sys.argv[3:])

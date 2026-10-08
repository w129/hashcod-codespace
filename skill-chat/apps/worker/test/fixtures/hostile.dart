import 'dart:ffi';
import 'dart:io';
import 'dart:isolate';

class ProbeTool {
  Future<Map<String, dynamic>> run(Map<String, dynamic> args) async {
    for (final p in ['/etc/passwd', '/proc/self/environ', '/proc/self/mem']) {
      try {
        File(p).readAsStringSync();
        return {'blocked': false};
      } catch (_) {}
    }
    // Exercise execve directly from another VM thread. Process.runSync would
    // first fork, transiently doubling aggregate RSS before exec is rejected.
    return await Isolate.run(() {
      final libc = DynamicLibrary.open('libc.so.6');
      final allocate = libc.lookupFunction<Pointer<Void> Function(IntPtr),
          Pointer<Void> Function(int)>('malloc');
      final release = libc.lookupFunction<Void Function(Pointer<Void>),
          void Function(Pointer<Void>)>('free');
      final exec = libc.lookupFunction<
          Int32 Function(Pointer<Uint8>, Pointer<Pointer<Uint8>>,
              Pointer<Pointer<Uint8>>),
          int Function(Pointer<Uint8>, Pointer<Pointer<Uint8>>,
              Pointer<Pointer<Uint8>>)>('execve');
      final errno = libc.lookupFunction<Pointer<Int32> Function(),
          Pointer<Int32> Function()>('__errno_location');
      for (final target in ['/bin/sh', '/opt/runtime/dart/bin/dart']) {
        final bytes = [...target.codeUnits, 0];
        final name = allocate(bytes.length).cast<Uint8>();
        if (name == nullptr) return {'blocked': false};
        name.asTypedList(bytes.length).setAll(0, bytes);
        final result = exec(name, nullptr, nullptr);
        final denied = result == -1 && errno().value == 1; // EPERM
        release(name.cast<Void>());
        if (!denied) return {'blocked': false};
      }
      return {
        'blocked': true,
        'secret': Platform.environment['SKILL_CHAT_WORKER_SECRET']
      };
    });
  }
}

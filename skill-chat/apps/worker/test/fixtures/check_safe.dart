// Herramienta generada por Hashcod Codespace
class CheckSafeTool {
  static const name = "check_safe";
  static const description = "line\n\"quote\"' #{process.exit()} \$secret\\tail";
  Map<String, dynamic> run(Map<String, dynamic> args) {
    final text = args["text"];
    if (text == null) throw ArgumentError("Falta text");
    if (text != null && text is! String) throw ArgumentError("text debe ser string");
    final count = args["count"];
    if (count != null && count is! num) throw ArgumentError("count debe ser number");
    final enabled = args["enabled"];
    if (enabled == null) throw ArgumentError("Falta enabled");
    if (enabled != null && enabled is! bool) throw ArgumentError("enabled debe ser boolean");
    final data = args["data"];
    if (data != null && data is! Map<String, dynamic>) throw ArgumentError("data debe ser object");
    return {'ok': true, 'args': args};
  }
}

# Herramienta generada por Hashcod Codespace
module.exports =
  name: "check_safe"
  description: "line\n\"quote\"' \#{process.exit()} $secret\\tail"
  params: [{"name":"text","type":"string","required":true},{"name":"count","type":"number","required":false},{"name":"enabled","type":"boolean","required":true},{"name":"data","type":"object","required":false}]
  run: (args = {}) ->
    throw new Error "Argumentos inválidos" unless args? and typeof args is "object" and not Array.isArray(args)
    throw new Error "Falta text" unless Object::hasOwnProperty.call(args, "text") and args["text"]?
    if args["text"]?
      throw new Error "text debe ser string" unless typeof args["text"] is "string"
    if args["count"]?
      throw new Error "count debe ser number" unless typeof args["count"] is "number"
    throw new Error "Falta enabled" unless Object::hasOwnProperty.call(args, "enabled") and args["enabled"]?
    if args["enabled"]?
      throw new Error "enabled debe ser boolean" unless typeof args["enabled"] is "boolean"
    if args["data"]?
      throw new Error "data debe ser object" unless typeof args["data"] is "object" and not Array.isArray(args["data"])
    return { ok: true, args }

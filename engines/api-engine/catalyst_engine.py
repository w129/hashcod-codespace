#!/usr/bin/env python3
"""
Motor Catalizador de 4 ENV y Controlador de Almacenamiento API para Hashcod Codespace.
Implementa el flujo de comunicación de 4 variables de entorno:
  - Pareja Macho (Canal /a y /a.): ENV_1 -> ENV_3 (1 vía / 1 vía con puente a /b)
  - Pareja Hembra (Canal /b y /b.): ENV_2 <-> ENV_4 (2 vías / reactivo a peticiones)
Registra todo el tráfico en catalizadores (.log) Macho y Hembra.
"""

import os
import sys
import json
import time
import hashlib
import secrets
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', '..'))
DATA_DIR = os.path.join(PROJECT_DIR, 'data_storage')
LOGS_DIR = os.path.join(DATA_DIR, 'catalyst_logs')
STATE_FILE = os.path.join(DATA_DIR, 'catalyst_state.json')

os.makedirs(LOGS_DIR, exist_ok=True)

MACHO_LOG_FILE = os.path.join(LOGS_DIR, 'catalyst_macho.log')
HEMBRA_LOG_FILE = os.path.join(LOGS_DIR, 'catalyst_hembra.log')


class CatalystEngine:
    def __init__(self):
        self.state = self.load_state()

    def default_state(self):
        return {
            "macho": {
                "active": True,
                "mode": "IDLE", # IDLE, ONE_WAY, BRIDGED_ONE_WAY
                "channel": "/a",
                "flow": "ENV_1 -> ENV_3",
                "env_1": {
                    "key_id": "KEY-M1-" + secrets.token_hex(4).upper(),
                    "token": secrets.token_hex(16),
                    "buffer": "init_tx_stream",
                    "transfers_count": 0,
                    "last_sync": None
                },
                "env_3": {
                    "key_id": "KEY-M3-" + secrets.token_hex(4).upper(),
                    "token": secrets.token_hex(16),
                    "buffer": "init_rx_stream",
                    "transfers_count": 0,
                    "last_sync": None
                }
            },
            "hembra": {
                "active": False,
                "mode": "IDLE", # IDLE, TWO_WAY, REACTIVE_TWO_WAY
                "channel": "/b",
                "flow": "ENV_2 <-> ENV_4",
                "env_2": {
                    "key_id": "KEY-H2-" + secrets.token_hex(4).upper(),
                    "token": secrets.token_hex(16),
                    "buffer": "duplex_stream_a",
                    "transfers_count": 0,
                    "last_sync": None
                },
                "env_4": {
                    "key_id": "KEY-H4-" + secrets.token_hex(4).upper(),
                    "token": secrets.token_hex(16),
                    "buffer": "duplex_stream_b",
                    "transfers_count": 0,
                    "last_sync": None
                }
            },
            "bridge_connected": False,
            "total_cycles": 0,
            "storage_volumes": [
                {"id": "vol-01", "name": "workspace-primary", "pool": "local-nvme", "size_gb": 50, "status": "mounted", "path": os.path.join(PROJECT_DIR, 'workspace').replace('\\', '/')},
                {"id": "vol-02", "name": "catalyst-stream", "pool": "fast-cache", "size_gb": 20, "status": "active", "path": LOGS_DIR.replace('\\', '/')},
                {"id": "vol-03", "name": "api-soda-share", "pool": "soda-controller", "size_gb": 100, "status": "standby", "path": DATA_DIR.replace('\\', '/')}
            ],
            "last_operation": "Dual-Catalyst 4-ENV Engine Initialized",
            "updated_at": datetime.now().astimezone().isoformat()
        }

    def load_state(self):
        if os.path.exists(STATE_FILE):
            try:
                with open(STATE_FILE, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return data
            except Exception:
                pass
        st = self.default_state()
        self.save_state(st)
        return st

    def save_state(self, state=None):
        if state is not None:
            self.state = state
        self.state["updated_at"] = datetime.now().astimezone().isoformat()
        with open(STATE_FILE, 'w', encoding='utf-8') as f:
            json.dump(self.state, f, indent=4, ensure_ascii=False)

    def log_catalyst(self, is_macho, msg, payload_meta=None):
        target_file = MACHO_LOG_FILE if is_macho else HEMBRA_LOG_FILE
        tag = "MACHO" if is_macho else "HEMBRA"
        ts = datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
        meta_str = f" | {json.dumps(payload_meta)}" if payload_meta else ""
        log_line = f"[{ts} UTC] [{tag}] {msg}{meta_str}\n"
        with open(target_file, 'a', encoding='utf-8') as f:
            f.write(log_line)

    def execute_a(self, action="activate", param=""):
        """Maneja comandos /a y /a."""
        action = action.lower()
        if action == "activate":
            self.state["macho"]["active"] = True
            self.state["macho"]["mode"] = "ONE_WAY"
            self.cycle_macho_one_way("Manual activation (/a activate)")
            self.save_state()
            return {
                "ok": True,
                "channel": "/a",
                "side": "macho",
                "mode": "ONE_WAY (1 Vía: ENV_1 -> ENV_3)",
                "status": "ACTIVE",
                "message": "Canal Macho activado en modo 1 vía independiente (ENV_1 -> ENV_3) sin pedir información a /b."
            }
        elif action == "deactivate":
            self.state["macho"]["active"] = False
            self.state["macho"]["mode"] = "IDLE"
            self.log_catalyst(True, "Canal Macho desactivado (/a deactivate)")
            self.save_state()
            return {"ok": True, "channel": "/a", "status": "INACTIVE", "message": "Canal Macho desactivado."}
        elif action == "status":
            return {"ok": True, "channel": "/a", "state": self.state["macho"]}
        else:
            return self.cycle_macho_one_way(f"Exec: {action} {param}".strip())

    def execute_a_dot(self, action="activate", param=""):
        """Maneja comandos /a. (1 vía comunicándose con /b)."""
        self.state["macho"]["active"] = True
        self.state["macho"]["mode"] = "BRIDGED_ONE_WAY"
        self.state["bridge_connected"] = True
        
        cycle_res = self.cycle_macho_bridged(f"Bridged exec (/a.): {action} {param}".strip())
        self.save_state()
        cycle_res["message"] = "Canal Macho /a. ejecutado: transmisión 1 vía comunicada con el subsistema /b."
        return cycle_res

    def execute_b(self, action="activate", param=""):
        """Maneja comandos /b y /b."""
        action = action.lower()
        if action == "activate":
            self.state["hembra"]["active"] = True
            self.state["hembra"]["mode"] = "TWO_WAY"
            self.cycle_hembra_two_way("Manual activation (/b activate)")
            self.save_state()
            return {
                "ok": True,
                "channel": "/b",
                "side": "hembra",
                "mode": "TWO_WAY (2 Vías: ENV_2 <-> ENV_4)",
                "status": "ACTIVE",
                "message": "Canal Hembra activado en modo 2 vías independiente (ENV_2 <-> ENV_4)."
            }
        elif action == "deactivate":
            self.state["hembra"]["active"] = False
            self.state["hembra"]["mode"] = "IDLE"
            self.log_catalyst(False, "Canal Hembra desactivado (/b deactivate)")
            self.save_state()
            return {"ok": True, "channel": "/b", "status": "INACTIVE", "message": "Canal Hembra desactivado."}
        elif action == "status":
            return {"ok": True, "channel": "/b", "state": self.state["hembra"]}
        else:
            return self.cycle_hembra_two_way(f"Exec: {action} {param}".strip())

    def execute_b_dot(self, action="activate", param=""):
        """Maneja comandos /b. (2 vías reactivo cuando recibe petición)."""
        self.state["hembra"]["active"] = True
        self.state["hembra"]["mode"] = "REACTIVE_TWO_WAY"
        
        res = self.cycle_hembra_reactive(f"Reactive trigger (/b.): {action} {param}".strip())
        self.save_state()
        res["message"] = "Canal Hembra /b. en espera y activado por petición entrante (2 vías reactivo)."
        return res

    def cycle_macho_one_way(self, trigger_info="Command exec"):
        """Pasa llaves y datos de ENV_1 -> ENV_3 (1 sola vía)"""
        m = self.state["macho"]
        m["env_1"]["transfers_count"] += 1
        m["env_3"]["transfers_count"] += 1
        
        new_packet = secrets.token_hex(8)
        m["env_1"]["token"] = secrets.token_hex(16)
        m["env_3"]["token"] = m["env_1"]["token"]
        m["env_1"]["buffer"] = f"tx_packet_{m['env_1']['transfers_count']}_{new_packet}"
        m["env_3"]["buffer"] = m["env_1"]["buffer"]
        
        now = datetime.now().astimezone().isoformat()
        m["env_1"]["last_sync"] = now
        m["env_3"]["last_sync"] = now
        self.state["total_cycles"] += 1
        self.state["last_operation"] = f"Macho 1-Way Transfer: ENV_1 -> ENV_3 ({trigger_info})"
        
        self.log_catalyst(True, f"[1-WAY TRANSFER] ENV_1 -> ENV_3 | Trigger: {trigger_info}", {
            "key_1": m["env_1"]["key_id"],
            "key_3": m["env_3"]["key_id"],
            "packet": new_packet,
            "cycle": self.state["total_cycles"]
        })
        return {
            "ok": True,
            "flow": "ENV_1 -> ENV_3",
            "mode": "MACHO_ONE_WAY (/a)",
            "cycle": self.state["total_cycles"],
            "packet": new_packet
        }

    def cycle_macho_bridged(self, trigger_info="Bridged command"):
        """Pasa llaves de ENV_1 -> ENV_3 y envía petición al canal /b (ENV_2 / ENV_4)"""
        m_res = self.cycle_macho_one_way(trigger_info + " [SENDING BRIDGE TO /b]")
        
        h = self.state["hembra"]
        h["env_2"]["buffer"] = f"bridged_from_macho_{m_res['packet']}"
        h["env_2"]["transfers_count"] += 1
        h["env_2"]["last_sync"] = datetime.now().astimezone().isoformat()
        
        self.log_catalyst(True, f"[BRIDGED 1-WAY -> /b] ENV_1 -> ENV_3 -> BRIDGE(ENV_2) | {trigger_info}", {
            "bridge_packet": m_res["packet"],
            "target_env": "ENV_2"
        })
        self.log_catalyst(False, f"[INCOMING FROM /a.] Handshake recibido en ENV_2 desde Macho | Packet: {m_res['packet']}")
        
        return {
            "ok": True,
            "flow": "ENV_1 -> ENV_3 => BRIDGE -> ENV_2/ENV_4",
            "mode": "MACHO_BRIDGED_ONE_WAY (/a.)",
            "packet": m_res["packet"],
            "bridge_status": "COMMUNICATED_WITH_B"
        }

    def cycle_hembra_two_way(self, trigger_info="Duplex exec"):
        """Intercambio 2 vías entre ENV_2 <-> ENV_4"""
        h = self.state["hembra"]
        h["env_2"]["transfers_count"] += 1
        h["env_4"]["transfers_count"] += 1
        
        token_2 = secrets.token_hex(16)
        token_4 = secrets.token_hex(16)
        h["env_2"]["token"] = token_2
        h["env_4"]["token"] = token_4
        
        h["env_2"]["buffer"] = f"duplex_inout_2_{secrets.token_hex(6)}"
        h["env_4"]["buffer"] = f"duplex_inout_4_{secrets.token_hex(6)}"
        
        now = datetime.now().astimezone().isoformat()
        h["env_2"]["last_sync"] = now
        h["env_4"]["last_sync"] = now
        self.state["total_cycles"] += 1
        self.state["last_operation"] = f"Hembra 2-Way Duplex: ENV_2 <-> ENV_4 ({trigger_info})"
        
        self.log_catalyst(False, f"[2-WAY DUPLEX] ENV_2 <-> ENV_4 | Trigger: {trigger_info}", {
            "key_2": h["env_2"]["key_id"],
            "key_4": h["env_4"]["key_id"],
            "duplex_sync": True,
            "cycle": self.state["total_cycles"]
        })
        return {
            "ok": True,
            "flow": "ENV_2 <-> ENV_4",
            "mode": "HEMBRA_TWO_WAY (/b)",
            "cycle": self.state["total_cycles"]
        }

    def cycle_hembra_reactive(self, trigger_info="Reactive trigger"):
        """Activación 2 vías reactiva al recibir petición"""
        res = self.cycle_hembra_two_way("REACTIVE TRIGGER (" + trigger_info + ")")
        self.log_catalyst(False, f"[REACTIVE TRIGGER 2-WAY] Activado al recibir petición | {trigger_info}")
        res["mode"] = "HEMBRA_REACTIVE_TWO_WAY (/b.)"
        return res

    def on_bash_command_executed(self, command, cwd, is_ok):
        """Disparador universal: se ejecuta en cada comando de la bash"""
        cmd_trim = command.strip()
        if cmd_trim.startswith('/a.'):
            parts = cmd_trim.split(None, 2)
            act = parts[1] if len(parts) > 1 else "activate"
            param = parts[2] if len(parts) > 2 else ""
            return self.execute_a_dot(act, param)
        elif cmd_trim.startswith('/b.'):
            parts = cmd_trim.split(None, 2)
            act = parts[1] if len(parts) > 1 else "activate"
            param = parts[2] if len(parts) > 2 else ""
            return self.execute_b_dot(act, param)
        elif cmd_trim.startswith('/a'):
            parts = cmd_trim.split(None, 2)
            act = parts[1] if len(parts) > 1 else "activate"
            param = parts[2] if len(parts) > 2 else ""
            return self.execute_a(act, param)
        elif cmd_trim.startswith('/b'):
            parts = cmd_trim.split(None, 2)
            act = parts[1] if len(parts) > 1 else "activate"
            param = parts[2] if len(parts) > 2 else ""
            return self.execute_b(act, param)

        # Si el Macho está activo, cicla 1 vía
        if self.state["macho"].get("active"):
            if self.state["macho"].get("mode") == "BRIDGED_ONE_WAY":
                self.cycle_macho_bridged(f"Bash Cmd: {command}")
            else:
                self.cycle_macho_one_way(f"Bash Cmd: {command}")

        # Si la Hembra está activa, cicla 2 vías
        if self.state["hembra"].get("active"):
            if self.state["hembra"].get("mode") == "REACTIVE_TWO_WAY":
                self.cycle_hembra_reactive(f"Bash Cmd: {command}")
            else:
                self.cycle_hembra_two_way(f"Bash Cmd: {command}")

        self.save_state()
        return {"ok": True, "event": "cycled"}

    def get_logs(self, channel="all", limit=50):
        logs = {"macho": [], "hembra": []}
        if os.path.exists(MACHO_LOG_FILE):
            with open(MACHO_LOG_FILE, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()
                logs["macho"] = [l.strip() for l in lines[-limit:]]
        if os.path.exists(HEMBRA_LOG_FILE):
            with open(HEMBRA_LOG_FILE, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()
                logs["hembra"] = [l.strip() for l in lines[-limit:]]
        
        if channel == "macho":
            return {"ok": True, "logs": logs["macho"]}
        if channel == "hembra":
            return {"ok": True, "logs": logs["hembra"]}
        return {"ok": True, "logs": logs}


if __name__ == "__main__":
    engine = CatalystEngine()
    if len(sys.argv) > 1:
        cmd = sys.argv[1]
        arg1 = sys.argv[2] if len(sys.argv) > 2 else "activate"
        arg2 = sys.argv[3] if len(sys.argv) > 3 else ""
        
        if cmd in ["/a", "a", "macho"]:
            res = engine.execute_a(arg1, arg2)
            print(json.dumps(res, indent=2))
        elif cmd in ["/a.", "a.", "macho_dot"]:
            res = engine.execute_a_dot(arg1, arg2)
            print(json.dumps(res, indent=2))
        elif cmd in ["/b", "b", "hembra"]:
            res = engine.execute_b(arg1, arg2)
            print(json.dumps(res, indent=2))
        elif cmd in ["/b.", "b.", "hembra_dot"]:
            res = engine.execute_b_dot(arg1, arg2)
            print(json.dumps(res, indent=2))
        elif cmd == "status":
            print(json.dumps(engine.state, indent=2))
        elif cmd == "logs":
            print(json.dumps(engine.get_logs(arg1), indent=2))
        elif cmd == "hook":
            is_ok = (arg2 == "1" or arg2 == "true")
            res = engine.on_bash_command_executed(arg1, "workspace", is_ok)
            print(json.dumps(res, indent=2))
        else:
            print(json.dumps({"error": f"Comando desconocido: {cmd}"}))
    else:
        print(json.dumps(engine.state, indent=2))

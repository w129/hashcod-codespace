#!/usr/bin/env python3
"""
Controlador de Almacenamiento API (SODA / OpenSDS & Local Storage Bridge).
Permite gestionar volúmenes, pools, transferencias y sincronización con el workspace central.
"""

import os
import sys
import json
import shutil
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', '..'))
WORKSPACE_DIR = os.path.join(PROJECT_DIR, 'workspace')
STORAGE_DATA_FILE = os.path.join(PROJECT_DIR, 'data_storage', 'soda_storage.json')

class SodaStorageController:
    def __init__(self):
        self.data = self.load_data()

    def default_data(self):
        return {
            "pools": [
                {"id": "pool-nvme-01", "name": "NVMe Primary Storage", "total_gb": 500, "free_gb": 342, "type": "block", "status": "online"},
                {"id": "pool-cloud-02", "name": "SODA Distributed Cloud Pool", "total_gb": 2000, "free_gb": 1840, "type": "file", "status": "online"},
                {"id": "pool-cache-03", "name": "Dual-Catalyst Fast Cache", "total_gb": 64, "free_gb": 58, "type": "memory_buffer", "status": "active"}
            ],
            "fileshares": [
                {"id": "share-ws-01", "name": "workspace-share", "pool": "pool-nvme-01", "mount_point": "/workspace", "size_gb": 50, "protocol": "NFS/POSIX", "status": "available"},
                {"id": "share-logs-02", "name": "catalyst-logs-share", "pool": "pool-cache-03", "mount_point": "/data_storage/catalyst_logs", "size_gb": 20, "protocol": "POSIX", "status": "available"}
            ],
            "docks": [
                {"id": "dock-node-01", "name": "Localhost Storage Dock", "driver": "soda-posix-driver", "endpoint": "127.0.0.1:50040", "status": "ready"}
            ]
        }

    def load_data(self):
        if os.path.exists(STORAGE_DATA_FILE):
            try:
                with open(STORAGE_DATA_FILE, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception:
                pass
        d = self.default_data()
        self.save_data(d)
        return d

    def save_data(self, data=None):
        if data is not None:
            self.data = data
        with open(STORAGE_DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, indent=4, ensure_ascii=False)

    def list_pools(self):
        return {"ok": True, "pools": self.data.get("pools", [])}

    def list_fileshares(self):
        return {"ok": True, "fileshares": self.data.get("fileshares", [])}

    def create_fileshare(self, name, size_gb=10, pool_id="pool-nvme-01"):
        new_share = {
            "id": f"share-{len(self.data.get('fileshares', [])) + 1:02d}",
            "name": name,
            "pool": pool_id,
            "mount_point": f"/workspace/{name}",
            "size_gb": int(size_gb),
            "protocol": "NFS/POSIX",
            "status": "available",
            "created_at": datetime.utcnow().isoformat() + "Z"
        }
        self.data.setdefault("fileshares", []).append(new_share)
        self.save_data()
        
        # Crear subdirectorio en workspace si no existe
        target_dir = os.path.join(WORKSPACE_DIR, name)
        os.makedirs(target_dir, exist_ok=True)
        
        return {"ok": True, "fileshare": new_share}


if __name__ == "__main__":
    ctrl = SodaStorageController()
    if len(sys.argv) > 1:
        action = sys.argv[1]
        if action == "pools":
            print(json.dumps(ctrl.list_pools(), indent=2))
        elif action == "shares":
            print(json.dumps(ctrl.list_fileshares(), indent=2))
        elif action == "create":
            name = sys.argv[2] if len(sys.argv) > 2 else "share_auto"
            size = sys.argv[3] if len(sys.argv) > 3 else "10"
            print(json.dumps(ctrl.create_fileshare(name, size), indent=2))
        else:
            print(json.dumps(ctrl.data, indent=2))
    else:
        print(json.dumps(ctrl.data, indent=2))

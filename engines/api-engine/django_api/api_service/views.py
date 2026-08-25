
import os
import json
import sys
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

# Import catalyst engine
ENGINE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if ENGINE_PATH not in sys.path:
    sys.path.insert(0, ENGINE_PATH)

from catalyst_engine import CatalystEngine
from storage_controller import SodaStorageController

catalyst_instance = CatalystEngine()
storage_instance = SodaStorageController()

@csrf_exempt
def api_status(request):
    return JsonResponse({
        "ok": True,
        "framework": "Django 6.1 on Python 3.12",
        "engine": "Hashcod Codespace Dual-Catalyst 4-ENV Storage API",
        "catalyst_state": catalyst_instance.state,
        "storage_pools": storage_instance.list_pools().get("pools", []),
        "status": "ONLINE"
    })

@csrf_exempt
def execute_channel(request, channel):
    body = {}
    if request.method == 'POST':
        try:
            body = json.loads(request.body.decode('utf-8'))
        except Exception:
            pass
    action = body.get('action', request.GET.get('action', 'activate'))
    param = body.get('param', request.GET.get('param', ''))
    
    if channel == 'a':
        res = catalyst_instance.execute_a(action, param)
    elif channel == 'a_dot':
        res = catalyst_instance.execute_a_dot(action, param)
    elif channel == 'b':
        res = catalyst_instance.execute_b(action, param)
    elif channel == 'b_dot':
        res = catalyst_instance.execute_b_dot(action, param)
    else:
        res = {"ok": False, "error": f"Canal desconocido: {channel}"}
    return JsonResponse(res)

@csrf_exempt
def get_catalyst_logs(request):
    channel = request.GET.get('channel', 'all')
    limit = int(request.GET.get('limit', 50))
    res = catalyst_instance.get_logs(channel, limit)
    return JsonResponse(res)

@csrf_exempt
def storage_action(request):
    action = request.GET.get('action', 'list')
    if action == 'pools':
        return JsonResponse(storage_instance.list_pools())
    elif action == 'shares':
        return JsonResponse(storage_instance.list_fileshares())
    return JsonResponse({"ok": True, "data": storage_instance.data})

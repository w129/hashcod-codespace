
from django.urls import path
from . import views

urlpatterns = [
    path('status/', views.api_status, name='api_status'),
    path('channel/<str:channel>/', views.execute_channel, name='execute_channel'),
    path('logs/', views.get_catalyst_logs, name='get_catalyst_logs'),
    path('storage/', views.storage_action, name='storage_action'),
]

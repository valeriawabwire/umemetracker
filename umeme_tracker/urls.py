from django.urls import path, include
from tracker import views

urlpatterns = [
    path("", views.index, name="index"),
    path("", include("tracker.urls")),
]

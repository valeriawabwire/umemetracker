from django.urls import path
from . import pwa, views

urlpatterns = [
    path("sw.js", pwa.service_worker, name="service_worker"),
    path("api/households/", views.household_create, name="household_create"),
    path("api/households/login/", views.household_login, name="household_login"),
    path("api/households/<int:household_id>/purchases/", views.purchases, name="purchases"),
    path("api/purchases/<int:purchase_id>/", views.purchase_detail, name="purchase_detail"),
    path("api/households/<int:household_id>/appliances/", views.appliances, name="appliances"),
    path("api/appliances/<int:appliance_id>/", views.appliance_detail, name="appliance_detail"),
]

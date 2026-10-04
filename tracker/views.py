from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .helpers import bad, clean_appliance, clean_purchase, get_household, get_json
from .models import ApplianceEntry, Household, TokenPurchase


def index(request):
    return render(request, "index.html")


def household_to_dict(h):
    return {"id": h.id, "name": h.name, "meter_number": h.meter_number}


def purchase_to_dict(p):
    return {
        "id": p.id,
        "date": p.date.isoformat(),
        "amount_paid": float(p.amount_paid),
        "units_bought": float(p.units_bought),
        "meter_reading": float(p.meter_reading),
    }


def appliance_to_dict(a):
    return {
        "id": a.id,
        "name": a.name,
        "watts": a.watts,
        "quantity": a.quantity,
        "hours_per_day": float(a.hours_per_day),
    }


@csrf_exempt
@require_http_methods(["POST"])
def household_create(request):
    data = get_json(request)
    if data is None:
        return bad("Invalid request.")
    name = str(data.get("name", "")).strip()
    meter = str(data.get("meter_number", "")).strip()
    pin = str(data.get("pin", "")).strip()
    if not name or len(name) > 100:
        return bad("Enter a household name (100 characters max).")
    if not meter.isalnum() or not (4 <= len(meter) <= 30):
        return bad("Enter a valid meter number (letters and digits only).")
    if len(pin) != 4 or not pin.isdigit():
        return bad("PIN must be exactly 4 digits.")
    if Household.objects.filter(meter_number=meter).exists():
        return bad("That meter number is already registered. Use 'Switch household' to sign in.", 409)
    household = Household.objects.create(name=name, meter_number=meter, pin=pin)
    return JsonResponse(household_to_dict(household), status=201)


@csrf_exempt
@require_http_methods(["POST"])
def household_login(request):
    data = get_json(request)
    if data is None:
        return bad("Invalid request.")
    meter = str(data.get("meter_number", "")).strip()
    pin = str(data.get("pin", "")).strip()
    household = Household.objects.filter(meter_number=meter).first()
    if household is None or household.pin != pin:
        return bad("Wrong meter number or PIN.", 401)
    return JsonResponse(household_to_dict(household))


@csrf_exempt
@require_http_methods(["GET", "POST"])
def purchases(request, household_id):
    household, error = get_household(request, household_id)
    if error:
        return error
    if request.method == "GET":
        return JsonResponse([purchase_to_dict(p) for p in household.purchases.all()], safe=False)
    data = get_json(request)
    if data is None:
        return bad("Invalid request.")
    cleaned, message = clean_purchase(data)
    if message:
        return bad(message)
    purchase = TokenPurchase.objects.create(household=household, **cleaned)
    return JsonResponse(purchase_to_dict(purchase), status=201)


@csrf_exempt
@require_http_methods(["PUT", "DELETE"])
def purchase_detail(request, purchase_id):
    purchase = TokenPurchase.objects.filter(pk=purchase_id).first()
    if purchase is None:
        return bad("Purchase not found.", 404)
    household, error = get_household(request, purchase.household_id)
    if error:
        return error
    if request.method == "DELETE":
        purchase.delete()
        return JsonResponse({"ok": True})
    data = get_json(request)
    if data is None:
        return bad("Invalid request.")
    cleaned, message = clean_purchase(data)
    if message:
        return bad(message)
    for field, value in cleaned.items():
        setattr(purchase, field, value)
    purchase.save()
    return JsonResponse(purchase_to_dict(purchase))


@csrf_exempt
@require_http_methods(["GET", "POST"])
def appliances(request, household_id):
    household, error = get_household(request, household_id)
    if error:
        return error
    if request.method == "GET":
        return JsonResponse([appliance_to_dict(a) for a in household.appliances.all()], safe=False)
    data = get_json(request)
    if data is None:
        return bad("Invalid request.")
    cleaned, message = clean_appliance(data)
    if message:
        return bad(message)
    entry = ApplianceEntry.objects.create(household=household, **cleaned)
    return JsonResponse(appliance_to_dict(entry), status=201)


@csrf_exempt
@require_http_methods(["DELETE"])
def appliance_detail(request, appliance_id):
    entry = ApplianceEntry.objects.filter(pk=appliance_id).first()
    if entry is None:
        return bad("Appliance not found.", 404)
    household, error = get_household(request, entry.household_id)
    if error:
        return error
    entry.delete()
    return JsonResponse({"ok": True})

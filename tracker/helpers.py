import json
from datetime import date
from decimal import Decimal, InvalidOperation

from django.http import JsonResponse

from .models import Household


def bad(message, status=400):
    return JsonResponse({"error": message}, status=status)


def get_json(request):
    try:
        data = json.loads(request.body.decode("utf-8") or "{}")
    except (ValueError, UnicodeDecodeError):
        return None
    return data if isinstance(data, dict) else None


def to_decimal(value, places="0.01"):
    try:
        number = Decimal(str(value))
    except (InvalidOperation, ValueError):
        return None
    if not number.is_finite() or abs(number) >= Decimal("100000000"):
        return None
    return number.quantize(Decimal(places))


def get_household(request, household_id):
    """Returns (household, None) if the PIN header matches, else (None, error_response)."""
    household = Household.objects.filter(pk=household_id).first()
    if household is None:
        return None, bad("Household not found.", 404)
    if request.headers.get("X-Household-Pin", "") != household.pin:
        return None, bad("Wrong or missing PIN. Please unlock the app again.", 401)
    return household, None


def clean_purchase(data):
    try:
        purchase_date = date.fromisoformat(str(data.get("date", "")))
    except ValueError:
        return None, "Enter a valid date."
    if purchase_date > date.today():
        return None, "The date cannot be in the future."
    amount = to_decimal(data.get("amount_paid"))
    units = to_decimal(data.get("units_bought"))
    meter = to_decimal(data.get("meter_reading"))
    if amount is None or amount <= 0:
        return None, "Amount paid must be greater than zero."
    if units is None or units <= 0:
        return None, "Units bought must be greater than zero."
    if meter is None or meter < 0:
        return None, "Meter reading must be zero or more."
    return {
        "date": purchase_date,
        "amount_paid": amount,
        "units_bought": units,
        "meter_reading": meter,
    }, None


def clean_appliance(data):
    name = str(data.get("name", "")).strip()
    if not name or len(name) > 60:
        return None, "Appliance name is required (60 characters max)."
    watts = to_decimal(data.get("watts"), "1")
    quantity = to_decimal(data.get("quantity"), "1")
    hours = to_decimal(data.get("hours_per_day"), "0.1")
    if watts is None or not (1 <= watts <= 20000):
        return None, "Watts must be between 1 and 20000."
    if quantity is None or not (1 <= quantity <= 50):
        return None, "Quantity must be between 1 and 50."
    if hours is None or not (0 < hours <= 24):
        return None, "Hours per day must be more than 0 and at most 24."
    return {
        "name": name,
        "watts": int(watts),
        "quantity": int(quantity),
        "hours_per_day": hours,
    }, None

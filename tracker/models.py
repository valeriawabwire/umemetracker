from django.db import models


class Household(models.Model):
    name = models.CharField(max_length=100)
    meter_number = models.CharField(max_length=30, unique=True)
    pin = models.CharField(max_length=4)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.meter_number})"


class TokenPurchase(models.Model):
    household = models.ForeignKey(Household, on_delete=models.CASCADE, related_name="purchases")
    date = models.DateField()
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    units_bought = models.DecimalField(max_digits=10, decimal_places=2)
    # Units on the meter when logging, BEFORE the new units are added
    meter_reading = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        ordering = ["date", "id"]

    def __str__(self):
        return f"{self.household.name} - {self.date} - {self.units_bought} units"


class ApplianceEntry(models.Model):
    household = models.ForeignKey(Household, on_delete=models.CASCADE, related_name="appliances")
    name = models.CharField(max_length=60)
    watts = models.PositiveIntegerField()
    quantity = models.PositiveIntegerField(default=1)
    hours_per_day = models.DecimalField(max_digits=4, decimal_places=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.name} x{self.quantity} ({self.household.name})"

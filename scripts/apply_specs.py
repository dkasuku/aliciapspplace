"""
Writes the Key Features sheet onto every phone in one database session.

    cd backend && python ../scripts/apply_specs.py [--dry]

The Node sync talks HTTP per product, which is fine locally but crawls against
a remote managed Postgres. This does the same work in a single transaction.
Reads scripts/catalog.json for the variants and scripts/phone-specs.json for
the per-model sheet.
"""

import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend"))

from app import app, db, Product  # noqa: E402

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
DRY = "--dry" in sys.argv

SPEC_ORDER = [
    "RAM", "Internal Storage", "Display", "OS", "Chipset",
    "Cameras", "Network", "Connectivity", "Battery", "Colors",
]

OS_BY_BRAND = {
    "Apple": "iOS",
    "Samsung": "Android (One UI)",
    "Tecno": "Android (HiOS)",
    "Infinix": "Android (XOS)",
    "Vivo": "Android (Funtouch OS)",
    "Xiaomi": "Android (HyperOS)",
}


def load(name):
    with open(os.path.join(ROOT, "scripts", name), encoding="utf-8") as handle:
        return json.load(handle)


def name_for(p):
    base = p["model"] if p["brand"] == "Apple" else f"{p['brand']} {p['model']}"
    spec = f"{p['ram']}GB + {p['storage']}GB" if p.get("ram") else f"{p['storage']}GB"
    return f"{base} {spec}"


def spec_key(p):
    return p["model"] if p["brand"] == "Apple" else f"{p['brand']} {p['model']}"


def specs_for(p, sheets):
    sheet = sheets.get(spec_key(p), {})
    values = {
        "RAM": f"{p['ram']}GB" if p.get("ram") else sheet.get("RAM"),
        "Internal Storage": f"{p['storage']}GB",
        "Display": sheet.get("Display"),
        "OS": sheet.get("OS") or OS_BY_BRAND.get(p["brand"]),
        "Chipset": sheet.get("Chipset"),
        "Cameras": sheet.get("Cameras"),
        "Network": sheet.get("Network") or ("5G" if p.get("network") == "5G" else "4G LTE"),
        "Connectivity": sheet.get("Connectivity") or "Wi-Fi, Bluetooth, GPS",
        "Battery": sheet.get("Battery"),
        "Colors": sheet.get("Colors"),
    }
    return [{"label": k, "value": str(values[k])} for k in SPEC_ORDER if values.get(k)]


def main():
    phones = load("catalog.json")["phones"]
    sheets = load("phone-specs.json")["models"]

    with app.app_context():
        products = {p.name.strip().lower(): p for p in Product.query.all()}
        print(f"catalogue: {len(products)} products · price list: {len(phones)} phones"
              f"{'  [DRY RUN]' if DRY else ''}\n")

        updated = missing = unchanged = 0
        absent = []

        for phone in phones:
            name = name_for(phone)
            product = products.get(name.lower())
            if product is None:
                absent.append(name)
                missing += 1
                continue

            wanted = specs_for(phone, sheets)
            current = json.loads(product.specs) if product.specs else []
            if current == wanted:
                unchanged += 1
                continue

            if not DRY:
                product.specs = json.dumps(wanted)
            print(f"  {name:<44} {len(current)} -> {len(wanted)} rows")
            updated += 1

        if not DRY:
            db.session.commit()

        print(f"\nupdated {updated} · already correct {unchanged} · not in catalogue {missing}")
        if absent:
            print("Not found (run scripts/sync-catalog.mjs to create them):")
            for name in absent[:15]:
                print(f"  · {name}")
            if len(absent) > 15:
                print(f"  … and {len(absent) - 15} more")


if __name__ == "__main__":
    main()

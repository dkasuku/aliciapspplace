from flask import Flask, request, jsonify, g
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
from datetime import datetime, timezone
import uuid as uuid_lib
from werkzeug.security import generate_password_hash, check_password_hash
import json
import os

load_dotenv()

app = Flask(__name__)
CORS(app)
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "postgresql://localhost:5432/alicia_phone_place")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
# Managed Postgres drops idle connections, which otherwise surface as a 500 on
# the first request after a quiet spell. Test the connection before handing it
# out, and retire it well before the provider does.
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_pre_ping": True,
    "pool_recycle": 280,
}
db = SQLAlchemy(app)


# ── Models ───────────────────────────────────────────────────────────────────

product_category = db.Table(
    "product_category",
    db.Column("product_id", db.String(36), db.ForeignKey("product.id"), primary_key=True),
    db.Column("category_id", db.String(36), db.ForeignKey("category.id"), primary_key=True),
)


class Category(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(120), nullable=False, unique=True)
    slug = db.Column(db.String(140), nullable=False, unique=True)
    description = db.Column(db.Text, nullable=True)
    image_url = db.Column(db.String(500), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "description": self.description,
            "image_url": self.image_url,
            "is_active": self.is_active,
        }


class Product(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(220), nullable=False)
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.Float, nullable=False, default=0)
    sales_price = db.Column(db.Float, nullable=True)
    currency = db.Column(db.String(10), default="KES")
    sku = db.Column(db.String(100), nullable=True)
    barcode = db.Column(db.String(100), nullable=True)
    images = db.Column(db.Text, nullable=True)  # JSON array as string
    status = db.Column(db.String(20), default="active")  # active, draft, inactive
    stock = db.Column(db.Integer, default=0)
    low_stock_threshold = db.Column(db.Integer, default=5)
    # "sale" for outright purchase, "rental" for Lipa Pole Pole.
    product_type = db.Column(db.String(20), default="sale")
    rental_terms = db.Column(db.Text, nullable=True)
    # Key features shown on the product page: JSON array of {label, value}.
    specs = db.Column(db.Text, nullable=True)
    # Which channels the product appears in. Hidden from both = shop record only.
    visible_on_site = db.Column(db.Boolean, default=True)
    visible_in_pos = db.Column(db.Boolean, default=True)
    # The branch this product is stocked in. Each shop keeps its own copy and stock.
    shop_id = db.Column(db.String(36), nullable=True, index=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    categories = db.relationship("Category", secondary=product_category, backref="products")

    def to_dict(self):
        import json

        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "description": self.description,
            "price": self.price,
            "sales_price": self.sales_price,
            "currency": self.currency,
            "sku": self.sku,
            "barcode": self.barcode,
            "images": json.loads(self.images) if self.images else [],
            "status": self.status,
            "stock": self.stock,
            "low_stock_threshold": self.low_stock_threshold,
            "product_type": self.product_type or "sale",
            "rental_terms": self.rental_terms,
            "specs": json.loads(self.specs) if self.specs else [],
            "visible_on_site": True if self.visible_on_site is None else self.visible_on_site,
            "visible_in_pos": True if self.visible_in_pos is None else self.visible_in_pos,
            "categories": [c.name for c in self.categories],
            "shop_id": self.shop_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Sale(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    receipt_no = db.Column(db.String(50), unique=True, nullable=False)
    total = db.Column(db.Float, nullable=False, default=0)
    subtotal = db.Column(db.Float, nullable=False, default=0)
    tax = db.Column(db.Float, default=0)
    discount = db.Column(db.Float, default=0)
    delivery_fee = db.Column(db.Float, default=0)
    fulfilment = db.Column(db.String(20), default="pickup")
    delivery_address = db.Column(db.String(500), nullable=True)
    payment_method = db.Column(db.String(30), default="cash")
    customer_name = db.Column(db.String(200), nullable=True)
    customer_phone = db.Column(db.String(50), nullable=True)
    status = db.Column(db.String(20), default="completed")
    shop_id = db.Column(db.String(36), nullable=True, index=True)
    sold_by_id = db.Column(db.String(36), nullable=True)
    sold_by_name = db.Column(db.String(120), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    items = db.relationship("SaleItem", backref="sale", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "receipt_no": self.receipt_no,
            "total": self.total,
            "subtotal": self.subtotal,
            "tax": self.tax,
            "discount": self.discount,
            "delivery_fee": self.delivery_fee or 0,
            "fulfilment": self.fulfilment or "pickup",
            "delivery_address": self.delivery_address,
            "payment_method": self.payment_method,
            "customer_name": self.customer_name,
            "customer_phone": self.customer_phone,
            "status": self.status,
            "shop_id": self.shop_id,
            "sold_by_id": self.sold_by_id,
            "sold_by_name": self.sold_by_name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "items": [item.to_dict() for item in self.items],
        }


class SaleItem(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    sale_id = db.Column(db.String(36), db.ForeignKey("sale.id"), nullable=False)
    product_id = db.Column(db.String(36), db.ForeignKey("product.id"), nullable=True)
    product_name = db.Column(db.String(200), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    unit_price = db.Column(db.Float, nullable=False, default=0)
    total = db.Column(db.Float, nullable=False, default=0)

    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "product_name": self.product_name,
            "quantity": self.quantity,
            "unit_price": self.unit_price,
            "total": self.total,
        }


class Rental(db.Model):
    """A Lipa Pole Pole agreement: a phone paid off in daily instalments."""
    id = db.Column(db.String(36), primary_key=True)
    product_id = db.Column(db.String(36), nullable=True)
    product_name = db.Column(db.String(200), nullable=False)
    product_type = db.Column(db.String(40), default="phone")
    customer_name = db.Column(db.String(200), nullable=False)
    customer_phone = db.Column(db.String(50), nullable=False)
    customer_email = db.Column(db.String(200), nullable=True)
    id_number = db.Column(db.String(60), nullable=False)
    id_image = db.Column(db.Text, nullable=True)
    total_amount = db.Column(db.Float, default=0)
    amount_paid = db.Column(db.Float, default=0)
    daily_payment = db.Column(db.Float, default=0)
    payment_duration_days = db.Column(db.Integer, default=0)
    start_date = db.Column(db.String(40), nullable=True)
    expected_end_date = db.Column(db.String(40), nullable=True)
    loan_company = db.Column(db.String(120), nullable=True)
    status = db.Column(db.String(30), default="pending")
    payments_json = db.Column(db.Text, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def payments(self):
        try:
            return json.loads(self.payments_json) if self.payments_json else []
        except (ValueError, TypeError):
            return []

    def to_dict(self):
        paid = float(self.amount_paid or 0)
        return {
            "id": self.id,
            "product_id": self.product_id,
            "product_name": self.product_name,
            "product_type": self.product_type or "phone",
            "customer_name": self.customer_name,
            "customer_phone": self.customer_phone,
            "customer_email": self.customer_email,
            "id_number": self.id_number,
            "id_image": self.id_image,
            "total_amount": self.total_amount or 0,
            "amount_paid": paid,
            "remaining_balance": (self.total_amount or 0) - paid,
            "daily_payment": self.daily_payment or 0,
            "payment_duration_days": self.payment_duration_days or 0,
            "start_date": self.start_date,
            "expected_end_date": self.expected_end_date,
            "loan_company": self.loan_company,
            "status": self.status,
            "payments": self.payments(),
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class StockMovement(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    product_id = db.Column(db.String(36), db.ForeignKey("product.id"), nullable=False)
    type = db.Column(db.String(20), nullable=False)  # restock, sale, adjustment, removal
    quantity = db.Column(db.Integer, nullable=False)
    reason = db.Column(db.String(300), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "type": self.type,
            "quantity": self.quantity,
            "reason": self.reason,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Shop(db.Model):
    """A branch. Exactly one is the main shop, which the website sells from."""
    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    location = db.Column(db.String(200), nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    is_main = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "location": self.location,
            "phone": self.phone,
            "is_main": bool(self.is_main),
            "is_active": self.is_active is not False,
            "product_count": Product.query.filter_by(shop_id=self.id).count(),
        }


class User(db.Model):
    """A staff login. Admins manage everything; attendants sell and restock in one shop."""
    __tablename__ = "staff_user"
    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    username = db.Column(db.String(80), nullable=False, unique=True)
    phone = db.Column(db.String(50), nullable=True)
    password_hash = db.Column(db.String(300), nullable=False)
    role = db.Column(db.String(20), default="attendant")  # admin, attendant
    shop_id = db.Column(db.String(36), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    last_login = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "username": self.username,
            "phone": self.phone,
            "role": self.role,
            "shop_id": self.shop_id,
            "is_active": self.is_active is not False,
            "last_login": self.last_login.isoformat() if self.last_login else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class ActivityLog(db.Model):
    """Who did what, where. Flagged rows are the ones an owner should look at."""
    id = db.Column(db.String(36), primary_key=True)
    actor_id = db.Column(db.String(36), nullable=True, index=True)
    actor_name = db.Column(db.String(120), nullable=True)
    actor_role = db.Column(db.String(20), nullable=True)
    shop_id = db.Column(db.String(36), nullable=True, index=True)
    action = db.Column(db.String(60), nullable=False)
    summary = db.Column(db.String(500), nullable=False)
    entity_id = db.Column(db.String(36), nullable=True)
    amount = db.Column(db.Float, nullable=True)
    flagged = db.Column(db.Boolean, default=False)
    flag_reason = db.Column(db.String(300), nullable=True)
    seen = db.Column(db.Boolean, default=False, index=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "actor_id": self.actor_id,
            "actor_name": self.actor_name,
            "actor_role": self.actor_role,
            "shop_id": self.shop_id,
            "action": self.action,
            "summary": self.summary,
            "entity_id": self.entity_id,
            "amount": self.amount,
            "flagged": bool(self.flagged),
            "flag_reason": self.flag_reason,
            "seen": bool(self.seen),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# Ordered stages a delivery moves through. "cancelled" is terminal but off-track.
DELIVERY_STAGES = ["received", "confirmed", "packed", "out_for_delivery", "delivered"]
DELIVERY_STATUSES = DELIVERY_STAGES + ["cancelled"]


class Delivery(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    order_ref = db.Column(db.String(50), unique=True, nullable=False, index=True)
    receipt_no = db.Column(db.String(50), nullable=True)
    customer_name = db.Column(db.String(200), nullable=True)
    customer_phone = db.Column(db.String(50), nullable=True, index=True)
    customer_email = db.Column(db.String(200), nullable=True)
    address = db.Column(db.String(500), nullable=True)
    city = db.Column(db.String(120), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    lat = db.Column(db.Float, nullable=True)
    lng = db.Column(db.Float, nullable=True)
    distance_km = db.Column(db.Float, nullable=True)
    fulfilment = db.Column(db.String(20), default="delivery")  # delivery, pickup
    delivery_fee = db.Column(db.Float, default=0)
    subtotal = db.Column(db.Float, default=0)
    total = db.Column(db.Float, default=0)
    items_json = db.Column(db.Text, nullable=True)  # JSON array as string
    payment_method = db.Column(db.String(30), nullable=True)
    payment_status = db.Column(db.String(60), nullable=True)
    status = db.Column(db.String(30), default="received", index=True)
    rider_name = db.Column(db.String(120), nullable=True)
    rider_phone = db.Column(db.String(50), nullable=True)
    eta = db.Column(db.String(120), nullable=True)
    events_json = db.Column(db.Text, nullable=True)  # JSON array of {status, note, at}
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def events(self):
        try:
            return json.loads(self.events_json) if self.events_json else []
        except (ValueError, TypeError):
            return []

    def add_event(self, status, note=None):
        history = self.events()
        history.append(
            {
                "status": status,
                "note": note,
                "at": datetime.now(timezone.utc).isoformat(),
            }
        )
        self.events_json = json.dumps(history)

    def items(self):
        try:
            return json.loads(self.items_json) if self.items_json else []
        except (ValueError, TypeError):
            return []

    def to_dict(self, public=False):
        """`public` trims the payload down to what the shopper needs on /track."""
        data = {
            "order_ref": self.order_ref,
            "status": self.status,
            "fulfilment": self.fulfilment,
            "customer_name": self.customer_name,
            "address": self.address,
            "city": self.city,
            "distance_km": self.distance_km,
            "delivery_fee": self.delivery_fee,
            "subtotal": self.subtotal,
            "total": self.total,
            "items": self.items(),
            "payment_method": self.payment_method,
            "payment_status": self.payment_status,
            "rider_name": self.rider_name,
            "rider_phone": self.rider_phone,
            "eta": self.eta,
            "events": self.events(),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if not public:
            data.update(
                {
                    "id": self.id,
                    "receipt_no": self.receipt_no,
                    "customer_phone": self.customer_phone,
                    "customer_email": self.customer_email,
                    "notes": self.notes,
                    "lat": self.lat,
                    "lng": self.lng,
                }
            )
        return data


# ── Helpers ──────────────────────────────────────────────────────────────────

def gen_id():
    return str(uuid_lib.uuid4())


def slugify(text):
    return text.lower().strip().replace(" ", "-").replace("/", "-")


def get_or_create_category(name):
    cat = Category.query.filter_by(name=name).first()
    if cat:
        return cat
    cat = Category(id=gen_id(), name=name, slug=slugify(name))
    db.session.add(cat)
    db.session.commit()
    return cat


# ── Staff, shops and the activity trail ──────────────────────────────────────
#
# The admin app signs the session and passes who is acting in X-Actor-* headers.
# If INTERNAL_API_KEY is set, those headers only count when X-Internal-Key
# matches, so nobody can claim to be the owner by calling this API directly.

INTERNAL_API_KEY = os.environ.get("INTERNAL_API_KEY")


def current_actor():
    if INTERNAL_API_KEY and request.headers.get("X-Internal-Key") != INTERNAL_API_KEY:
        return None
    actor_id = request.headers.get("X-Actor-Id")
    if not actor_id:
        return None
    return {
        "id": actor_id,
        "name": request.headers.get("X-Actor-Name") or "Unknown",
        "role": request.headers.get("X-Actor-Role") or "attendant",
    }


def main_shop():
    shop = Shop.query.filter_by(is_main=True).first()
    if not shop:
        shop = Shop(id=gen_id(), name="Main Shop", is_main=True)
        db.session.add(shop)
        db.session.commit()
    return shop


def current_shop_id():
    """The shop a request works in: header from the admin app, else ?shop_id=."""
    return request.headers.get("X-Shop-Id") or request.args.get("shop_id") or None


def shop_name(shop_id):
    shop = Shop.query.get(shop_id) if shop_id else None
    return shop.name if shop else "Main Shop"


def log_activity(action, summary, entity_id=None, amount=None, flag=None, shop_id=None):
    """Adds a trail row to the session; the caller's commit saves it."""
    actor = current_actor() or {"id": None, "name": "System", "role": "system"}
    entry = ActivityLog(
        id=gen_id(),
        actor_id=actor["id"],
        actor_name=actor["name"],
        actor_role=actor["role"],
        shop_id=shop_id or current_shop_id(),
        action=action,
        summary=summary[:500],
        entity_id=entity_id,
        amount=amount,
        flagged=bool(flag),
        flag_reason=flag,
        # The owner doesn't need to be told about their own changes.
        seen=actor["role"] == "owner",
    )
    db.session.add(entry)
    g.activity_logged = True
    return entry


def is_attendant():
    actor = current_actor()
    return bool(actor and actor["role"] == "attendant")


@app.before_request
def reject_disabled_staff():
    """A disabled account is locked out at once, even with a live session cookie."""
    actor = current_actor()
    if not actor or actor["role"] == "owner":
        return None
    user = User.query.get(actor["id"])
    if not user or user.is_active is False:
        return jsonify({"error": "This account has been disabled. Ask the admin."}), 401
    # The admin moved this person to another shop or changed their role since they signed in.
    if user.role != actor["role"] or (user.role == "attendant" and user.shop_id != request.headers.get("X-Shop-Id")):
        return jsonify({"error": "Your account was changed by the admin. Please sign out and sign in again."}), 401
    return None


@app.after_request
def log_unlabelled_changes(response):
    """Safety net: any change by staff that a route didn't describe still lands in the trail."""
    if (
        request.method in ("POST", "PUT", "PATCH", "DELETE")
        and response.status_code < 400
        and current_actor()
        and not getattr(g, "activity_logged", False)
        and request.path.startswith("/api/")
        and not request.path.startswith("/api/activity")
        and not request.path.startswith("/api/auth")
    ):
        try:
            log_activity("change", f"{request.method} {request.path}")
            db.session.commit()
        except Exception:  # noqa: BLE001 - never fail the real request over the log
            db.session.rollback()
    return response


# ── Category routes ──────────────────────────────────────────────────────────

@app.get("/api/categories")
def list_categories():
    cats = Category.query.filter_by(is_active=True).all()
    return jsonify([c.to_dict() for c in cats])


@app.post("/api/categories")
def create_category():
    data = request.get_json(force=True)
    cat = Category(
        id=gen_id(),
        name=data["name"],
        slug=slugify(data.get("slug", data["name"])),
        description=data.get("description"),
        image_url=data.get("image_url"),
    )
    db.session.add(cat)
    db.session.commit()
    return jsonify(cat.to_dict()), 201


@app.put("/api/categories/<cat_id>")
def update_category(cat_id):
    cat = Category.query.get_or_404(cat_id)
    data = request.get_json(force=True)
    cat.name = data.get("name", cat.name)
    cat.slug = slugify(data.get("slug", cat.slug))
    cat.description = data.get("description", cat.description)
    cat.image_url = data.get("image_url", cat.image_url)
    cat.is_active = data.get("is_active", cat.is_active)
    db.session.commit()
    return jsonify(cat.to_dict())


@app.delete("/api/categories/<cat_id>")
def delete_category(cat_id):
    cat = Category.query.get_or_404(cat_id)
    cat.is_active = False
    db.session.commit()
    return jsonify({"ok": True})


# ── Product routes ───────────────────────────────────────────────────────────

@app.get("/api/products")
def list_products():
    query = Product.query
    status = request.args.get("status")
    search = request.args.get("search")
    category = request.args.get("category")
    if status and status != "all":
        query = query.filter_by(status=status)
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))
    if category and category != "all":
        query = query.join(Product.categories).filter(Category.slug == slugify(category))

    # channel=site / channel=pos hides anything the shop has switched off for
    # that surface. Admin omits it and sees everything.
    channel = request.args.get("channel")
    shop_id = current_shop_id()
    if shop_id:
        query = query.filter(Product.shop_id == shop_id)
    elif channel == "site":
        # The website sells from the main shop; branch copies would be duplicates.
        query = query.filter(Product.shop_id == main_shop().id)
    if channel == "site":
        query = query.filter(Product.visible_on_site.isnot(False))
    elif channel == "pos":
        query = query.filter(Product.visible_in_pos.isnot(False))

    product_type = request.args.get("product_type")
    if product_type and product_type != "all":
        # "both" means the phone is sold outright and on Lipa Pole Pole, so it
        # belongs to either list.
        if product_type == "sale":
            query = query.filter(
                db.or_(Product.product_type == "sale", Product.product_type == "both", Product.product_type.is_(None))
            )
        elif product_type == "rental":
            query = query.filter(db.or_(Product.product_type == "rental", Product.product_type == "both"))
        else:
            query = query.filter(Product.product_type == product_type)

    products = query.order_by(Product.created_at.desc()).all()
    return jsonify([p.to_dict() for p in products])


@app.get("/api/products/<product_id>")
def get_product(product_id):
    product = Product.query.get_or_404(product_id)
    return jsonify(product.to_dict())


@app.post("/api/products")
def create_product():
    data = request.get_json(force=True)
    import json

    product = Product(
        id=gen_id(),
        name=data["name"],
        slug=slugify(data["name"]),
        description=data.get("description"),
        price=float(data.get("price", 0)),
        sales_price=float(data["sales_price"]) if data.get("sales_price") else None,
        currency=data.get("currency", "KES"),
        sku=data.get("sku"),
        barcode=data.get("barcode"),
        images=json.dumps(data.get("images", [])),
        status=data.get("status", "active"),
        stock=int(data.get("stock", 0)),
        low_stock_threshold=int(data.get("low_stock_threshold", 5)),
        product_type=data.get("product_type", "sale"),
        rental_terms=data.get("rental_terms"),
        specs=json.dumps(data.get("specs", [])),
        visible_on_site=bool(data.get("visible_on_site", True)),
        visible_in_pos=bool(data.get("visible_in_pos", True)),
        shop_id=current_shop_id() or data.get("shop_id") or main_shop().id,
    )
    for cat_name in data.get("categories", []):
        product.categories.append(get_or_create_category(cat_name))
    db.session.add(product)
    log_activity(
        "product_added",
        f"Added product {product.name} · KES {product.price:,.0f} · {product.stock} in stock",
        entity_id=product.id,
        shop_id=product.shop_id,
    )
    db.session.commit()
    return jsonify(product.to_dict()), 201


@app.put("/api/products/<product_id>")
def update_product(product_id):
    product = Product.query.get_or_404(product_id)
    data = request.get_json(force=True)
    import json

    old_price, old_sales_price, old_stock = product.price, product.sales_price, product.stock
    product.name = data.get("name", product.name)
    product.slug = slugify(data.get("slug", product.slug))
    product.description = data.get("description", product.description)
    product.price = float(data.get("price", product.price))
    product.sales_price = float(data["sales_price"]) if data.get("sales_price") else None
    product.currency = data.get("currency", product.currency)
    product.sku = data.get("sku", product.sku)
    product.barcode = data.get("barcode", product.barcode)
    product.images = json.dumps(data.get("images", []))
    product.status = data.get("status", product.status)
    product.stock = int(data.get("stock", product.stock))
    product.low_stock_threshold = int(data.get("low_stock_threshold", product.low_stock_threshold))
    product.product_type = data.get("product_type", product.product_type)
    product.rental_terms = data.get("rental_terms", product.rental_terms)
    if "specs" in data:
        product.specs = json.dumps(data.get("specs") or [])
    if "visible_on_site" in data:
        product.visible_on_site = bool(data["visible_on_site"])
    if "visible_in_pos" in data:
        product.visible_in_pos = bool(data["visible_in_pos"])
    if "categories" in data:
        product.categories = []
        for cat_name in data["categories"]:
            product.categories.append(get_or_create_category(cat_name))

    changes = []
    if product.price != old_price or product.sales_price != old_sales_price:
        changes.append(
            f"price {old_sales_price or old_price:,.0f} → {product.sales_price or product.price:,.0f}"
        )
    if product.stock != old_stock:
        changes.append(f"stock {old_stock} → {product.stock}")
    log_activity(
        "product_edited",
        f"Edited {product.name}" + (f" ({', '.join(changes)})" if changes else ""),
        entity_id=product.id,
        shop_id=product.shop_id,
        flag="Stock lowered by editing the product" if product.stock < old_stock and is_attendant() else None,
    )
    db.session.commit()
    return jsonify(product.to_dict())


@app.delete("/api/products/<product_id>")
def delete_product(product_id):
    """
    Deleting a product that has ever been sold or restocked used to fail with a
    foreign key error. Stock movements are history of the product itself and go
    with it; sale lines keep their recorded name and price and simply lose the
    link, so past receipts and revenue stay intact.
    """
    product = Product.query.get_or_404(product_id)

    for movement in StockMovement.query.filter_by(product_id=product.id).all():
        db.session.delete(movement)
    for line in SaleItem.query.filter_by(product_id=product.id).all():
        line.product_id = None
    product.categories.clear()
    db.session.flush()

    log_activity(
        "product_deleted",
        f"Deleted product {product.name} ({product.stock} were in stock)",
        entity_id=product.id,
        shop_id=product.shop_id,
        flag="Product deleted with stock on hand" if (product.stock or 0) > 0 else None,
    )
    db.session.delete(product)
    db.session.commit()
    return jsonify({"ok": True, "deleted": product_id})


# ── Inventory / Stock routes ─────────────────────────────────────────────────

@app.get("/api/inventory")
def list_inventory():
    query = Product.query
    shop_id = current_shop_id()
    if shop_id:
        query = query.filter(Product.shop_id == shop_id)
    products = query.order_by(Product.name).all()
    result = []
    for p in products:
        result.append({
            "id": p.id,
            "name": p.name,
            "sku": p.sku,
            "stock": p.stock,
            "low_stock_threshold": p.low_stock_threshold,
            "status": p.status,
            "is_low": p.stock <= p.low_stock_threshold,
            "price": p.price,
            "sales_price": p.sales_price,
        })
    return jsonify(result)


@app.post("/api/inventory/restock/<product_id>")
def restock_product(product_id):
    product = Product.query.get_or_404(product_id)
    data = request.get_json(force=True)
    qty = int(data.get("quantity", 0))
    reason = data.get("reason", "Manual restock")
    product.stock += qty
    movement = StockMovement(
        id=gen_id(),
        product_id=product.id,
        type="restock",
        quantity=qty,
        reason=reason,
    )
    db.session.add(movement)
    log_activity(
        "restock",
        f"Restocked {product.name} by {qty} (now {product.stock}) · {reason}",
        entity_id=product.id,
        shop_id=product.shop_id,
        flag="Negative restock" if qty < 0 else None,
    )
    db.session.commit()
    return jsonify(product.to_dict())


@app.post("/api/inventory/adjust/<product_id>")
def adjust_stock(product_id):
    product = Product.query.get_or_404(product_id)
    data = request.get_json(force=True)
    new_stock = int(data.get("stock", product.stock))
    reason = data.get("reason", "Stock adjustment")
    diff = new_stock - product.stock
    product.stock = new_stock
    movement = StockMovement(
        id=gen_id(),
        product_id=product.id,
        type="adjustment",
        quantity=diff,
        reason=reason,
    )
    db.session.add(movement)
    log_activity(
        "stock_adjusted",
        f"Adjusted {product.name} stock {new_stock - diff} → {new_stock} · {reason}",
        entity_id=product.id,
        shop_id=product.shop_id,
        flag=f"Stock reduced by {-diff} without a sale" if diff < 0 else None,
    )
    db.session.commit()
    return jsonify(product.to_dict())


@app.get("/api/inventory/movements/<product_id>")
def stock_movements(product_id):
    movements = (
        StockMovement.query
        .filter_by(product_id=product_id)
        .order_by(StockMovement.created_at.desc())
        .limit(50)
        .all()
    )
    return jsonify([m.to_dict() for m in movements])


# ── POS / Sales routes ───────────────────────────────────────────────────────

@app.post("/api/sales")
def create_sale():
    data = request.get_json(force=True)
    items = data.get("items", [])
    if not items:
        return jsonify({"error": "No items in sale"}), 400

    subtotal = 0.0
    sale_items = []
    below_price = []
    first_shop_id = None
    for item in items:
        product = Product.query.get(item.get("product_id"))
        if not product:
            return jsonify({"error": f"Product not found: {item.get('product_id')}"}), 404
        if first_shop_id is None:
            first_shop_id = product.shop_id
        qty = int(item.get("quantity", 1))
        unit_price = float(item.get("unit_price", product.sales_price or product.price))
        list_price = product.sales_price or product.price
        if unit_price < list_price:
            below_price.append(f"{product.name} at {unit_price:,.0f} (list {list_price:,.0f})")
        line_total = unit_price * qty
        subtotal += line_total
        si = SaleItem(
            id=gen_id(),
            product_id=product.id,
            product_name=product.name,
            quantity=qty,
            unit_price=unit_price,
            total=line_total,
        )
        sale_items.append(si)
        product.stock -= qty
        movement = StockMovement(
            id=gen_id(),
            product_id=product.id,
            type="sale",
            quantity=-qty,
            reason=f"Sale receipt",
        )
        db.session.add(movement)

    tax = float(data.get("tax", 0))
    discount = float(data.get("discount", 0))
    delivery_fee = float(data.get("delivery_fee", 0) or 0)
    total = subtotal + tax + delivery_fee - discount
    if total < 0 or discount < 0:
        db.session.rollback()
        return jsonify({"error": "The discount can't be more than the sale."}), 400
    receipt_no = f"R{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"

    sale = Sale(
        id=gen_id(),
        receipt_no=receipt_no,
        total=total,
        subtotal=subtotal,
        tax=tax,
        discount=discount,
        delivery_fee=delivery_fee,
        fulfilment=data.get("fulfilment", "pickup"),
        delivery_address=data.get("delivery_address"),
        payment_method=data.get("payment_method", "cash"),
        customer_name=data.get("customer_name"),
        customer_phone=data.get("customer_phone"),
        # With no shop chosen ("All shops"), the sale belongs where the goods came from.
        shop_id=current_shop_id() or data.get("shop_id") or first_shop_id or main_shop().id,
    )
    actor = current_actor()
    sale.sold_by_id = actor["id"] if actor else None
    sale.sold_by_name = actor["name"] if actor else "Website"
    sale.items = sale_items
    db.session.add(sale)

    if actor:
        flags = []
        if below_price:
            flags.append("Sold below price: " + "; ".join(below_price))
        if discount > 0:
            flags.append(f"Discount of KES {discount:,.0f}")
        count = sum(si.quantity for si in sale_items)
        log_activity(
            "sale",
            f"Sold {count} item{'s' if count != 1 else ''} · KES {total:,.0f} · {sale.payment_method} · {receipt_no}",
            entity_id=sale.id,
            amount=total,
            shop_id=sale.shop_id,
            flag=" · ".join(flags) if flags and actor["role"] != "owner" else None,
        )
    db.session.commit()
    return jsonify(sale.to_dict()), 201


@app.get("/api/sales")
def list_sales():
    query = Sale.query
    shop_id = current_shop_id()
    if shop_id:
        query = query.filter(Sale.shop_id == shop_id)
    sales = query.order_by(Sale.created_at.desc()).limit(200).all()
    return jsonify([s.to_dict() for s in sales])


@app.get("/api/sales/<sale_id>")
def get_sale(sale_id):
    sale = Sale.query.get_or_404(sale_id)
    return jsonify(sale.to_dict())


@app.delete("/api/sales/<sale_id>")
def delete_sale(sale_id):
    """
    Removes a sale. Stock is deliberately not returned — a deletion here means
    the record was entered wrongly, not that goods came back; use Returns for
    that. Line items go with it via the cascade.
    """
    sale = Sale.query.get_or_404(sale_id)
    log_activity(
        "sale_deleted",
        f"Deleted sale {sale.receipt_no} · KES {sale.total:,.0f} (sold by {sale.sold_by_name or 'unknown'})",
        entity_id=sale.id,
        amount=sale.total,
        shop_id=sale.shop_id,
        flag="A recorded sale was deleted",
    )
    db.session.delete(sale)
    db.session.commit()
    return jsonify({"ok": True, "deleted": sale_id})


# ── Image uploads (Backblaze B2, S3-compatible) ──────────────────────────────

# Widest edge we keep. Bigger than any storefront slot, small enough to stay light.
MAX_IMAGE_EDGE = 1400
MAX_UPLOAD_BYTES = 10 * 1024 * 1024


def b2_settings():
    return {
        "key_id": os.environ.get("B2_KEY_ID"),
        "app_key": os.environ.get("B2_APPLICATION_KEY"),
        "bucket": os.environ.get("B2_BUCKET"),
        "endpoint": os.environ.get("B2_ENDPOINT"),  # e.g. https://s3.us-west-004.backblazeb2.com
        # Public base for reads. Set to a Cloudflare custom domain to get free egress.
        "public_base": os.environ.get("B2_PUBLIC_BASE"),
    }


def b2_configured():
    s = b2_settings()
    return all([s["key_id"], s["app_key"], s["bucket"], s["endpoint"]])


def b2_client():
    import boto3

    s = b2_settings()
    return boto3.client(
        "s3",
        endpoint_url=s["endpoint"],
        aws_access_key_id=s["key_id"],
        aws_secret_access_key=s["app_key"],
    )


def public_url_for(key):
    s = b2_settings()
    if s["public_base"]:
        return f"{s['public_base'].rstrip('/')}/{key}"
    return f"{s['endpoint'].rstrip('/')}/{s['bucket']}/{key}"


def store_image(raw_bytes, prefix="products"):
    """Resizes to WebP and puts it in the bucket. Returns the public URL."""
    from io import BytesIO
    from PIL import Image

    image = Image.open(BytesIO(raw_bytes))
    if image.mode not in ("RGB", "RGBA"):
        image = image.convert("RGB")
    image.thumbnail((MAX_IMAGE_EDGE, MAX_IMAGE_EDGE), Image.LANCZOS)

    buffer = BytesIO()
    image.save(buffer, format="WEBP", quality=82, method=6)
    buffer.seek(0)

    key = f"{prefix}/{gen_id()}.webp"
    b2_client().put_object(
        Bucket=b2_settings()["bucket"],
        Key=key,
        Body=buffer.getvalue(),
        ContentType="image/webp",
        CacheControl="public, max-age=31536000, immutable",
    )
    return public_url_for(key)


@app.get("/api/uploads/config")
def upload_config():
    return jsonify({"uploads_enabled": b2_configured()})


@app.post("/api/uploads")
def upload_image():
    if not b2_configured():
        return jsonify({"error": "Image storage is not configured. Set the B2_* environment variables."}), 503

    uploaded = request.files.get("file")
    if not uploaded:
        return jsonify({"error": "No file was sent."}), 400

    raw = uploaded.read()
    if not raw:
        return jsonify({"error": "The file was empty."}), 400
    if len(raw) > MAX_UPLOAD_BYTES:
        return jsonify({"error": "That image is larger than 10MB."}), 413

    try:
        url = store_image(raw)
    except Exception as exc:  # noqa: BLE001 - surfaced to the admin UI
        return jsonify({"error": f"Upload failed: {exc}"}), 502

    return jsonify({"url": url}), 201


# ── Delivery tracking ────────────────────────────────────────────────────────

def phone_digits(value):
    """Last 9 digits, so 0724126009 / +254724126009 / 254724126009 all match."""
    digits = "".join(ch for ch in str(value or "") if ch.isdigit())
    return digits[-9:]


@app.post("/api/deliveries")
def create_delivery():
    data = request.get_json(force=True) or {}
    order_ref = (data.get("order_ref") or "").strip()
    if not order_ref:
        return jsonify({"error": "order_ref is required"}), 400

    existing = Delivery.query.filter_by(order_ref=order_ref).first()
    if existing:
        return jsonify(existing.to_dict()), 200

    delivery = Delivery(
        id=gen_id(),
        order_ref=order_ref,
        receipt_no=data.get("receipt_no"),
        customer_name=data.get("customer_name"),
        customer_phone=data.get("customer_phone"),
        customer_email=data.get("customer_email"),
        address=data.get("address"),
        city=data.get("city"),
        notes=data.get("notes"),
        lat=data.get("lat"),
        lng=data.get("lng"),
        distance_km=data.get("distance_km"),
        fulfilment=data.get("fulfilment", "delivery"),
        delivery_fee=float(data.get("delivery_fee", 0) or 0),
        subtotal=float(data.get("subtotal", 0) or 0),
        total=float(data.get("total", 0) or 0),
        items_json=json.dumps(data.get("items", [])),
        payment_method=data.get("payment_method"),
        payment_status=data.get("payment_status"),
        status="received",
    )
    delivery.add_event("received", "Order received on the website")
    db.session.add(delivery)
    db.session.commit()
    return jsonify(delivery.to_dict()), 201


@app.get("/api/deliveries/track")
def track_delivery():
    """Public lookup. The phone number acts as the shared secret for the ref."""
    order_ref = (request.args.get("ref") or "").strip()
    phone = (request.args.get("phone") or "").strip()
    if not order_ref or not phone:
        return jsonify({"error": "An order number and phone number are both required."}), 400

    delivery = Delivery.query.filter(db.func.lower(Delivery.order_ref) == order_ref.lower()).first()
    if not delivery or phone_digits(delivery.customer_phone) != phone_digits(phone):
        return jsonify({"error": "No order matches that number and phone. Check both and try again."}), 404

    return jsonify(delivery.to_dict(public=True))


@app.get("/api/deliveries")
def list_deliveries():
    query = Delivery.query
    status = request.args.get("status")
    if status:
        query = query.filter_by(status=status)
    deliveries = query.order_by(Delivery.created_at.desc()).limit(200).all()
    return jsonify([d.to_dict() for d in deliveries])


@app.delete("/api/deliveries/<delivery_id>")
def delete_delivery(delivery_id):
    delivery = Delivery.query.get_or_404(delivery_id)
    db.session.delete(delivery)
    db.session.commit()
    return jsonify({"ok": True, "deleted": delivery_id})


@app.patch("/api/deliveries/<delivery_id>")
def update_delivery(delivery_id):
    delivery = Delivery.query.get_or_404(delivery_id)
    data = request.get_json(force=True) or {}

    status = data.get("status")
    if status:
        if status not in DELIVERY_STATUSES:
            return jsonify({"error": f"Unknown status: {status}"}), 400
        if status != delivery.status:
            delivery.status = status
            delivery.add_event(status, data.get("note"))
        elif data.get("note"):
            delivery.add_event(status, data.get("note"))

    for field in ("rider_name", "rider_phone", "eta", "notes"):
        if field in data:
            setattr(delivery, field, data.get(field))

    db.session.commit()
    return jsonify(delivery.to_dict())


# ── Lipa Pole Pole (rentals) ─────────────────────────────────────────────────

RENTAL_FIELDS = (
    "product_id", "product_name", "product_type", "customer_name", "customer_phone",
    "customer_email", "id_number", "id_image", "start_date", "expected_end_date",
    "loan_company", "status", "notes",
)
RENTAL_NUMBERS = ("total_amount", "amount_paid", "daily_payment")


def apply_rental(rental, data):
    for field in RENTAL_FIELDS:
        if field in data:
            setattr(rental, field, data.get(field))
    for field in RENTAL_NUMBERS:
        if field in data:
            setattr(rental, field, float(data.get(field) or 0))
    if "payment_duration_days" in data:
        rental.payment_duration_days = int(data.get("payment_duration_days") or 0)
    if "payments" in data:
        rental.payments_json = json.dumps(data.get("payments") or [])
    return rental


@app.get("/api/rentals")
def list_rentals():
    rentals = Rental.query.order_by(Rental.created_at.desc()).limit(500).all()
    return jsonify([r.to_dict() for r in rentals])


@app.post("/api/rentals")
def create_rental():
    data = request.get_json(force=True) or {}
    if not (data.get("customer_name") or "").strip():
        return jsonify({"error": "A customer name is required."}), 400
    if not (data.get("product_name") or "").strip():
        return jsonify({"error": "Choose the phone this agreement is for."}), 400

    rental = Rental(id=gen_id(), product_name=data["product_name"], customer_name=data["customer_name"],
                    customer_phone=data.get("customer_phone", ""), id_number=data.get("id_number", ""))
    apply_rental(rental, data)
    db.session.add(rental)
    db.session.commit()
    return jsonify(rental.to_dict()), 201


@app.put("/api/rentals/<rental_id>")
def update_rental(rental_id):
    rental = Rental.query.get_or_404(rental_id)
    apply_rental(rental, request.get_json(force=True) or {})
    db.session.commit()
    return jsonify(rental.to_dict())


@app.delete("/api/rentals/<rental_id>")
def delete_rental(rental_id):
    rental = Rental.query.get_or_404(rental_id)
    db.session.delete(rental)
    db.session.commit()
    return jsonify({"ok": True, "deleted": rental_id})


@app.post("/api/rentals/<rental_id>/payments")
def add_rental_payment(rental_id):
    """Records an instalment and moves the running balance."""
    rental = Rental.query.get_or_404(rental_id)
    data = request.get_json(force=True) or {}
    amount = float(data.get("amount") or 0)
    if amount <= 0:
        return jsonify({"error": "Enter a payment amount greater than zero."}), 400

    payments = rental.payments()
    payments.append({
        "id": gen_id(),
        "amount": amount,
        "date": data.get("date") or datetime.now(timezone.utc).isoformat(),
        "method": data.get("method", "Cash"),
        "reference": data.get("reference"),
        "notes": data.get("notes"),
    })
    rental.payments_json = json.dumps(payments)
    rental.amount_paid = float(rental.amount_paid or 0) + amount
    if rental.amount_paid >= float(rental.total_amount or 0) and rental.total_amount:
        rental.status = "completed"
    db.session.commit()
    return jsonify(rental.to_dict())


# ── Dashboard / Stats ────────────────────────────────────────────────────────

@app.get("/api/stats")
def stats():
    shop_id = current_shop_id()
    products = Product.query.filter(Product.shop_id == shop_id) if shop_id else Product.query
    sales = Sale.query.filter(Sale.shop_id == shop_id) if shop_id else Sale.query
    revenue_q = db.session.query(db.func.coalesce(db.func.sum(Sale.total), 0))
    if shop_id:
        revenue_q = revenue_q.filter(Sale.shop_id == shop_id)

    total_products = products.count()
    total_categories = Category.query.filter_by(is_active=True).count()
    low_stock = products.filter(Product.stock <= Product.low_stock_threshold).count()
    out_of_stock = products.filter(Product.stock == 0).count()
    total_sales = sales.count()
    revenue = revenue_q.scalar()
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_sales = sales.filter(Sale.created_at >= today_start).count()
    today_revenue = revenue_q.filter(Sale.created_at >= today_start).scalar()
    return jsonify({
        "total_products": total_products,
        "total_categories": total_categories,
        "low_stock": low_stock,
        "out_of_stock": out_of_stock,
        "total_sales": total_sales,
        "revenue": float(revenue),
        "today_sales": today_sales,
        "today_revenue": float(today_revenue),
    })


# ── Staff login & accounts ───────────────────────────────────────────────────

@app.post("/api/auth/login")
def staff_login():
    data = request.get_json(force=True) or {}
    username = (data.get("username") or "").strip().lower()
    password = data.get("password") or ""
    user = User.query.filter(db.func.lower(User.username) == username).first() if username else None

    if not user or not check_password_hash(user.password_hash, password):
        if user:
            # A wrong password on a real account is worth the owner knowing about.
            db.session.add(ActivityLog(
                id=gen_id(), actor_id=user.id, actor_name=user.name, actor_role=user.role,
                shop_id=user.shop_id, action="login_failed",
                summary=f"Failed login attempt for {user.username}",
            ))
            db.session.commit()
        return jsonify({"error": "Wrong username or password."}), 401
    if user.is_active is False:
        return jsonify({"error": "This account has been disabled. Ask the admin."}), 403

    user.last_login = datetime.now(timezone.utc)
    db.session.add(ActivityLog(
        id=gen_id(), actor_id=user.id, actor_name=user.name, actor_role=user.role,
        shop_id=user.shop_id, action="login", summary=f"{user.name} signed in",
    ))
    db.session.commit()
    return jsonify(user.to_dict())


@app.get("/api/users")
def list_users():
    return jsonify([u.to_dict() for u in User.query.order_by(User.created_at).all()])


def apply_user(user, data):
    for field in ("name", "phone"):
        if field in data:
            setattr(user, field, (data.get(field) or "").strip() or None)
    if "username" in data:
        user.username = (data.get("username") or "").strip().lower()
    if data.get("role") in ("admin", "attendant"):
        user.role = data["role"]
    if "shop_id" in data:
        user.shop_id = data.get("shop_id") or None
    if "is_active" in data:
        user.is_active = bool(data["is_active"])
    if data.get("password"):
        if len(data["password"]) < 4:
            raise ValueError("Passwords need at least 4 characters.")
        user.password_hash = generate_password_hash(data["password"])


@app.post("/api/users")
def create_user():
    data = request.get_json(force=True) or {}
    if not (data.get("name") or "").strip() or not (data.get("username") or "").strip():
        return jsonify({"error": "A name and username are required."}), 400
    if not data.get("password"):
        return jsonify({"error": "Set a password for the new user."}), 400
    if User.query.filter(db.func.lower(User.username) == data["username"].strip().lower()).first():
        return jsonify({"error": "That username is taken."}), 409

    user = User(id=gen_id(), name="", username="", password_hash="")
    try:
        apply_user(user, data)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    if user.role == "attendant" and not user.shop_id:
        user.shop_id = main_shop().id
    db.session.add(user)
    log_activity("user_added", f"Added {user.role} {user.name} ({user.username}) to {shop_name(user.shop_id)}",
                 entity_id=user.id, shop_id=user.shop_id)
    db.session.commit()
    return jsonify(user.to_dict()), 201


@app.put("/api/users/<user_id>")
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json(force=True) or {}
    if "username" in data:
        clash = User.query.filter(
            db.func.lower(User.username) == (data["username"] or "").strip().lower(), User.id != user.id
        ).first()
        if clash:
            return jsonify({"error": "That username is taken."}), 409
    try:
        apply_user(user, data)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    what = "reset the password of" if data.get("password") else "updated"
    log_activity("user_updated", f"Admin {what} {user.name}", entity_id=user.id, shop_id=user.shop_id)
    db.session.commit()
    return jsonify(user.to_dict())


@app.delete("/api/users/<user_id>")
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    log_activity("user_removed", f"Removed user {user.name} ({user.username})", entity_id=user.id,
                 shop_id=user.shop_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({"ok": True, "deleted": user_id})


# ── Shops ────────────────────────────────────────────────────────────────────

@app.get("/api/shops")
def list_shops():
    main_shop()
    shops = Shop.query.order_by(Shop.is_main.desc(), Shop.created_at).all()
    return jsonify([s.to_dict() for s in shops])


@app.post("/api/shops")
def create_shop():
    data = request.get_json(force=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "Give the shop a name."}), 400
    shop = Shop(id=gen_id(), name=name, location=data.get("location"), phone=data.get("phone"))
    db.session.add(shop)
    log_activity("shop_added", f"Opened shop {name}", entity_id=shop.id, shop_id=shop.id)
    db.session.commit()
    return jsonify(shop.to_dict()), 201


@app.put("/api/shops/<shop_id>")
def update_shop(shop_id):
    shop = Shop.query.get_or_404(shop_id)
    data = request.get_json(force=True) or {}
    for field in ("name", "location", "phone"):
        if field in data:
            setattr(shop, field, data.get(field))
    if "is_active" in data and not shop.is_main:
        shop.is_active = bool(data["is_active"])
    log_activity("shop_updated", f"Updated shop {shop.name}", entity_id=shop.id, shop_id=shop.id)
    db.session.commit()
    return jsonify(shop.to_dict())


@app.delete("/api/shops/<shop_id>")
def delete_shop(shop_id):
    shop = Shop.query.get_or_404(shop_id)
    if shop.is_main:
        return jsonify({"error": "The main shop can't be removed."}), 400
    if Product.query.filter_by(shop_id=shop.id).count() or Sale.query.filter_by(shop_id=shop.id).count():
        return jsonify({"error": "This shop has products or sales. Close it instead of deleting it."}), 400
    log_activity("shop_removed", f"Removed shop {shop.name}", entity_id=shop.id, shop_id=shop.id)
    db.session.delete(shop)
    db.session.commit()
    return jsonify({"ok": True, "deleted": shop_id})


@app.post("/api/shops/<target_id>/copy-products")
def copy_products(target_id):
    """
    Copies products from one shop into another. Anything already in the target
    with the same name is skipped, so running it twice never duplicates.
    Stock starts at zero unless copy_stock is set: goods don't move by copying.
    """
    target = Shop.query.get_or_404(target_id)
    data = request.get_json(force=True) or {}
    source_id = data.get("source_shop_id")
    if not source_id or source_id == target.id:
        return jsonify({"error": "Pick a different shop to copy from."}), 400

    query = Product.query.filter(Product.shop_id == source_id)
    if not data.get("all"):
        ids = data.get("product_ids") or []
        if not ids:
            return jsonify({"error": "Choose at least one product."}), 400
        query = query.filter(Product.id.in_(ids))

    existing = {
        (p.name or "").strip().lower()
        for p in Product.query.filter(Product.shop_id == target.id).with_entities(Product.name)
    }
    copied, skipped = 0, 0
    for src in query.all():
        if (src.name or "").strip().lower() in existing:
            skipped += 1
            continue
        clone = Product(
            id=gen_id(), name=src.name, slug=src.slug, description=src.description,
            price=src.price, sales_price=src.sales_price, currency=src.currency, sku=src.sku,
            barcode=src.barcode, images=src.images, status=src.status,
            stock=src.stock if data.get("copy_stock") else 0,
            low_stock_threshold=src.low_stock_threshold, product_type=src.product_type,
            rental_terms=src.rental_terms, specs=src.specs, visible_on_site=src.visible_on_site,
            visible_in_pos=src.visible_in_pos, shop_id=target.id,
        )
        clone.categories = list(src.categories)
        db.session.add(clone)
        existing.add((src.name or "").strip().lower())
        copied += 1

    log_activity(
        "products_copied",
        f"Copied {copied} product{'s' if copied != 1 else ''} from {shop_name(source_id)} to {target.name}"
        + (f" ({skipped} already there)" if skipped else ""),
        entity_id=target.id,
        shop_id=target.id,
    )
    db.session.commit()
    return jsonify({"copied": copied, "skipped": skipped})


# ── Activity trail ───────────────────────────────────────────────────────────

@app.get("/api/activity")
def list_activity():
    query = ActivityLog.query
    for field in ("shop_id", "actor_id", "action"):
        value = request.args.get(field)
        if value:
            query = query.filter(getattr(ActivityLog, field) == value)
    if request.args.get("flagged") == "1":
        query = query.filter(ActivityLog.flagged.is_(True))
    if request.args.get("staff_only") == "1":
        query = query.filter(ActivityLog.actor_role.in_(["attendant", "admin"]))
    limit = min(int(request.args.get("limit", 200)), 500)
    rows = query.order_by(ActivityLog.created_at.desc()).limit(limit).all()
    return jsonify([r.to_dict() for r in rows])


@app.get("/api/activity/unseen")
def unseen_activity():
    base = ActivityLog.query.filter(ActivityLog.seen.is_(False))
    return jsonify({
        "unseen": base.count(),
        "flagged": base.filter(ActivityLog.flagged.is_(True)).count(),
    })


@app.post("/api/activity/seen")
def mark_activity_seen():
    data = request.get_json(force=True, silent=True) or {}
    query = ActivityLog.query.filter(ActivityLog.seen.is_(False))
    if data.get("ids"):
        query = query.filter(ActivityLog.id.in_(data["ids"]))
    query.update({ActivityLog.seen: True}, synchronize_session=False)
    g.activity_logged = True
    db.session.commit()
    return jsonify({"ok": True})


@app.get("/api/activity/staff-summary")
def staff_summary():
    """Today's sales per person, so the owner can compare tills at closing."""
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    query = db.session.query(
        Sale.sold_by_id, Sale.sold_by_name, Sale.shop_id,
        db.func.count(Sale.id), db.func.coalesce(db.func.sum(Sale.total), 0),
    ).filter(Sale.created_at >= today_start)
    shop_id = request.args.get("shop_id")
    if shop_id:
        query = query.filter(Sale.shop_id == shop_id)
    rows = query.group_by(Sale.sold_by_id, Sale.sold_by_name, Sale.shop_id).all()
    return jsonify([
        {"user_id": r[0], "name": r[1] or "Unknown", "shop_id": r[2], "sales": r[3], "total": float(r[4])}
        for r in rows
    ])


# ── Store info ───────────────────────────────────────────────────────────────

@app.get("/api/store")
def store_info():
    return jsonify({
        "id": "alicia-phone-store",
        "name": "Alicia Phone Store",
        "description": "Premium phones, gadgets, and electronics delivered fast. Trusted tech, expert support, secure checkout.",
        "currency": "KES",
        "logo": "/Phoneplacelg.png",
        "email": "hello@aliciaphonestore.com",
        "phone": "+254700000000",
    })


# ── Init / Seed ──────────────────────────────────────────────────────────────

def seed_data():
    """Seed initial categories and products if DB is empty."""
    if Category.query.first():
        return

    categories_data = [
        "Samsung", "Apple", "Smartphones", "Mobile Accessories",
        "Audio", "Gaming", "Tablets", "Content Creator Kit",
    ]
    cats = {}
    for name in categories_data:
        cat = Category(id=gen_id(), name=name, slug=slugify(name))
        db.session.add(cat)
        cats[name] = cat

    import json

    products_data = [
        {"name": "Samsung Galaxy S24 Ultra", "categories": ["Samsung", "Smartphones"], "price": 169999, "sales_price": 159999, "stock": 10, "sku": "SGS24U-256", "description": "6.8\" QHD+ AMOLED, 200MP camera, 5000mAh, Snapdragon 8 Gen 3, 12GB RAM, 256GB storage", "images": ["https://images.unsplash.com/photo-1705585175110-d25f92c183aa?auto=format&fit=crop&w=1200&q=85"]},
        {"name": "Samsung Galaxy S24+", "categories": ["Samsung", "Smartphones"], "price": 129999, "sales_price": 124999, "stock": 12, "sku": "SGS24P-256", "description": "6.7\" Dynamic AMOLED, 50MP camera, 4900mAh, 12GB RAM, 256GB storage", "images": ["https://images.unsplash.com/photo-1705530292519-ec81f2ace70d?auto=format&fit=crop&w=1200&q=85"]},
        {"name": "iPhone 16 Pro Max", "categories": ["Apple", "Smartphones"], "price": 189999, "sales_price": 184999, "stock": 8, "sku": "IP16PM-256", "description": "6.9\" Super Retina XDR, A18 Pro chip, 48MP camera, titanium design", "images": ["https://images.unsplash.com/photo-1727013884184-b313982327f3?auto=format&fit=crop&w=1200&q=85"]},
        {"name": "iPhone 16 Pro", "categories": ["Apple", "Smartphones"], "price": 159999, "sales_price": 154999, "stock": 10, "sku": "IP16P-128", "description": "6.3\" Super Retina XDR, A18 Pro chip, 48MP camera system", "images": ["https://images.unsplash.com/photo-1678911820864-e2c567c655d7?auto=format&fit=crop&w=1200&q=85"]},
        {"name": "Tecno Camon 30 Premier", "categories": ["Smartphones"], "price": 54999, "sales_price": 51999, "stock": 15, "sku": "TCC30P-512", "description": "6.77\" 120Hz AMOLED, 50MP triple camera, 5G, 70W charging", "images": ["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=85"]},
        {"name": "Google Pixel 8 Pro", "categories": ["Smartphones"], "price": 119999, "sales_price": 114999, "stock": 7, "sku": "GPX8P-128", "description": "6.7\" LTPO OLED, Google Tensor G3, advanced AI camera", "images": ["https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1200&q=85"]},
        {"name": "AirPods Pro 2", "categories": ["Apple", "Audio"], "price": 34999, "sales_price": 32999, "stock": 20, "sku": "APP2-USB", "description": "Active noise cancellation, spatial audio, USB-C charging", "images": ["https://images.unsplash.com/photo-1664271294066-2dfd418b15b1?auto=format&fit=crop&w=1200&q=85"]},
        {"name": "Samsung Galaxy Tab S9", "categories": ["Samsung", "Tablets"], "price": 94999, "sales_price": 89999, "stock": 9, "sku": "SGTS9-128", "description": "11\" Dynamic AMOLED 2X, Snapdragon 8 Gen 2, S Pen included", "images": ["https://images.unsplash.com/photo-1661595676830-2a0a1ccab283?auto=format&fit=crop&w=1200&q=85"]},
        {"name": "iPad Air M2", "categories": ["Apple", "Tablets"], "price": 94999, "sales_price": 89999, "stock": 8, "sku": "IPDA-M2-128", "description": "11\" Liquid Retina, M2 chip, Apple Pencil support", "images": ["https://images.unsplash.com/photo-1636345554479-ecdf092d122f?auto=format&fit=crop&w=1200&q=85"]},
        {"name": "Sony WH-1000XM5", "categories": ["Audio"], "price": 49999, "sales_price": 46999, "stock": 11, "sku": "SNYXM5-BLK", "description": "Industry-leading noise canceling, 30-hour battery, premium comfort", "images": ["https://images.unsplash.com/photo-1733041055704-da53567e49da?auto=format&fit=crop&w=1200&q=85"]},
        {"name": "Anker Soundcore Liberty 4 NC", "categories": ["Audio"], "price": 12999, "sales_price": 10999, "stock": 25, "sku": "ANK-L4NC", "description": "Adaptive active noise cancelling, 10-hour battery, wireless earbuds", "images": ["https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=1200&q=85"]},
        {"name": "Razer BlackShark V2 Pro", "categories": ["Gaming"], "price": 24999, "sales_price": 22999, "stock": 14, "sku": "RBV2P-XBX", "description": "Wireless gaming headset, THX 7.1 surround sound, 24-hour battery", "images": ["https://images.unsplash.com/photo-1599669454699-248893623440?auto=format&fit=crop&w=1200&q=85"]},
        {"name": "Xbox Wireless Controller", "categories": ["Gaming"], "price": 16999, "sales_price": 14999, "stock": 18, "sku": "XBX-CTRL-BLK", "description": "Ergonomic wireless controller for Xbox and PC", "images": ["https://images.unsplash.com/photo-1592286927505-1def25115558?auto=format&fit=crop&w=1200&q=85"]},
        {"name": "Rode Wireless GO II", "categories": ["Content Creator Kit"], "price": 39999, "sales_price": 36999, "stock": 10, "sku": "RODE-WG2", "description": "Dual-channel wireless microphone system with onboard recording", "images": ["https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1200&q=85"]},
        {"name": "Ulanzi 18\" RGB Ring Light", "categories": ["Content Creator Kit"], "price": 8999, "sales_price": 7499, "stock": 16, "sku": "ULZ-RGB18", "description": "Adjustable color temperature, phone mount, tripod compatible", "images": ["https://images.unsplash.com/photo-1606986628253-49e0c7c5b4d9?auto=format&fit=crop&w=1200&q=85"]},
        {"name": "Anker 65W GaN Charger", "categories": ["Mobile Accessories"], "price": 4999, "sales_price": 4499, "stock": 30, "sku": "ANK-65W-GAN", "description": "Compact 65W USB-C charger, powers laptop, phone and accessories", "images": ["https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1200&q=85"]},
        {"name": "Spigen Tough Armor Case", "categories": ["Mobile Accessories"], "price": 2499, "sales_price": 1999, "stock": 40, "sku": "SPG-TA-UNI", "description": "Dual-layer shock absorption phone case with built-in kickstand", "images": ["https://images.unsplash.com/photo-1601593396740-987b76b26a72?auto=format&fit=crop&w=1200&q=85"]},
        {"name": "Belkin MagSafe 3-in-1 Charger", "categories": ["Mobile Accessories"], "price": 12999, "sales_price": 10999, "stock": 13, "sku": "BLK-M3W", "description": "Wireless charging stand for iPhone, Apple Watch and AirPods", "images": ["https://images.unsplash.com/photo-1611170407651-65737bbadd58?auto=format&fit=crop&w=1200&q=85"]},
    ]

    for pd in products_data:
        product = Product(
            id=gen_id(),
            name=pd["name"],
            slug=slugify(pd["name"]),
            description=pd.get("description"),
            price=pd["price"],
            sales_price=pd.get("sales_price"),
            currency="KES",
            sku=pd.get("sku"),
            images=json.dumps(pd.get("images", [])),
            status="active",
            stock=pd.get("stock", 0),
            low_stock_threshold=5,
        )
        for cat_name in pd.get("categories", []):
            product.categories.append(cats[cat_name])
        db.session.add(product)

    db.session.commit()
    print(f"Seeded {len(categories_data)} categories and {len(products_data)} products")


@app.post("/api/reseed-images")
def reseed_images():
    """Update all product images to match seed data."""
    import json

    image_map = {
        "Samsung Galaxy S24 Ultra": ["https://images.unsplash.com/photo-1705585175110-d25f92c183aa?auto=format&fit=crop&w=1200&q=85"],
        "Samsung Galaxy S24+": ["https://images.unsplash.com/photo-1705530292519-ec81f2ace70d?auto=format&fit=crop&w=1200&q=85"],
        "iPhone 16 Pro Max": ["https://images.unsplash.com/photo-1727013884184-b313982327f3?auto=format&fit=crop&w=1200&q=85"],
        "iPhone 16 Pro": ["https://images.unsplash.com/photo-1678911820864-e2c567c655d7?auto=format&fit=crop&w=1200&q=85"],
        "Tecno Camon 30 Premier": ["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=85"],
        "Google Pixel 8 Pro": ["https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1200&q=85"],
        "AirPods Pro 2": ["https://images.unsplash.com/photo-1664271294066-2dfd418b15b1?auto=format&fit=crop&w=1200&q=85"],
        "Samsung Galaxy Tab S9": ["https://images.unsplash.com/photo-1661595676830-2a0a1ccab283?auto=format&fit=crop&w=1200&q=85"],
        "iPad Air M2": ["https://images.unsplash.com/photo-1636345554479-ecdf092d122f?auto=format&fit=crop&w=1200&q=85"],
        "Sony WH-1000XM5": ["https://images.unsplash.com/photo-1733041055704-da53567e49da?auto=format&fit=crop&w=1200&q=85"],
        "Anker Soundcore Liberty 4 NC": ["https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=1200&q=85"],
        "Razer BlackShark V2 Pro": ["https://images.unsplash.com/photo-1599669454699-248893623440?auto=format&fit=crop&w=1200&q=85"],
        "Xbox Wireless Controller": ["https://images.unsplash.com/photo-1592286927505-1def25115558?auto=format&fit=crop&w=1200&q=85"],
        "Rode Wireless GO II": ["https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1200&q=85"],
        'Ulanzi 18" RGB Ring Light': ["https://images.unsplash.com/photo-1606986628253-49e0c7c5b4d9?auto=format&fit=crop&w=1200&q=85"],
        "Anker 65W GaN Charger": ["https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1200&q=85"],
        "Spigen Tough Armor Case": ["https://images.unsplash.com/photo-1601593396740-987b76b26a72?auto=format&fit=crop&w=1200&q=85"],
        "Belkin MagSafe 3-in-1 Charger": ["https://images.unsplash.com/photo-1611170407651-65737bbadd58?auto=format&fit=crop&w=1200&q=85"],
    }
    updated = 0
    for name, images in image_map.items():
        product = Product.query.filter_by(name=name).first()
        if product:
            product.images = json.dumps(images)
            updated += 1
    db.session.commit()
    return jsonify({"updated": updated})


def run_migrations():
    """
    create_all() only creates missing tables, never missing columns. Adds any
    column this build expects but the live database predates. Idempotent.
    """
    wanted = {
        "product": [
            ("product_type", "VARCHAR(20) DEFAULT 'sale'"),
            ("rental_terms", "TEXT"),
            ("specs", "TEXT"),
            ("visible_on_site", "BOOLEAN DEFAULT TRUE"),
            ("visible_in_pos", "BOOLEAN DEFAULT TRUE"),
            ("shop_id", "VARCHAR(36)"),
        ],
        "sale": [
            ("delivery_fee", "DOUBLE PRECISION DEFAULT 0"),
            ("fulfilment", "VARCHAR(20) DEFAULT 'pickup'"),
            ("delivery_address", "VARCHAR(500)"),
            ("shop_id", "VARCHAR(36)"),
            ("sold_by_id", "VARCHAR(36)"),
            ("sold_by_name", "VARCHAR(120)"),
        ],
    }

    inspector = db.inspect(db.engine)
    existing_tables = set(inspector.get_table_names())

    for table, columns in wanted.items():
        if table not in existing_tables:
            continue
        present = {c["name"] for c in inspector.get_columns(table)}
        for name, ddl in columns:
            if name in present:
                continue
            db.session.execute(db.text(f"ALTER TABLE {table} ADD COLUMN {name} {ddl}"))
            print(f"[migration] {table}.{name} added")
        db.session.commit()

    # Backfill rows written before the columns existed.
    db.session.execute(
        db.text(
            "UPDATE product SET product_type = 'sale' WHERE product_type IS NULL"
        )
    )
    db.session.execute(
        db.text(
            "UPDATE product SET visible_on_site = TRUE WHERE visible_on_site IS NULL"
        )
    )
    db.session.execute(
        db.text("UPDATE product SET visible_in_pos = TRUE WHERE visible_in_pos IS NULL")
    )
    db.session.commit()

    # Everything that existed before shops did belongs to the main shop.
    main_id = main_shop().id
    db.session.execute(db.text("UPDATE product SET shop_id = :id WHERE shop_id IS NULL"), {"id": main_id})
    db.session.execute(db.text("UPDATE sale SET shop_id = :id WHERE shop_id IS NULL"), {"id": main_id})
    db.session.commit()


with app.app_context():
    db.create_all()
    seed_data()
    run_migrations()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

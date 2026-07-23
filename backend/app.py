from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
from datetime import datetime, timezone
import uuid as uuid_lib
import os

load_dotenv()

app = Flask(__name__)
CORS(app)
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "postgresql://localhost:5432/alicia_phone_place")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
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
            "categories": [c.name for c in self.categories],
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
    payment_method = db.Column(db.String(30), default="cash")
    customer_name = db.Column(db.String(200), nullable=True)
    customer_phone = db.Column(db.String(50), nullable=True)
    status = db.Column(db.String(20), default="completed")
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
            "payment_method": self.payment_method,
            "customer_name": self.customer_name,
            "customer_phone": self.customer_phone,
            "status": self.status,
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
    )
    for cat_name in data.get("categories", []):
        product.categories.append(get_or_create_category(cat_name))
    db.session.add(product)
    db.session.commit()
    return jsonify(product.to_dict()), 201


@app.put("/api/products/<product_id>")
def update_product(product_id):
    product = Product.query.get_or_404(product_id)
    data = request.get_json(force=True)
    import json

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
    if "categories" in data:
        product.categories = []
        for cat_name in data["categories"]:
            product.categories.append(get_or_create_category(cat_name))
    db.session.commit()
    return jsonify(product.to_dict())


@app.delete("/api/products/<product_id>")
def delete_product(product_id):
    product = Product.query.get_or_404(product_id)
    db.session.delete(product)
    db.session.commit()
    return jsonify({"ok": True})


# ── Inventory / Stock routes ─────────────────────────────────────────────────

@app.get("/api/inventory")
def list_inventory():
    products = Product.query.order_by(Product.name).all()
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
    for item in items:
        product = Product.query.get(item.get("product_id"))
        if not product:
            return jsonify({"error": f"Product not found: {item.get('product_id')}"}), 404
        qty = int(item.get("quantity", 1))
        unit_price = float(item.get("unit_price", product.sales_price or product.price))
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
    total = subtotal + tax - discount
    receipt_no = f"R{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"

    sale = Sale(
        id=gen_id(),
        receipt_no=receipt_no,
        total=total,
        subtotal=subtotal,
        tax=tax,
        discount=discount,
        payment_method=data.get("payment_method", "cash"),
        customer_name=data.get("customer_name"),
        customer_phone=data.get("customer_phone"),
    )
    sale.items = sale_items
    db.session.add(sale)
    db.session.commit()
    return jsonify(sale.to_dict()), 201


@app.get("/api/sales")
def list_sales():
    sales = Sale.query.order_by(Sale.created_at.desc()).limit(100).all()
    return jsonify([s.to_dict() for s in sales])


@app.get("/api/sales/<sale_id>")
def get_sale(sale_id):
    sale = Sale.query.get_or_404(sale_id)
    return jsonify(sale.to_dict())


# ── Dashboard / Stats ────────────────────────────────────────────────────────

@app.get("/api/stats")
def stats():
    total_products = Product.query.count()
    total_categories = Category.query.filter_by(is_active=True).count()
    low_stock = Product.query.filter(Product.stock <= Product.low_stock_threshold).count()
    out_of_stock = Product.query.filter_by(stock=0).count()
    total_sales = Sale.query.count()
    revenue = db.session.query(db.func.coalesce(db.func.sum(Sale.total), 0)).scalar()
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_sales = Sale.query.filter(Sale.created_at >= today_start).count()
    today_revenue = (
        db.session.query(db.func.coalesce(db.func.sum(Sale.total), 0))
        .filter(Sale.created_at >= today_start)
        .scalar()
    )
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


with app.app_context():
    db.create_all()
    seed_data()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

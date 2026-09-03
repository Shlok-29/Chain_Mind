"""
ChainMind — Database Manager (Neon PostgreSQL Integration)
Provides ORM models, dynamic dataset seeding, query utilities, and fallback logging.
"""

import os
from datetime import datetime
import hashlib
from dotenv import load_dotenv
import pandas as pd
from sqlalchemy import (
    create_engine, Column, Integer, String, Float, Boolean, DateTime, Text, text
)
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

# Get Database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

Base = declarative_base()

# ─── SQLAlchemy ORM Models ───────────────────────────────────────────────────

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), index=True, nullable=False)
    industry = Column(String(50), nullable=True, default="Pharma")
    warehouse = Column(String(100), nullable=True, default="Mumbai Central")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = 'audit_logs'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_email = Column(String(120), index=True)
    user_role = Column(String(50), index=True)
    action = Column(String(100), index=True)
    details = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)


class InventoryItem(Base):
    __tablename__ = 'inventory'

    id = Column(Integer, primary_key=True, autoincrement=True)
    industry = Column(String(50), index=True)
    sku = Column(String(50), index=True)
    product_name = Column(String(150))
    warehouse = Column(String(100))
    current_stock = Column(Integer)
    reorder_point = Column(Integer)
    max_stock = Column(Integer)
    unit = Column(String(30))
    unit_cost = Column(Float)
    lead_days = Column(Integer)
    daily_usage = Column(Float)
    days_of_stock = Column(Float)
    last_updated = Column(String(50))
    status = Column(String(30), index=True)


class DemandHistory(Base):
    __tablename__ = 'demand_history'

    id = Column(Integer, primary_key=True, autoincrement=True)
    industry = Column(String(50), index=True)
    sku = Column(String(50), index=True)
    product_name = Column(String(150))
    date = Column(String(30), index=True)
    demand = Column(Integer)
    unit = Column(String(30))


class SupplierItem(Base):
    __tablename__ = 'suppliers'

    id = Column(Integer, primary_key=True, autoincrement=True)
    industry = Column(String(50), index=True)
    sku = Column(String(50), index=True)
    product_name = Column(String(150))
    supplier = Column(String(150))
    reliability_score = Column(Float)
    avg_lead_days = Column(Integer)
    unit_cost = Column(Float)
    min_order_qty = Column(Integer)
    is_preferred = Column(Boolean)
    has_disruption = Column(Boolean)
    disruption_reason = Column(Text, nullable=True)
    disruption_days = Column(Integer)


class PurchaseOrderItem(Base):
    __tablename__ = 'purchase_orders'

    id = Column(Integer, primary_key=True, autoincrement=True)
    industry = Column(String(50), index=True)
    po_number = Column(String(50), unique=True, index=True)
    sku = Column(String(50), index=True)
    product_name = Column(String(150))
    supplier = Column(String(150))
    quantity = Column(Integer)
    unit_cost = Column(Float)
    total_value = Column(Float)
    order_date = Column(String(30))
    expected_delivery = Column(String(30))
    status = Column(String(50))
    warehouse = Column(String(100))
    auto_generated = Column(Boolean)


class WhatsAppAlert(Base):
    __tablename__ = 'whatsapp_alerts'

    id = Column(Integer, primary_key=True, autoincrement=True)
    phone_number = Column(String(30))
    sku = Column(String(150))
    message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class ActionLog(Base):
    __tablename__ = 'action_logs'

    id = Column(Integer, primary_key=True, autoincrement=True)
    category = Column(String(50))
    message = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)


# ─── Database Manager Class ──────────────────────────────────────────────────

class DatabaseManager:
    def __init__(self):
        self.engine = None
        self.SessionLocal = None
        self.is_connected = False
        self._setup_connection()
        self.seed_users()

    def _setup_connection(self):
        if DATABASE_URL:
            try:
                self.engine = create_engine(
                    DATABASE_URL,
                    pool_pre_ping=True,
                    pool_size=10,
                    max_overflow=20
                )
                self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
                Base.metadata.create_all(bind=self.engine)
                self.is_connected = True
                print("DatabaseManager: Successfully initialized Neon PostgreSQL tables.")
                return
            except Exception as e:
                print(f"DatabaseManager Warning: Failed to connect to Neon PostgreSQL ({e}). Falling back to local SQLite.")

        # Fallback to local SQLite database engine
        try:
            sqlite_db_path = os.path.join(os.path.dirname(__file__), "chainmind.db")
            try:
                test_p = os.path.join(os.path.dirname(__file__), ".db_write_test")
                with open(test_p, "w") as f:
                    f.write("ok")
                os.remove(test_p)
            except Exception:
                sqlite_db_path = "/tmp/chainmind.db"

            self.engine = create_engine(
                f"sqlite:///{sqlite_db_path}",
                connect_args={"check_same_thread": False}
            )
            self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
            Base.metadata.create_all(bind=self.engine)
            self.is_connected = True
            print("DatabaseManager: Successfully initialized SQLite database engine.")
        except Exception as e:
            print(f"DatabaseManager Error: Failed to initialize SQLite engine ({e}).")
            self.is_connected = False

    def seed_users(self):
        if not self.SessionLocal:
            return
        session = self.SessionLocal()
        try:
            try:
                user_count = session.query(User).count()
            except Exception:
                session.rollback()
                print("DatabaseManager: Re-creating users table due to schema update...")
                try:
                    session.execute(text("DROP TABLE IF EXISTS users CASCADE;"))
                    session.commit()
                except Exception:
                    session.rollback()
                User.__table__.create(bind=self.engine, checkfirst=True)
                user_count = 0

            try:
                session.query(AuditLog).count()
            except Exception:
                session.rollback()
                print("DatabaseManager: Re-creating audit_logs table due to schema update...")
                try:
                    session.execute(text("DROP TABLE IF EXISTS audit_logs CASCADE;"))
                    session.commit()
                except Exception:
                    session.rollback()
                AuditLog.__table__.create(bind=self.engine, checkfirst=True)

            if user_count == 0:
                default_users = [
                    User(name="Sarah Connor", email="superadmin@chainmind.ai", password_hash=hash_password("chainmind2026"), role="super_admin", industry="Pharma", warehouse="All Warehouses", is_active=True),
                    User(name="Alex Mercer", email="executive@chainmind.ai", password_hash=hash_password("chainmind2026"), role="executive", industry="Pharma", warehouse="All Warehouses", is_active=True),
                    User(name="David Miller", email="opsmanager@chainmind.ai", password_hash=hash_password("chainmind2026"), role="operations_manager", industry="Pharma", warehouse="All Warehouses", is_active=True),
                    User(name="Priya Sharma", email="procurement@chainmind.ai", password_hash=hash_password("chainmind2026"), role="procurement_officer", industry="Pharma", warehouse="Mumbai Central", is_active=True),
                    User(name="Vikram Patel", email="warehouse@chainmind.ai", password_hash=hash_password("chainmind2026"), role="warehouse_manager", industry="Pharma", warehouse="Mumbai Central", is_active=True),
                    User(name="Elena Rostova", email="demand@chainmind.ai", password_hash=hash_password("chainmind2026"), role="demand_planner", industry="Pharma", warehouse="Mumbai Central", is_active=True),
                    User(name="Carlos Mendez", email="supplier@chainmind.ai", password_hash=hash_password("chainmind2026"), role="supplier_manager", industry="Pharma", warehouse="Mumbai Central", is_active=True),
                    User(name="Rachel Green", email="auditor@chainmind.ai", password_hash=hash_password("chainmind2026"), role="auditor", industry="Pharma", warehouse="All Warehouses", is_active=True),
                ]
                session.bulk_save_objects(default_users)
                session.commit()
                print("DatabaseManager: Pre-seeded 8 standard supply chain role users successfully.")
        except Exception as e:
            session.rollback()
            print(f"DatabaseManager Error seeding users: {e}")
        finally:
            session.close()

    def seed_db_from_csv(self, data_dir: str):
        if not self.is_connected or not self.SessionLocal:
            return

        session = self.SessionLocal()
        try:
            # Check if database is already seeded
            inv_count = session.query(InventoryItem).count()
            if inv_count > 0:
                print(f"DatabaseManager: Database already contains {inv_count} inventory records.")
                session.close()
                return

            print("DatabaseManager: Seeding database from local CSVs...")

            # 1. Inventory
            inv_path = os.path.join(data_dir, "inventory.csv")
            if os.path.exists(inv_path):
                df = pd.read_csv(inv_path)
                items = [InventoryItem(**row.to_dict()) for _, row in df.iterrows()]
                session.bulk_save_objects(items)

            # 2. Demand History
            dem_path = os.path.join(data_dir, "demand_history.csv")
            if os.path.exists(dem_path):
                df = pd.read_csv(dem_path)
                items = [DemandHistory(**row.to_dict()) for _, row in df.iterrows()]
                session.bulk_save_objects(items)

            # 3. Suppliers
            sup_path = os.path.join(data_dir, "suppliers.csv")
            if os.path.exists(sup_path):
                df = pd.read_csv(sup_path)
                items = [SupplierItem(**row.to_dict()) for _, row in df.iterrows()]
                session.bulk_save_objects(items)

            # 4. Purchase Orders
            ord_path = os.path.join(data_dir, "purchase_orders.csv")
            if os.path.exists(ord_path):
                df = pd.read_csv(ord_path)
                items = [PurchaseOrderItem(**row.to_dict()) for _, row in df.iterrows()]
                session.bulk_save_objects(items)

            session.commit()
            print("DatabaseManager: Database seeded successfully!")
        except Exception as e:
            session.rollback()
            print(f"DatabaseManager Error seeding database: {e}")
        finally:
            session.close()

    def get_inventory_df(self, industry: str = None, warehouse: str = None) -> pd.DataFrame:
        if self.is_connected and self.engine:
            try:
                query = "SELECT * FROM inventory WHERE 1=1"
                if industry:
                    query += f" AND industry = '{industry}'"
                if warehouse:
                    query += f" AND warehouse = '{warehouse}'"
                df = pd.read_sql(query, self.engine)
                if 'id' in df.columns:
                    df = df.drop(columns=['id'])
                return df
            except Exception as e:
                print(f"DatabaseManager Error querying inventory: {e}")
        return None

    def get_demand_df(self, industry: str = None) -> pd.DataFrame:
        if self.is_connected and self.engine:
            try:
                query = "SELECT * FROM demand_history"
                if industry:
                    query += f" WHERE industry = '{industry}'"
                df = pd.read_sql(query, self.engine)
                if 'id' in df.columns:
                    df = df.drop(columns=['id'])
                return df
            except Exception as e:
                print(f"DatabaseManager Error querying demand history: {e}")
        return None

    def get_suppliers_df(self, industry: str = None) -> pd.DataFrame:
        if self.is_connected and self.engine:
            try:
                query = "SELECT * FROM suppliers"
                if industry:
                    query += f" WHERE industry = '{industry}'"
                df = pd.read_sql(query, self.engine)
                if 'id' in df.columns:
                    df = df.drop(columns=['id'])
                return df
            except Exception as e:
                print(f"DatabaseManager Error querying suppliers: {e}")
        return None

    def get_orders_df(self, industry: str = None) -> pd.DataFrame:
        if self.is_connected and self.engine:
            try:
                query = "SELECT * FROM purchase_orders"
                if industry:
                    query += f" WHERE industry = '{industry}'"
                df = pd.read_sql(query, self.engine)
                if 'id' in df.columns:
                    df = df.drop(columns=['id'])
                return df
            except Exception as e:
                print(f"DatabaseManager Error querying purchase orders: {e}")
        return None

    def log_whatsapp_alert(self, phone_number: str, sku: str, message: str):
        if not self.is_connected or not self.SessionLocal:
            return
        session = self.SessionLocal()
        try:
            alert = WhatsAppAlert(phone_number=phone_number, sku=sku, message=message)
            session.add(alert)
            session.commit()
        except Exception as e:
            session.rollback()
            print(f"DatabaseManager Error logging WhatsApp alert: {e}")
        finally:
            session.close()

    def log_action(self, category: str, message: str):
        if not self.is_connected or not self.SessionLocal:
            return
        session = self.SessionLocal()
        try:
            log = ActionLog(category=category, message=message)
            session.add(log)
            session.commit()
        except Exception as e:
            session.rollback()
            print(f"DatabaseManager Error logging action: {e}")
        finally:
            session.close()

    def log_audit(self, user_email: str, user_role: str, action: str, details: str):
        if not self.is_connected or not self.SessionLocal:
            return
        session = self.SessionLocal()
        try:
            log = AuditLog(
                user_email=user_email,
                user_role=user_role,
                action=action,
                details=details,
                timestamp=datetime.utcnow()
            )
            session.add(log)
            session.commit()
        except Exception as e:
            session.rollback()
            print(f"DatabaseManager Error logging audit event: {e}")
        finally:
            session.close()

# Global Singleton Instance
db_manager = DatabaseManager()


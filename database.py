"""
ChainMind — Database Manager (Neon PostgreSQL Integration)
Provides ORM models, dynamic dataset seeding, query utilities, and fallback logging.
"""

import os
from datetime import datetime
from dotenv import load_dotenv
import pandas as pd
from sqlalchemy import (
    create_engine, Column, Integer, String, Float, Boolean, DateTime, Text
)
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

# Get Database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

Base = declarative_base()

# ─── SQLAlchemy ORM Models ───────────────────────────────────────────────────

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
            except Exception as e:
                print(f"DatabaseManager Warning: Failed to connect to Neon PostgreSQL ({e}). Falling back to local data.")
                self.is_connected = False
        else:
            print("DatabaseManager: No DATABASE_URL provided. Using local CSV data.")
            self.is_connected = False

    def seed_db_from_csv(self, data_dir: str):
        if not self.is_connected or not self.SessionLocal:
            return

        session = self.SessionLocal()
        try:
            # Check if database is already seeded
            inv_count = session.query(InventoryItem).count()
            if inv_count > 0:
                print(f"DatabaseManager: Neon PostgreSQL database already contains {inv_count} inventory records.")
                session.close()
                return

            print("DatabaseManager: Seeding Neon PostgreSQL database from local CSVs...")

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
            print("DatabaseManager: Neon PostgreSQL database seeded successfully!")
        except Exception as e:
            session.rollback()
            print(f"DatabaseManager Error seeding database: {e}")
        finally:
            session.close()

    def get_inventory_df(self, industry: str = None) -> pd.DataFrame:
        if self.is_connected and self.engine:
            try:
                query = "SELECT * FROM inventory"
                if industry:
                    query += f" WHERE industry = '{industry}'"
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

# Global Singleton Instance
db_manager = DatabaseManager()

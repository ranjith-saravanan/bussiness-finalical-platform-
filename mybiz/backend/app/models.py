from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field
from beanie import Document, Indexed

class Counter(Document):
    id: str  # sequence name, e.g. "users", "incomes"
    seq: int = 0

    class Settings:
        name = "counters"


class User(Document):
    id: int
    email: Indexed(str, unique=True)
    hashed_password: str
    full_name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "users"


class Business(Document):
    id: int
    user_id: Indexed(int)
    name: str
    industry: str = "General"
    currency: str = "USD"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "businesses"


class Income(Document):
    id: int
    user_id: Indexed(int)
    source: str
    amount: float
    date: str  # ISO Date YYYY-MM-DD
    category: str = "Salary"
    is_recurring: bool = False
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "incomes"


class Expense(Document):
    id: int
    user_id: Indexed(int)
    title: str
    amount: float
    date: str  # ISO Date YYYY-MM-DD
    category: str = "General"
    is_recurring: bool = False
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "expenses"


class Budget(Document):
    id: int
    user_id: Indexed(int)
    category: str
    amount: float
    month: int  # 1-12
    year: int   # e.g. 2026
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "budgets"


class Savings(Document):
    id: int
    user_id: Indexed(int)
    goal_name: str
    target_amount: float
    current_amount: float = 0.0
    target_date: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "savings"


class Customer(Document):
    id: int
    business_id: Indexed(int)
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    status: str = "active"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "customers"


class Product(Document):
    id: int
    business_id: Indexed(int)
    name: str
    description: Optional[str] = None
    price: float
    type: str = "product"  # "product" or "service"
    sku: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "products"


class SaleItem(BaseModel):
    id: Optional[int] = None
    product_id: Optional[int] = None
    quantity: int = 1
    unit_price: float
    total_price: float


class Sale(Document):
    id: int
    business_id: Indexed(int)
    customer_id: Optional[int] = None
    total_amount: float
    status: str = "paid"  # "paid", "pending", "cancelled"
    date: str
    items: List[SaleItem] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "sales"


class BusinessTransaction(Document):
    id: int
    business_id: Indexed(int)
    type: str  # "revenue" or "expense"
    category: str = "General"
    amount: float
    date: str
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "business_transactions"


class Notification(Document):
    id: int
    user_id: Indexed(int)
    title: str
    message: str
    category: str = "GENERAL"  # "BUDGET", "CASH_FLOW", "SAVINGS", "BUSINESS", "EXPENSE", "FORECAST"
    type: str = "info"  # "alert", "warning", "info", "success"
    is_read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "notifications"

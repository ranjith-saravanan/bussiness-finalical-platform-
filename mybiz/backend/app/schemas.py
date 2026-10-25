from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

# User & Auth
class UserRegister(BaseModel):
    email: str
    password: str = Field(..., min_length=6)
    full_name: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    full_name: str
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

# Business
class BusinessCreate(BaseModel):
    name: str
    industry: Optional[str] = "General"
    currency: Optional[str] = "USD"

class BusinessOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    name: str
    industry: str
    currency: str
    created_at: datetime

# Personal Income
class IncomeCreate(BaseModel):
    source: str
    amount: float = Field(..., gt=0)
    date: str
    category: Optional[str] = "Salary"
    is_recurring: Optional[bool] = False
    notes: Optional[str] = None

class IncomeOut(IncomeCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    created_at: datetime

# Personal Expense
class ExpenseCreate(BaseModel):
    title: str
    amount: float = Field(..., gt=0)
    date: str
    category: Optional[str] = "General"
    is_recurring: Optional[bool] = False
    notes: Optional[str] = None

class ExpenseOut(ExpenseCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    created_at: datetime

# Budget
class BudgetCreate(BaseModel):
    category: str
    amount: float = Field(..., gt=0)
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2020)

class BudgetOut(BudgetCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    created_at: datetime

class BudgetStatusOut(BaseModel):
    id: int
    category: str
    allocated: float
    spent: float
    remaining: float
    percentage: float
    month: int
    year: int

# Savings Goal
class SavingsCreate(BaseModel):
    goal_name: str
    target_amount: float = Field(..., gt=0)
    current_amount: Optional[float] = 0.0
    target_date: Optional[str] = None

class SavingsOut(SavingsCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    created_at: datetime

# Customer
class CustomerCreate(BaseModel):
    business_id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    status: Optional[str] = "active"

class CustomerOut(CustomerCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime

# Product
class ProductCreate(BaseModel):
    business_id: int
    name: str
    description: Optional[str] = None
    price: float = Field(..., ge=0)
    type: Optional[str] = "product"
    sku: Optional[str] = None

class ProductOut(ProductCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime

# Sale Item & Sale
class SaleItemCreate(BaseModel):
    product_id: Optional[int] = None
    quantity: int = Field(1, ge=1)
    unit_price: float = Field(..., ge=0)

class SaleItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    product_id: Optional[int]
    quantity: int
    unit_price: float
    total_price: float

class SaleCreate(BaseModel):
    business_id: int
    customer_id: Optional[int] = None
    date: str
    status: Optional[str] = "paid"
    items: List[SaleItemCreate]

class SaleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    business_id: int
    customer_id: Optional[int]
    total_amount: float
    status: str
    date: str
    created_at: datetime
    items: List[SaleItemOut]

# Business Transaction
class BusinessTransactionCreate(BaseModel):
    business_id: int
    type: str  # "revenue" or "expense"
    category: Optional[str] = "General"
    amount: float = Field(..., gt=0)
    date: str
    description: Optional[str] = None

class BusinessTransactionOut(BusinessTransactionCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime

# Notification
class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime


# Dashboard Unified Metrics
class DashboardSummary(BaseModel):
    total_personal_income: float
    total_personal_expense: float
    net_personal_cashflow: float
    total_savings_current: float
    total_savings_target: float
    total_budget_allocated: float
    total_budget_spent: float
    business_revenue: float
    business_expenses: float
    business_profit: float
    net_total_cashflow: float
    recent_transactions: List[dict]

# AI & Forecast Schemas
class AIChatRequest(BaseModel):
    question: str
    business_id: Optional[int] = None

class AIChatResponse(BaseModel):
    answer: str
    source: str  # "gemini" or "deterministic-advisor"
    financial_context: dict

class AIRecommendation(BaseModel):
    id: str
    category: str
    priority: str  # "high", "medium", "low"
    title: str
    description: str
    impact: str

class ForecastResponse(BaseModel):
    historical_months: List[str]
    forecast_month: str
    forecasted_income: float
    forecasted_expenses: float
    forecasted_net_cashflow: float
    trend_direction: str  # "positive", "negative", "neutral"
    disclaimer: str

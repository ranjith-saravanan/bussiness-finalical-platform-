export interface User {
  id: number;
  email: string;
  full_name: string;
  created_at: string;
}

export interface Business {
  id: number;
  user_id: number;
  name: string;
  industry: string;
  currency: string;
  created_at: string;
}

export interface Income {
  id: number;
  user_id: number;
  source: string;
  amount: number;
  date: string;
  category: string;
  is_recurring: boolean;
  notes?: string;
  created_at: string;
}

export interface Expense {
  id: number;
  user_id: number;
  title: string;
  amount: number;
  date: string;
  category: string;
  is_recurring: boolean;
  notes?: string;
  created_at: string;
}

export interface Budget {
  id: number;
  user_id: number;
  category: string;
  amount: number;
  month: number;
  year: number;
  created_at: string;
}

export interface BudgetStatus {
  id: number;
  category: string;
  allocated: number;
  spent: number;
  remaining: number;
  percentage: number;
  month: number;
  year: number;
}

export interface Savings {
  id: number;
  user_id: number;
  goal_name: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  created_at: string;
}

export interface Customer {
  id: number;
  business_id: number;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  status: string;
  created_at: string;
}

export interface Product {
  id: number;
  business_id: number;
  name: string;
  description?: string;
  price: number;
  type: string;
  sku?: string;
  created_at: string;
}

export interface SaleItem {
  id?: number;
  product_id?: number;
  quantity: number;
  unit_price: number;
  total_price?: number;
}

export interface Sale {
  id: number;
  business_id: number;
  customer_id?: number;
  total_amount: number;
  status: string;
  date: string;
  created_at: string;
  items: SaleItem[];
}

export interface BusinessTransaction {
  id: number;
  business_id: number;
  type: 'revenue' | 'expense';
  category: string;
  amount: number;
  date: string;
  description?: string;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'alert' | 'warning' | 'info' | 'success';
  is_read: boolean;
  created_at: string;
}

export interface DashboardSummary {
  total_personal_income: number;
  total_personal_expense: number;
  net_personal_cashflow: number;
  total_savings_current: number;
  total_savings_target: number;
  total_budget_allocated: number;
  total_budget_spent: number;
  business_revenue: number;
  business_expenses: number;
  business_profit: number;
  net_total_cashflow: number;
  recent_transactions: {
    id: string;
    type: string;
    title: string;
    category: string;
    amount: number;
    date: string;
  }[];
}

export interface AIRecommendation {
  id: string;
  category: string;
  priority: 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  impact: string;
}

export interface ForecastData {
  historical_months: string[];
  forecast_month: string;
  forecasted_income: number;
  forecasted_expenses: number;
  forecasted_net_cashflow: number;
  trend_direction: 'positive' | 'negative' | 'neutral';
  disclaimer: string;
}

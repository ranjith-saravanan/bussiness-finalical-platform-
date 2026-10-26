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
  days_remaining?: number;
  projected_month_end?: number;
  potential_overspend?: number;
  status_flag?: string;
}

export interface Savings {
  id: number;
  user_id: number;
  goal_name: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  created_at: string;
  remaining_amount?: number;
  progress_percentage?: number;
  required_monthly_contribution?: number | null;
  estimated_completion_months?: number | null;
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
  total_revenue?: number;
  sales_count?: number;
  average_order_value?: number;
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
  total_revenue?: number;
  units_sold?: number;
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
  category?: string;
  type: 'alert' | 'warning' | 'info' | 'success';
  is_read: boolean;
  created_at: string;
}

export interface SafeToSpendBreakdown {
  available_personal_cash: number;
  upcoming_personal_commitments: number;
  savings_reserve_requirement: number;
  safety_buffer: number;
  safe_personal_spending: number;
  formula: string;
  disclaimer: string;
}

export interface DashboardSummary {
  total_personal_income: number;
  total_personal_expense: number;
  net_personal_cashflow: number;
  available_personal_cash: number;
  upcoming_personal_commitments: number;
  savings_reserve_requirement: number;
  safety_buffer: number;
  safe_personal_spending: number;
  safe_to_spend_breakdown: SafeToSpendBreakdown;

  total_savings_current: number;
  total_savings_target: number;
  total_budget_allocated: number;
  total_budget_spent: number;

  business_revenue: number;
  business_expenses: number;
  business_profit: number;
  business_margin: number;
  tax_reserve_rate: number;
  suggested_tax_reserve: number;
  net_total_cashflow: number;

  recurring_monthly_commitments: number;
  five_questions: {
    '1_money_in': { personal_income: number; business_revenue: number; total_inflow: number; summary: string };
    '2_money_out': { personal_expenses: number; business_expenses: number; total_outflow: number; summary: string };
    '3_money_kept': { personal_net_cashflow: number; business_profit: number; business_margin: number; after_tax_business_profit: number; summary: string };
    '4_attention': string[];
    '5_next_action': string;
  };

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
  evidence?: string;
}

export interface ForecastData {
  historical_months: string[];
  forecast_month: string;
  forecasted_income: number;
  forecasted_expenses: number;
  forecasted_net_cashflow: number;
  trend_direction: 'positive' | 'negative' | 'neutral';
  income_trend?: string;
  expense_trend?: string;
  forecast_lower?: number;
  forecast_upper?: number;
  recurring_commitments?: number;
  disclaimer: string;
}

export interface CommitmentSummary {
  monthly_recurring_income: number;
  monthly_recurring_expenses: number;
  monthly_recurring_net: number;
  upcoming_commitments_current_month: number;
  upcoming_commitments_next_month: number;
  recurring_items: {
    id: number;
    type: string;
    title: string;
    category: string;
    amount: number;
    status: string;
  }[];
}

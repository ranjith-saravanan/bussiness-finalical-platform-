from typing import List, Dict, Tuple
from datetime import datetime, timedelta

def calculate_linear_regression(y_values: List[float]) -> Tuple[float, float]:
    """Simple linear regression: y = m*x + c"""
    n = len(y_values)
    if n == 0:
        return 0.0, 0.0
    if n == 1:
        return 0.0, y_values[0]
    
    x_values = list(range(n))
    sum_x = sum(x_values)
    sum_y = sum(y_values)
    sum_xy = sum(x * y for x, y in zip(x_values, y_values))
    sum_xx = sum(x * x for x in x_values)
    
    denominator = (n * sum_xx - sum_x * sum_x)
    if denominator == 0:
        return 0.0, sum_y / n
    
    slope = (n * sum_xy - sum_x * sum_y) / denominator
    intercept = (sum_y - slope * sum_x) / n
    return slope, intercept

def forecast_next_period(series: List[float], fallback_avg: float = 0.0) -> float:
    if not series:
        return fallback_avg
    if len(series) <= 2:
        return max(0.0, sum(series) / len(series))
    
    slope, intercept = calculate_linear_regression(series)
    next_x = len(series)
    forecast = slope * next_x + intercept
    # Apply moving average damping (50% regression, 50% last 3 month average)
    recent_avg = sum(series[-3:]) / min(3, len(series))
    blended = 0.5 * forecast + 0.5 * recent_avg
    return max(0.0, blended)

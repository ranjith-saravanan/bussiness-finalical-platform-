from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from app.database import get_next_sequence_value
from app.models import User, Business, Customer, Product, Sale, SaleItem, BusinessTransaction
from app.schemas import (
    BusinessCreate, BusinessOut,
    CustomerCreate, CustomerOut,
    ProductCreate, ProductOut,
    SaleCreate, SaleOut,
    BusinessTransactionCreate, BusinessTransactionOut
)
from app.auth import get_current_user

router = APIRouter(tags=["Business Management"])

async def verify_business_ownership(business_id: int, user_id: int) -> Business:
    biz = await Business.find_one(Business.id == business_id, Business.user_id == user_id)
    if not biz:
        raise HTTPException(status_code=403, detail="Business not found or access denied")
    return biz

# ==================== BUSINESSES ====================
@router.get("/businesses", response_model=List[BusinessOut])
async def get_businesses(current_user: User = Depends(get_current_user)):
    return await Business.find(Business.user_id == current_user.id).to_list()

@router.post("/businesses", response_model=BusinessOut, status_code=status.HTTP_201_CREATED)
async def create_business(biz_in: BusinessCreate, current_user: User = Depends(get_current_user)):
    b_id = await get_next_sequence_value("businesses")
    biz = Business(id=b_id, **biz_in.model_dump(), user_id=current_user.id)
    await biz.insert()
    return biz

@router.delete("/businesses/{biz_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_business(biz_id: int, current_user: User = Depends(get_current_user)):
    biz = await verify_business_ownership(biz_id, current_user.id)
    await Customer.find(Customer.business_id == biz_id).delete()
    await Product.find(Product.business_id == biz_id).delete()
    await Sale.find(Sale.business_id == biz_id).delete()
    await BusinessTransaction.find(BusinessTransaction.business_id == biz_id).delete()
    await biz.delete()
    return None

# ==================== CUSTOMERS ====================
@router.get("/customers", response_model=List[CustomerOut])
async def get_customers(business_id: Optional[int] = None, current_user: User = Depends(get_current_user)):
    user_businesses = await Business.find(Business.user_id == current_user.id).to_list()
    user_biz_ids = [b.id for b in user_businesses]
    if business_id:
        if business_id not in user_biz_ids:
            return []
        user_biz_ids = [business_id]

    customers = await Customer.find({"business_id": {"$in": user_biz_ids}}).sort(-Customer.created_at).to_list()
    sales = await Sale.find({"business_id": {"$in": user_biz_ids}, "status": "paid"}).to_list()
    
    out = []
    for c in customers:
        c_sales = [s for s in sales if s.customer_id == c.id]
        total_rev = sum(s.total_amount for s in c_sales)
        count = len(c_sales)
        aov = round(total_rev / count, 2) if count > 0 else 0.0
        out.append(CustomerOut(
            id=c.id,
            business_id=c.business_id,
            name=c.name,
            email=c.email,
            phone=c.phone,
            company=c.company,
            status=c.status,
            created_at=c.created_at,
            total_revenue=round(total_rev, 2),
            sales_count=count,
            average_order_value=aov
        ))
    return out

@router.post("/customers", response_model=CustomerOut, status_code=status.HTTP_201_CREATED)
async def create_customer(cust_in: CustomerCreate, current_user: User = Depends(get_current_user)):
    await verify_business_ownership(cust_in.business_id, current_user.id)
    c_id = await get_next_sequence_value("customers")
    customer = Customer(id=c_id, **cust_in.model_dump())
    await customer.insert()
    return CustomerOut(
        id=customer.id,
        business_id=customer.business_id,
        name=customer.name,
        email=customer.email,
        phone=customer.phone,
        company=customer.company,
        status=customer.status,
        created_at=customer.created_at,
        total_revenue=0.0,
        sales_count=0,
        average_order_value=0.0
    )

@router.delete("/customers/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_customer(customer_id: int, current_user: User = Depends(get_current_user)):
    user_businesses = await Business.find(Business.user_id == current_user.id).to_list()
    user_biz_ids = [b.id for b in user_businesses]
    customer = await Customer.find_one({"id": customer_id, "business_id": {"$in": user_biz_ids}})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    await customer.delete()
    return None

# ==================== PRODUCTS / SERVICES ====================
@router.get("/products", response_model=List[ProductOut])
async def get_products(business_id: Optional[int] = None, current_user: User = Depends(get_current_user)):
    user_businesses = await Business.find(Business.user_id == current_user.id).to_list()
    user_biz_ids = [b.id for b in user_businesses]
    if business_id:
        if business_id not in user_biz_ids:
            return []
        user_biz_ids = [business_id]

    products = await Product.find({"business_id": {"$in": user_biz_ids}}).to_list()
    paid_sales = await Sale.find({"business_id": {"$in": user_biz_ids}, "status": "paid"}).to_list()
    
    out = []
    for p in products:
        items = [it for s in paid_sales for it in s.items if it.product_id == p.id]
        total_rev = sum(it.total_price for it in items)
        units = sum(it.quantity for it in items)
        out.append(ProductOut(
            id=p.id,
            business_id=p.business_id,
            name=p.name,
            description=p.description,
            price=p.price,
            type=p.type,
            sku=p.sku,
            created_at=p.created_at,
            total_revenue=round(total_rev, 2),
            units_sold=units
        ))
    return out

@router.post("/products", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def create_product(prod_in: ProductCreate, current_user: User = Depends(get_current_user)):
    await verify_business_ownership(prod_in.business_id, current_user.id)
    p_id = await get_next_sequence_value("products")
    prod = Product(id=p_id, **prod_in.model_dump())
    await prod.insert()
    return ProductOut(
        id=prod.id,
        business_id=prod.business_id,
        name=prod.name,
        description=prod.description,
        price=prod.price,
        type=prod.type,
        sku=prod.sku,
        created_at=prod.created_at,
        total_revenue=0.0,
        units_sold=0
    )

@router.delete("/products/{prod_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(prod_id: int, current_user: User = Depends(get_current_user)):
    user_businesses = await Business.find(Business.user_id == current_user.id).to_list()
    user_biz_ids = [b.id for b in user_businesses]
    prod = await Product.find_one({"id": prod_id, "business_id": {"$in": user_biz_ids}})
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    await prod.delete()
    return None

# ==================== SALES ====================
@router.get("/sales", response_model=List[SaleOut])
async def get_sales(business_id: Optional[int] = None, current_user: User = Depends(get_current_user)):
    user_businesses = await Business.find(Business.user_id == current_user.id).to_list()
    user_biz_ids = [b.id for b in user_businesses]
    if business_id:
        if business_id not in user_biz_ids:
            return []
        user_biz_ids = [business_id]
    return await Sale.find({"business_id": {"$in": user_biz_ids}}).sort(-Sale.date, -Sale.id).to_list()

@router.get("/sales/summary")
async def get_sales_summary(business_id: Optional[int] = None, current_user: User = Depends(get_current_user)):
    user_businesses = await Business.find(Business.user_id == current_user.id).to_list()
    user_biz_ids = [b.id for b in user_businesses]
    if business_id:
        if business_id not in user_biz_ids:
            return {
                "total_sales_count": 0,
                "paid_sales_count": 0,
                "paid_sales_amount": 0.0,
                "pending_sales_count": 0,
                "pending_sales_amount": 0.0,
                "cancelled_sales_count": 0,
                "cancelled_sales_amount": 0.0,
                "average_order_value": 0.0
            }
        user_biz_ids = [business_id]
    sales = await Sale.find({"business_id": {"$in": user_biz_ids}}).to_list()

    total_count = len(sales)
    paid_sales = [s for s in sales if s.status == "paid"]
    pending_sales = [s for s in sales if s.status == "pending"]
    cancelled_sales = [s for s in sales if s.status == "cancelled"]

    paid_amount = sum(s.total_amount for s in paid_sales)
    pending_amount = sum(s.total_amount for s in pending_sales)
    cancelled_amount = sum(s.total_amount for s in cancelled_sales)
    aov = round(paid_amount / len(paid_sales), 2) if paid_sales else 0.0

    return {
        "total_sales_count": total_count,
        "paid_sales_count": len(paid_sales),
        "paid_sales_amount": round(paid_amount, 2),
        "pending_sales_count": len(pending_sales),
        "pending_sales_amount": round(pending_amount, 2),
        "cancelled_sales_count": len(cancelled_sales),
        "cancelled_sales_amount": round(cancelled_amount, 2),
        "average_order_value": aov
    }

@router.post("/sales", response_model=SaleOut, status_code=status.HTTP_201_CREATED)
async def record_sale(sale_in: SaleCreate, current_user: User = Depends(get_current_user)):
    await verify_business_ownership(sale_in.business_id, current_user.id)
    
    # Validation
    if sale_in.customer_id:
        cust = await Customer.find_one(
            Customer.id == sale_in.customer_id,
            Customer.business_id == sale_in.business_id
        )
        if not cust:
            raise HTTPException(status_code=400, detail="Customer does not belong to this business")

    if not sale_in.items:
        raise HTTPException(status_code=400, detail="Sale must contain at least one line item")

    items_to_save = []
    for item in sale_in.items:
        if item.quantity <= 0:
            raise HTTPException(status_code=400, detail="Item quantity must be greater than zero")
        if item.unit_price < 0:
            raise HTTPException(status_code=400, detail="Unit price cannot be negative")
        if item.product_id:
            prod = await Product.find_one(
                Product.id == item.product_id,
                Product.business_id == sale_in.business_id
            )
            if not prod:
                raise HTTPException(status_code=400, detail=f"Product ID {item.product_id} does not belong to this business")
        
        si_id = await get_next_sequence_value("sale_items")
        items_to_save.append(SaleItem(
            id=si_id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total_price=round(item.quantity * item.unit_price, 2)
        ))

    # Calculate total
    total = sum(item.total_price for item in items_to_save)
    s_id = await get_next_sequence_value("sales")
    
    sale = Sale(
        id=s_id,
        business_id=sale_in.business_id,
        customer_id=sale_in.customer_id,
        total_amount=round(total, 2),
        status=sale_in.status,
        date=sale_in.date,
        items=items_to_save
    )
    await sale.insert()
    return sale

@router.delete("/sales/{sale_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sale(sale_id: int, current_user: User = Depends(get_current_user)):
    user_businesses = await Business.find(Business.user_id == current_user.id).to_list()
    user_biz_ids = [b.id for b in user_businesses]
    sale = await Sale.find_one({"id": sale_id, "business_id": {"$in": user_biz_ids}})
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    await sale.delete()
    return None

# ==================== BUSINESS TRANSACTIONS (EXPENSES / REVENUE) ====================
@router.get("/business-transactions", response_model=List[BusinessTransactionOut])
async def get_business_transactions(
    business_id: Optional[int] = None,
    type: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    user_businesses = await Business.find(Business.user_id == current_user.id).to_list()
    user_biz_ids = [b.id for b in user_businesses]
    if business_id:
        if business_id not in user_biz_ids:
            return []
        user_biz_ids = [business_id]
    
    query = {"business_id": {"$in": user_biz_ids}}
    if type:
        query["type"] = type
    return await BusinessTransaction.find(query).sort(-BusinessTransaction.date).to_list()

@router.post("/business-transactions", response_model=BusinessTransactionOut, status_code=status.HTTP_201_CREATED)
async def create_business_transaction(
    tx_in: BusinessTransactionCreate,
    current_user: User = Depends(get_current_user)
):
    await verify_business_ownership(tx_in.business_id, current_user.id)
    tx_id = await get_next_sequence_value("business_transactions")
    tx = BusinessTransaction(id=tx_id, **tx_in.model_dump())
    await tx.insert()
    return tx

@router.delete("/business-transactions/{tx_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_business_transaction(tx_id: int, current_user: User = Depends(get_current_user)):
    user_businesses = await Business.find(Business.user_id == current_user.id).to_list()
    user_biz_ids = [b.id for b in user_businesses]
    tx = await BusinessTransaction.find_one({"id": tx_id, "business_id": {"$in": user_biz_ids}})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    await tx.delete()
    return None

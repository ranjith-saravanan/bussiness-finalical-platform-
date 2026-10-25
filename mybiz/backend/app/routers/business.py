from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
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

def verify_business_ownership(business_id: int, user_id: int, db: Session) -> Business:
    biz = db.query(Business).filter(Business.id == business_id, Business.user_id == user_id).first()
    if not biz:
        raise HTTPException(status_code=403, detail="Business not found or access denied")
    return biz

# ==================== BUSINESSES ====================
@router.get("/businesses", response_model=List[BusinessOut])
def get_businesses(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Business).filter(Business.user_id == current_user.id).all()

@router.post("/businesses", response_model=BusinessOut, status_code=status.HTTP_201_CREATED)
def create_business(biz_in: BusinessCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    biz = Business(**biz_in.model_dump(), user_id=current_user.id)
    db.add(biz)
    db.commit()
    db.refresh(biz)
    return biz

@router.delete("/businesses/{biz_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_business(biz_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    biz = verify_business_ownership(biz_id, current_user.id, db)
    db.delete(biz)
    db.commit()
    return None

# ==================== CUSTOMERS ====================
@router.get("/customers", response_model=List[CustomerOut])
def get_customers(business_id: Optional[int] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(Customer).join(Business).filter(Business.user_id == current_user.id)
    if business_id:
        query = query.filter(Customer.business_id == business_id)
    return query.order_by(Customer.created_at.desc()).all()

@router.post("/customers", response_model=CustomerOut, status_code=status.HTTP_201_CREATED)
def create_customer(cust_in: CustomerCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    verify_business_ownership(cust_in.business_id, current_user.id, db)
    customer = Customer(**cust_in.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer

@router.delete("/customers/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(customer_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    customer = db.query(Customer).join(Business)\
        .filter(Customer.id == customer_id, Business.user_id == current_user.id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    db.delete(customer)
    db.commit()
    return None

# ==================== PRODUCTS / SERVICES ====================
@router.get("/products", response_model=List[ProductOut])
def get_products(business_id: Optional[int] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(Product).join(Business).filter(Business.user_id == current_user.id)
    if business_id:
        query = query.filter(Product.business_id == business_id)
    return query.all()

@router.post("/products", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(prod_in: ProductCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    verify_business_ownership(prod_in.business_id, current_user.id, db)
    prod = Product(**prod_in.model_dump())
    db.add(prod)
    db.commit()
    db.refresh(prod)
    return prod

@router.delete("/products/{prod_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(prod_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    prod = db.query(Product).join(Business)\
        .filter(Product.id == prod_id, Business.user_id == current_user.id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(prod)
    db.commit()
    return None

# ==================== SALES ====================
@router.get("/sales", response_model=List[SaleOut])
def get_sales(business_id: Optional[int] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(Sale).join(Business).filter(Business.user_id == current_user.id)
    if business_id:
        query = query.filter(Sale.business_id == business_id)
    return query.order_by(Sale.date.desc(), Sale.id.desc()).all()

@router.post("/sales", response_model=SaleOut, status_code=status.HTTP_201_CREATED)
def record_sale(sale_in: SaleCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    verify_business_ownership(sale_in.business_id, current_user.id, db)
    
    # Calculate total
    total = sum(item.quantity * item.unit_price for item in sale_in.items)
    
    sale = Sale(
        business_id=sale_in.business_id,
        customer_id=sale_in.customer_id,
        total_amount=round(total, 2),
        status=sale_in.status,
        date=sale_in.date
    )
    db.add(sale)
    db.commit()
    db.refresh(sale)

    # Add items
    for item in sale_in.items:
        sale_item = SaleItem(
            sale_id=sale.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total_price=round(item.quantity * item.unit_price, 2)
        )
        db.add(sale_item)
    
    db.commit()
    db.refresh(sale)
    return sale

@router.delete("/sales/{sale_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sale(sale_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sale = db.query(Sale).join(Business)\
        .filter(Sale.id == sale_id, Business.user_id == current_user.id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    db.delete(sale)
    db.commit()
    return None

# ==================== BUSINESS TRANSACTIONS (EXPENSES / REVENUE) ====================
@router.get("/business-transactions", response_model=List[BusinessTransactionOut])
def get_business_transactions(
    business_id: Optional[int] = None,
    type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(BusinessTransaction).join(Business).filter(Business.user_id == current_user.id)
    if business_id:
        query = query.filter(BusinessTransaction.business_id == business_id)
    if type:
        query = query.filter(BusinessTransaction.type == type)
    return query.order_by(BusinessTransaction.date.desc()).all()

@router.post("/business-transactions", response_model=BusinessTransactionOut, status_code=status.HTTP_201_CREATED)
def create_business_transaction(
    tx_in: BusinessTransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    verify_business_ownership(tx_in.business_id, current_user.id, db)
    tx = BusinessTransaction(**tx_in.model_dump())
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx

@router.delete("/business-transactions/{tx_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_business_transaction(tx_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tx = db.query(BusinessTransaction).join(Business)\
        .filter(BusinessTransaction.id == tx_id, Business.user_id == current_user.id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(tx)
    db.commit()
    return None

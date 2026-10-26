from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ReturnDocument
from beanie import init_beanie
from app.config import settings

client: Optional[AsyncIOMotorClient] = None
db = None

async def init_db(client_override=None, db_name_override=None):
    global client, db
    if client_override is not None:
        client = client_override
        db_name = db_name_override or settings.DATABASE_NAME
        db = client[db_name]
    else:
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        db = client[settings.DATABASE_NAME]

    from app.models import (
        Counter, User, Business, Income, Expense,
        Budget, Savings, Customer, Product,
        Sale, BusinessTransaction, Notification
    )

    await init_beanie(
        database=db,
        document_models=[
            Counter,
            User,
            Business,
            Income,
            Expense,
            Budget,
            Savings,
            Customer,
            Product,
            Sale,
            BusinessTransaction,
            Notification,
        ]
    )

async def close_db():
    global client
    if client:
        client.close()

async def get_next_sequence_value(sequence_name: str) -> int:
    global db
    res = await db["counters"].find_one_and_update(
        {"_id": sequence_name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER
    )
    return res["seq"]

async def set_sequence_value(sequence_name: str, value: int):
    global db
    await db["counters"].update_one(
        {"_id": sequence_name},
        {"$max": {"seq": value}},
        upsert=True
    )

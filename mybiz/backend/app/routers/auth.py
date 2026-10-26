from fastapi import APIRouter, Depends, HTTPException, status
from app.database import get_next_sequence_value
from app.models import User, Business
from app.schemas import UserRegister, UserLogin, UserOut, Token
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
async def register(user_in: UserRegister):
    existing = await User.find_one(User.email == user_in.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    user_id = await get_next_sequence_value("users")
    hashed_pw = get_password_hash(user_in.password)
    user = User(
        id=user_id,
        email=user_in.email,
        hashed_password=hashed_pw,
        full_name=user_in.full_name
    )
    await user.insert()

    # Auto-create a default business for the user
    biz_id = await get_next_sequence_value("businesses")
    default_business = Business(
        id=biz_id,
        user_id=user.id,
        name=f"{user.full_name}'s Venture",
        industry="Services",
        currency="USD"
    )
    await default_business.insert()

    token = create_access_token({"sub": str(user.id), "email": user.email})
    return Token(access_token=token, user=UserOut.model_validate(user))

@router.post("/login", response_model=Token)
async def login(user_in: UserLogin):
    user = await User.find_one(User.email == user_in.email)
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = create_access_token({"sub": str(user.id), "email": user.email})
    return Token(access_token=token, user=UserOut.model_validate(user))

@router.get("/me", response_model=UserOut)
async def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user

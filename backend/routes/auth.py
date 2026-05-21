from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth import create_access_token, get_current_user, verify_google_credential
from crud import update_profile, upsert_google_user
from database import get_db
from models import User
from schemas import AuthResponse, GoogleAuthRequest, ProfileUpdate, UserResponse

router = APIRouter()


@router.post("/google", response_model=AuthResponse)
def login_with_google(request: GoogleAuthRequest, db: Session = Depends(get_db)):
    profile = verify_google_credential(request.credential)
    user = upsert_google_user(db, profile)
    access_token = create_access_token(user)

    return AuthResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/profile", response_model=UserResponse)
def update_me(
    updates: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return update_profile(db, current_user, updates)

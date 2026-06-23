from fastapi import APIRouter, Depends, HTTPException, status

from features.auth.utils import get_current_user
from features.bid.service import BidService
from features.bid.schema import CreateBidBody, PayBidBody, BidResponse, PaymentResponse
from features.core.database import db

router = APIRouter(prefix="/bids", tags=["bids"])
service = BidService(db)


@router.post("/posts/{post_id}", response_model=BidResponse, status_code=status.HTTP_201_CREATED)
async def create_bid(
    post_id: int,
    body: CreateBidBody,
    user_id: int = Depends(get_current_user),
):
    try:
        return await service.create_bid(user_id, post_id, body.amount)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/posts/{post_id}", response_model=list[BidResponse])
async def list_bids(
    post_id: int,
    user_id: int = Depends(get_current_user),
):
    try:
        return await service.list_bids(user_id, post_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{bid_id}/accept", response_model=BidResponse)
async def accept_bid(
    bid_id: int,
    user_id: int = Depends(get_current_user),
):
    try:
        return await service.accept_bid(user_id, bid_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{bid_id}/reject", response_model=BidResponse)
async def reject_bid(
    bid_id: int,
    user_id: int = Depends(get_current_user),
):
    try:
        return await service.reject_bid(user_id, bid_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{bid_id}/pay", response_model=PaymentResponse)
async def pay_bid(
    bid_id: int,
    body: PayBidBody,
    user_id: int = Depends(get_current_user),
):
    try:
        return await service.pay_bid(user_id, bid_id, body.cardholder_name, body.card_number)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

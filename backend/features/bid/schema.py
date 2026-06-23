from pydantic import BaseModel, Field
from datetime import datetime


class CreateBidBody(BaseModel):
    amount: float = Field(gt=0)


class PayBidBody(BaseModel):
    cardholder_name: str = Field(min_length=1, max_length=100)
    card_number: str = Field(min_length=12, max_length=19)
    expiry: str = Field(min_length=4, max_length=7)
    cvv: str = Field(min_length=3, max_length=4)


class BidderResponse(BaseModel):
    id: int
    username: str

    class Config:
        from_attributes = True


class BidResponse(BaseModel):
    id: int
    amount: float
    status: str
    createdAt: datetime
    postId: int
    bidderId: int
    bidder: BidderResponse | None = None

    class Config:
        from_attributes = True


class PaymentResponse(BaseModel):
    id: int
    amount: float
    cardholderName: str
    cardLast4: str
    createdAt: datetime
    bidId: int

    class Config:
        from_attributes = True

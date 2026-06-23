from prisma import Prisma


class BidService:
    def __init__(self, db: Prisma):
        self.db = db

    async def assertUserIsMemberOfGroup(self, user_id, group_id):
        membership = await self.db.groupmember.find_unique(
            where={"userId_groupId": {"userId": user_id, "groupId": group_id}}
        )

        if not membership:
            raise ValueError("You are not a member of this group")

    async def create_bid(self, user_id: int, post_id: int, amount: float):
        post = await self.db.post.find_unique(where={"id": post_id})
        if not post:
            raise ValueError("Post not found")

        await self.assertUserIsMemberOfGroup(user_id, post.groupId)

        if post.authorId == user_id:
            raise ValueError("You cannot bid on your own post")

        already_sold = await self.db.bid.find_first(
            where={"postId": post_id, "status": {"in": ["ACCEPTED", "PAID"]}}
        )
        if already_sold:
            raise ValueError("This artwork is no longer available for bids")

        return await self.db.bid.create(
            data={"amount": amount, "postId": post_id, "bidderId": user_id},
            include={"bidder": True},
        )

    async def list_bids(self, user_id: int, post_id: int):
        post = await self.db.post.find_unique(where={"id": post_id})
        if not post:
            raise ValueError("Post not found")

        await self.assertUserIsMemberOfGroup(user_id, post.groupId)

        where = {"postId": post_id}
        if post.authorId != user_id:
            where["bidderId"] = user_id

        return await self.db.bid.find_many(
            where=where,
            order={"createdAt": "desc"},
            include={"bidder": True},
        )

    async def accept_bid(self, user_id: int, bid_id: int):
        bid = await self.db.bid.find_unique(where={"id": bid_id}, include={"post": True})
        if not bid:
            raise ValueError("Bid not found")

        if bid.post.authorId != user_id:
            raise ValueError("Only the artwork owner can accept bids")

        if bid.status != "PENDING":
            raise ValueError("Bid is not pending")

        await self.db.bid.update_many(
            where={"postId": bid.postId, "status": "PENDING", "id": {"not": bid_id}},
            data={"status": "REJECTED"},
        )

        return await self.db.bid.update(
            where={"id": bid_id},
            data={"status": "ACCEPTED"},
            include={"bidder": True},
        )

    async def reject_bid(self, user_id: int, bid_id: int):
        bid = await self.db.bid.find_unique(where={"id": bid_id}, include={"post": True})
        if not bid:
            raise ValueError("Bid not found")

        if bid.post.authorId != user_id:
            raise ValueError("Only the artwork owner can reject bids")

        if bid.status != "PENDING":
            raise ValueError("Bid is not pending")

        return await self.db.bid.update(
            where={"id": bid_id},
            data={"status": "REJECTED"},
            include={"bidder": True},
        )

    async def pay_bid(self, user_id: int, bid_id: int, cardholder_name: str, card_number: str):
        bid = await self.db.bid.find_unique(where={"id": bid_id}, include={"payment": True})
        if not bid:
            raise ValueError("Bid not found")

        if bid.bidderId != user_id:
            raise ValueError("Only the bidder can pay for this bid")

        if bid.status != "ACCEPTED":
            raise ValueError("Bid must be accepted before payment")

        if bid.payment:
            raise ValueError("This bid has already been paid")

        digits_only = "".join(ch for ch in card_number if ch.isdigit())
        if len(digits_only) < 12:
            raise ValueError("Invalid card number")

        payment = await self.db.payment.create(
            data={
                "amount": bid.amount,
                "cardholderName": cardholder_name,
                "cardLast4": digits_only[-4:],
                "bidId": bid_id,
            }
        )

        await self.db.bid.update(where={"id": bid_id}, data={"status": "PAID"})

        return payment

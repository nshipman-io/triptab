from decimal import Decimal
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, CurrentUser
from app.models.trip import Trip, TripMember, MemberRole
from app.models.expense import Expense, ExpenseSplit, ExpenseCategory, SplitType
from app.models.user import User
from app.schemas.expense import (
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseResponse,
    ExpenseSummary,
    UserBalance,
    SettlementPlan,
    Settlement,
)
from app.services.expense.split_calculator import calculate_splits, SplitConfig
from app.services.expense.settlement import optimize_settlements, calculate_balances

router = APIRouter(prefix="/trips/{trip_id}/expenses", tags=["expenses"])


async def check_trip_access(trip_id: str, user_id: str, db: DbSession, require_edit: bool = False):
    """Check if user has access to trip."""
    # First check if user is owner
    result = await db.execute(
        select(Trip).where(Trip.id == trip_id, Trip.owner_id == user_id)
    )
    trip = result.scalar_one_or_none()

    if trip:
        return trip

    # If not owner, check if user is a member
    if require_edit:
        result = await db.execute(
            select(Trip)
            .join(TripMember)
            .where(
                Trip.id == trip_id,
                TripMember.user_id == user_id,
                TripMember.role.in_([MemberRole.OWNER, MemberRole.EDITOR])
            )
        )
    else:
        result = await db.execute(
            select(Trip)
            .join(TripMember)
            .where(Trip.id == trip_id, TripMember.user_id == user_id)
        )

    trip = result.scalar_one_or_none()

    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    return trip


async def get_trip_member_ids(trip_id: str, db: DbSession) -> list[str]:
    """Get all member IDs for a trip including owner."""
    result = await db.execute(
        select(Trip).options(selectinload(Trip.members)).where(Trip.id == trip_id)
    )
    trip = result.scalar_one_or_none()
    if not trip:
        return []

    member_ids = [trip.owner_id]
    for member in trip.members:
        if member.user_id not in member_ids:
            member_ids.append(member.user_id)

    return member_ids


@router.get("", response_model=list[ExpenseResponse])
async def get_expenses(trip_id: str, current_user: CurrentUser, db: DbSession):
    """Get all expenses for a trip."""
    await check_trip_access(trip_id, current_user.id, db)

    result = await db.execute(
        select(Expense)
        .options(selectinload(Expense.splits))
        .where(Expense.trip_id == trip_id)
        .order_by(Expense.expense_date.desc(), Expense.created_at.desc())
    )
    expenses = result.scalars().all()

    return expenses


@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(
    trip_id: str,
    expense_data: ExpenseCreate,
    current_user: CurrentUser,
    db: DbSession
):
    """Create a new expense with splits."""
    await check_trip_access(trip_id, current_user.id, db, require_edit=True)

    # Get member IDs for splitting
    if expense_data.member_ids:
        member_ids = expense_data.member_ids
    else:
        member_ids = await get_trip_member_ids(trip_id, db)

    # Create expense
    expense = Expense(
        trip_id=trip_id,
        paid_by_id=current_user.id,
        description=expense_data.description,
        amount=expense_data.amount,
        currency=expense_data.currency,
        category=ExpenseCategory(expense_data.category),
        split_type=SplitType(expense_data.split_type),
        expense_date=expense_data.expense_date,
        receipt_url=expense_data.receipt_url,
        notes=expense_data.notes,
    )
    db.add(expense)
    await db.flush()

    # Calculate splits
    split_configs: list[SplitConfig] | None = None
    if expense_data.split_configs:
        split_configs = [
            {
                'user_id': sc.user_id,
                'percentage': sc.percentage,
                'shares': sc.shares,
                'amount': sc.amount,
            }
            for sc in expense_data.split_configs
        ]

    calculated_splits = calculate_splits(
        total_amount=expense_data.amount,
        split_type=SplitType(expense_data.split_type),
        member_ids=member_ids,
        split_configs=split_configs,
    )

    # Create split records
    for split_data in calculated_splits:
        split = ExpenseSplit(
            expense_id=expense.id,
            user_id=split_data['user_id'],
            amount=split_data['amount'],
            percentage=split_data['percentage'],
            shares=split_data['shares'],
        )
        db.add(split)

    await db.flush()
    await db.refresh(expense, ["splits"])

    return expense


# IMPORTANT: These routes MUST come before /{expense_id} routes
# Otherwise "summary" and "settlements" get matched as expense_id

@router.get("/summary", response_model=ExpenseSummary)
async def get_expense_summary(
    trip_id: str,
    current_user: CurrentUser,
    db: DbSession
):
    """Get expense summary with balances for all trip members."""
    await check_trip_access(trip_id, current_user.id, db)

    # Get all expenses with splits
    result = await db.execute(
        select(Expense)
        .options(selectinload(Expense.splits))
        .where(Expense.trip_id == trip_id)
    )
    expenses = result.scalars().all()

    # Get user names
    member_ids = await get_trip_member_ids(trip_id, db)
    result = await db.execute(
        select(User).where(User.id.in_(member_ids))
    )
    users = {user.id: user.name for user in result.scalars().all()}

    # Calculate totals and balances
    total_expenses = sum(e.amount for e in expenses)
    expense_count = len(expenses)

    # Track paid and owed per user
    paid_by_user: dict[str, Decimal] = {uid: Decimal(0) for uid in member_ids}
    owed_by_user: dict[str, Decimal] = {uid: Decimal(0) for uid in member_ids}

    for expense in expenses:
        paid_by_user[expense.paid_by_id] = paid_by_user.get(expense.paid_by_id, Decimal(0)) + expense.amount

        for split in expense.splits:
            if not split.is_settled:
                owed_by_user[split.user_id] = owed_by_user.get(split.user_id, Decimal(0)) + split.amount

    balances = [
        UserBalance(
            user_id=uid,
            user_name=users.get(uid, "Unknown"),
            total_paid=paid_by_user.get(uid, Decimal(0)),
            total_owed=owed_by_user.get(uid, Decimal(0)),
            net_balance=paid_by_user.get(uid, Decimal(0)) - owed_by_user.get(uid, Decimal(0)),
        )
        for uid in member_ids
    ]

    return ExpenseSummary(
        total_expenses=total_expenses,
        expense_count=expense_count,
        balances=balances,
    )


@router.get("/settlements", response_model=SettlementPlan)
async def get_settlement_plan(
    trip_id: str,
    current_user: CurrentUser,
    db: DbSession
):
    """Get optimized settlement plan to minimize transactions."""
    await check_trip_access(trip_id, current_user.id, db)

    # Get all expenses with splits
    result = await db.execute(
        select(Expense)
        .options(selectinload(Expense.splits))
        .where(Expense.trip_id == trip_id)
    )
    expenses = result.scalars().all()

    # Get user names
    member_ids = await get_trip_member_ids(trip_id, db)
    result = await db.execute(
        select(User).where(User.id.in_(member_ids))
    )
    users = {user.id: user.name for user in result.scalars().all()}

    # Convert to format expected by settlement calculator
    expenses_data = [
        {
            'paid_by_id': e.paid_by_id,
            'amount': e.amount,
            'splits': [
                {
                    'user_id': s.user_id,
                    'amount': s.amount,
                    'is_settled': s.is_settled,
                }
                for s in e.splits
            ]
        }
        for e in expenses
    ]

    # Calculate balances and optimize settlements
    balances = calculate_balances(expenses_data)
    optimal_settlements = optimize_settlements(balances)

    settlements = [
        Settlement(
            from_user_id=s.from_user_id,
            from_user_name=users.get(s.from_user_id, "Unknown"),
            to_user_id=s.to_user_id,
            to_user_name=users.get(s.to_user_id, "Unknown"),
            amount=s.amount,
        )
        for s in optimal_settlements
    ]

    return SettlementPlan(
        settlements=settlements,
        total_transactions=len(settlements),
    )


# Routes with {expense_id} path parameter come AFTER static routes

@router.get("/{expense_id}", response_model=ExpenseResponse)
async def get_expense(
    trip_id: str,
    expense_id: str,
    current_user: CurrentUser,
    db: DbSession
):
    """Get a specific expense."""
    await check_trip_access(trip_id, current_user.id, db)

    result = await db.execute(
        select(Expense)
        .options(selectinload(Expense.splits))
        .where(Expense.id == expense_id, Expense.trip_id == trip_id)
    )
    expense = result.scalar_one_or_none()

    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")

    return expense


@router.put("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    trip_id: str,
    expense_id: str,
    expense_data: ExpenseUpdate,
    current_user: CurrentUser,
    db: DbSession
):
    """Update an expense."""
    await check_trip_access(trip_id, current_user.id, db, require_edit=True)

    result = await db.execute(
        select(Expense)
        .options(selectinload(Expense.splits))
        .where(Expense.id == expense_id, Expense.trip_id == trip_id)
    )
    expense = result.scalar_one_or_none()

    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")

    update_data = expense_data.model_dump(exclude_unset=True, exclude={"split_configs", "member_ids"})

    if "category" in update_data:
        update_data["category"] = ExpenseCategory(update_data["category"])
    if "split_type" in update_data:
        update_data["split_type"] = SplitType(update_data["split_type"])

    for field, value in update_data.items():
        setattr(expense, field, value)

    # Recalculate splits if amount or split config changed
    if expense_data.amount or expense_data.split_type or expense_data.split_configs or expense_data.member_ids:
        # Delete existing splits
        for split in expense.splits:
            await db.delete(split)
        await db.flush()

        # Get member IDs
        if expense_data.member_ids:
            member_ids = expense_data.member_ids
        else:
            member_ids = await get_trip_member_ids(trip_id, db)

        # Recalculate
        split_configs: list[SplitConfig] | None = None
        if expense_data.split_configs:
            split_configs = [
                {
                    'user_id': sc.user_id,
                    'percentage': sc.percentage,
                    'shares': sc.shares,
                    'amount': sc.amount,
                }
                for sc in expense_data.split_configs
            ]

        calculated_splits = calculate_splits(
            total_amount=expense.amount,
            split_type=expense.split_type,
            member_ids=member_ids,
            split_configs=split_configs,
        )

        for split_data in calculated_splits:
            split = ExpenseSplit(
                expense_id=expense.id,
                user_id=split_data['user_id'],
                amount=split_data['amount'],
                percentage=split_data['percentage'],
                shares=split_data['shares'],
            )
            db.add(split)

    await db.flush()
    await db.refresh(expense, ["splits"])

    return expense


@router.delete("/{expense_id}")
async def delete_expense(
    trip_id: str,
    expense_id: str,
    current_user: CurrentUser,
    db: DbSession
):
    """Delete an expense."""
    await check_trip_access(trip_id, current_user.id, db, require_edit=True)

    result = await db.execute(
        select(Expense)
        .where(Expense.id == expense_id, Expense.trip_id == trip_id)
    )
    expense = result.scalar_one_or_none()

    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")

    await db.delete(expense)
    await db.flush()

    return {"message": "Expense deleted"}


@router.post("/{expense_id}/settle")
async def settle_expense_split(
    trip_id: str,
    expense_id: str,
    split_id: str,
    current_user: CurrentUser,
    db: DbSession
):
    """Mark a split as settled."""
    await check_trip_access(trip_id, current_user.id, db, require_edit=True)

    result = await db.execute(
        select(ExpenseSplit)
        .join(Expense)
        .where(
            ExpenseSplit.id == split_id,
            Expense.id == expense_id,
            Expense.trip_id == trip_id
        )
    )
    split = result.scalar_one_or_none()

    if not split:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Split not found")

    split.is_settled = True
    await db.flush()

    return {"message": "Split marked as settled"}

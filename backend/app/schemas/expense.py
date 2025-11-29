from pydantic import BaseModel, Field
from datetime import datetime, date
from decimal import Decimal
from typing import Literal


ExpenseCategoryEnum = Literal["food", "transport", "lodging", "activity", "shopping", "other"]
SplitTypeEnum = Literal["equal", "percentage", "shares", "exact"]


class ExpenseSplitConfig(BaseModel):
    """Configuration for how to split an expense for a user."""
    user_id: str
    percentage: Decimal | None = None
    shares: int | None = None
    amount: Decimal | None = None


class ExpenseSplitResponse(BaseModel):
    id: str
    expense_id: str
    user_id: str
    amount: Decimal
    percentage: Decimal | None
    shares: int | None
    is_settled: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ExpenseCreate(BaseModel):
    description: str
    amount: Decimal = Field(gt=0)
    currency: str = "USD"
    category: ExpenseCategoryEnum = "other"
    split_type: SplitTypeEnum = "equal"
    expense_date: date
    receipt_url: str | None = None
    notes: str | None = None
    split_configs: list[ExpenseSplitConfig] | None = None
    member_ids: list[str] | None = None  # For equal splits


class ExpenseUpdate(BaseModel):
    description: str | None = None
    amount: Decimal | None = Field(default=None, gt=0)
    currency: str | None = None
    category: ExpenseCategoryEnum | None = None
    split_type: SplitTypeEnum | None = None
    expense_date: date | None = None
    receipt_url: str | None = None
    notes: str | None = None
    split_configs: list[ExpenseSplitConfig] | None = None
    member_ids: list[str] | None = None


class ExpenseResponse(BaseModel):
    id: str
    trip_id: str
    description: str
    amount: Decimal
    currency: str
    category: str
    paid_by_id: str
    split_type: str
    expense_date: date
    receipt_url: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime
    splits: list[ExpenseSplitResponse] = []

    class Config:
        from_attributes = True


class UserBalance(BaseModel):
    user_id: str
    user_name: str
    total_paid: Decimal
    total_owed: Decimal
    net_balance: Decimal  # positive = owed money, negative = owes money


class ExpenseSummary(BaseModel):
    total_expenses: Decimal
    expense_count: int
    balances: list[UserBalance]


class Settlement(BaseModel):
    from_user_id: str
    from_user_name: str
    to_user_id: str
    to_user_name: str
    amount: Decimal


class SettlementPlan(BaseModel):
    settlements: list[Settlement]
    total_transactions: int


class SettleSplitRequest(BaseModel):
    split_id: str

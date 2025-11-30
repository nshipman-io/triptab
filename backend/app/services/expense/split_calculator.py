from decimal import Decimal, ROUND_HALF_UP, ROUND_DOWN
from typing import TypedDict
from app.models.expense import SplitType


class SplitConfig(TypedDict, total=False):
    """Configuration for a single user's split."""
    user_id: str
    percentage: Decimal | None


class CalculatedSplit(TypedDict):
    """Result of split calculation for a single user."""
    user_id: str
    amount: Decimal
    percentage: Decimal | None


def calculate_splits(
    total_amount: Decimal,
    split_type: SplitType,
    member_ids: list[str],
    split_configs: list[SplitConfig] | None = None,
) -> list[CalculatedSplit]:
    """Calculate expense splits based on the split type.

    Args:
        total_amount: Total expense amount
        split_type: Type of split (equal or percentage)
        member_ids: List of member user IDs to split among
        split_configs: Optional configuration for each member's split

    Returns:
        List of CalculatedSplit with amounts for each user
    """
    if not member_ids:
        return []

    if split_type == SplitType.EQUAL:
        return _calculate_equal_split(total_amount, member_ids)

    elif split_type == SplitType.PERCENTAGE:
        if not split_configs:
            raise ValueError("Percentage splits require split_configs")
        return _calculate_percentage_split(total_amount, split_configs)

    else:
        raise ValueError(f"Unknown split type: {split_type}")


def _calculate_equal_split(
    total_amount: Decimal,
    member_ids: list[str],
) -> list[CalculatedSplit]:
    """Split equally among all members using remainder distribution."""
    num_members = len(member_ids)
    # Use ROUND_DOWN to avoid over-allocation, then distribute remainder
    base_amount = (total_amount / num_members).quantize(Decimal('0.01'), rounding=ROUND_DOWN)
    remainder = total_amount - (base_amount * num_members)
    # Convert remainder to cents for distribution
    remainder_cents = int(remainder * 100)

    splits = []
    running_total = Decimal(0)

    for i, user_id in enumerate(member_ids):
        if i == num_members - 1:
            # Last person gets whatever remains to ensure exact total
            amount = total_amount - running_total
        else:
            amount = base_amount
            # Distribute remainder cents to first few members
            if i < remainder_cents:
                amount += Decimal('0.01')
            running_total += amount

        splits.append({
            'user_id': user_id,
            'amount': amount,
            'percentage': Decimal(100 / num_members).quantize(Decimal('0.01')),
        })

    return splits


def _calculate_percentage_split(
    total_amount: Decimal,
    split_configs: list[SplitConfig],
) -> list[CalculatedSplit]:
    """Split by percentage."""
    total_percentage = sum(
        config.get('percentage', Decimal(0)) or Decimal(0)
        for config in split_configs
    )

    if abs(total_percentage - Decimal(100)) > Decimal('0.01'):
        raise ValueError(f"Percentages must sum to 100, got {total_percentage}")

    splits = []
    running_total = Decimal(0)

    for i, config in enumerate(split_configs):
        percentage = config.get('percentage', Decimal(0)) or Decimal(0)

        if i == len(split_configs) - 1:
            # Last person gets the remainder to avoid rounding errors
            amount = total_amount - running_total
        else:
            amount = (total_amount * percentage / 100).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            running_total += amount

        splits.append({
            'user_id': config['user_id'],
            'amount': amount,
            'percentage': percentage,
        })

    return splits

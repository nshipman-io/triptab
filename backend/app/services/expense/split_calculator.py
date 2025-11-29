from decimal import Decimal, ROUND_HALF_UP
from typing import TypedDict
from app.models.expense import SplitType


class SplitConfig(TypedDict, total=False):
    """Configuration for a single user's split."""
    user_id: str
    percentage: Decimal | None
    shares: int | None
    amount: Decimal | None


class CalculatedSplit(TypedDict):
    """Result of split calculation for a single user."""
    user_id: str
    amount: Decimal
    percentage: Decimal | None
    shares: int | None


def calculate_splits(
    total_amount: Decimal,
    split_type: SplitType,
    member_ids: list[str],
    split_configs: list[SplitConfig] | None = None,
) -> list[CalculatedSplit]:
    """Calculate expense splits based on the split type.

    Args:
        total_amount: Total expense amount
        split_type: Type of split (equal, percentage, shares, exact)
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

    elif split_type == SplitType.SHARES:
        if not split_configs:
            raise ValueError("Shares splits require split_configs")
        return _calculate_shares_split(total_amount, split_configs)

    elif split_type == SplitType.EXACT:
        if not split_configs:
            raise ValueError("Exact splits require split_configs")
        return _calculate_exact_split(total_amount, split_configs)

    else:
        raise ValueError(f"Unknown split type: {split_type}")


def _calculate_equal_split(
    total_amount: Decimal,
    member_ids: list[str],
) -> list[CalculatedSplit]:
    """Split equally among all members."""
    num_members = len(member_ids)
    base_amount = (total_amount / num_members).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    remainder = total_amount - (base_amount * num_members)

    splits = []
    for i, user_id in enumerate(member_ids):
        amount = base_amount
        # Distribute remainder cents to first few members
        if i < int(remainder * 100):
            amount += Decimal('0.01')

        splits.append({
            'user_id': user_id,
            'amount': amount,
            'percentage': Decimal(100 / num_members).quantize(Decimal('0.01')),
            'shares': None,
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
            'shares': None,
        })

    return splits


def _calculate_shares_split(
    total_amount: Decimal,
    split_configs: list[SplitConfig],
) -> list[CalculatedSplit]:
    """Split by shares (e.g., 2 shares for adults, 1 for kids)."""
    total_shares = sum(
        config.get('shares', 1) or 1
        for config in split_configs
    )

    if total_shares <= 0:
        raise ValueError("Total shares must be positive")

    splits = []
    running_total = Decimal(0)

    for i, config in enumerate(split_configs):
        shares = config.get('shares', 1) or 1

        if i == len(split_configs) - 1:
            # Last person gets the remainder
            amount = total_amount - running_total
        else:
            amount = (total_amount * shares / total_shares).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            running_total += amount

        percentage = Decimal(shares * 100 / total_shares).quantize(Decimal('0.01'))

        splits.append({
            'user_id': config['user_id'],
            'amount': amount,
            'percentage': percentage,
            'shares': shares,
        })

    return splits


def _calculate_exact_split(
    total_amount: Decimal,
    split_configs: list[SplitConfig],
) -> list[CalculatedSplit]:
    """Split by exact amounts."""
    total_specified = sum(
        config.get('amount', Decimal(0)) or Decimal(0)
        for config in split_configs
    )

    if abs(total_specified - total_amount) > Decimal('0.01'):
        raise ValueError(f"Exact amounts must sum to total ({total_amount}), got {total_specified}")

    splits = []
    for config in split_configs:
        amount = config.get('amount', Decimal(0)) or Decimal(0)
        percentage = (amount / total_amount * 100).quantize(Decimal('0.01')) if total_amount else Decimal(0)

        splits.append({
            'user_id': config['user_id'],
            'amount': amount,
            'percentage': percentage,
            'shares': None,
        })

    return splits

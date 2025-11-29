from decimal import Decimal
from typing import TypedDict
from dataclasses import dataclass


class Balance(TypedDict):
    """Net balance for a user (positive = owed money, negative = owes money)."""
    user_id: str
    amount: Decimal


@dataclass
class Settlement:
    """A single settlement transaction."""
    from_user_id: str
    to_user_id: str
    amount: Decimal


def calculate_balances(
    expenses_data: list[dict],
) -> list[Balance]:
    """Calculate net balances for all users from expense data.

    Args:
        expenses_data: List of expenses with 'paid_by_id' and 'splits' containing
                      {'user_id': str, 'amount': Decimal, 'is_settled': bool}

    Returns:
        List of Balance objects (positive = owed money, negative = owes money)
    """
    balances: dict[str, Decimal] = {}

    for expense in expenses_data:
        paid_by = expense['paid_by_id']
        total_paid = Decimal(str(expense['amount']))

        # Person who paid is owed the total
        balances[paid_by] = balances.get(paid_by, Decimal(0)) + total_paid

        # Each person in the split owes their portion
        for split in expense.get('splits', []):
            if split.get('is_settled', False):
                continue  # Skip already settled splits

            user_id = split['user_id']
            split_amount = Decimal(str(split['amount']))
            balances[user_id] = balances.get(user_id, Decimal(0)) - split_amount

    return [
        {'user_id': user_id, 'amount': amount}
        for user_id, amount in balances.items()
        if abs(amount) > Decimal('0.01')  # Filter out zero balances
    ]


def optimize_settlements(balances: list[Balance]) -> list[Settlement]:
    """Calculate minimum transactions to settle all debts.

    Uses a greedy algorithm to minimize the number of transactions:
    1. Separate creditors (positive balance) and debtors (negative balance)
    2. Match largest creditor with largest debtor
    3. Settle the minimum of their amounts
    4. Repeat until all settled

    Args:
        balances: List of net balances for each user

    Returns:
        List of Settlement transactions to make everyone even
    """
    # Separate into creditors and debtors
    creditors: list[tuple[str, Decimal]] = []
    debtors: list[tuple[str, Decimal]] = []

    for balance in balances:
        amount = balance['amount']
        if amount > Decimal('0.01'):
            creditors.append((balance['user_id'], amount))
        elif amount < Decimal('-0.01'):
            debtors.append((balance['user_id'], abs(amount)))

    # Sort by amount descending for optimal matching
    creditors.sort(key=lambda x: x[1], reverse=True)
    debtors.sort(key=lambda x: x[1], reverse=True)

    settlements: list[Settlement] = []

    while creditors and debtors:
        creditor_id, credit_amount = creditors[0]
        debtor_id, debt_amount = debtors[0]

        # Settlement amount is the minimum of the two
        settle_amount = min(credit_amount, debt_amount)

        if settle_amount > Decimal('0.01'):
            settlements.append(Settlement(
                from_user_id=debtor_id,
                to_user_id=creditor_id,
                amount=settle_amount.quantize(Decimal('0.01'))
            ))

        # Update remaining amounts
        remaining_credit = credit_amount - settle_amount
        remaining_debt = debt_amount - settle_amount

        # Remove or update creditor
        creditors.pop(0)
        if remaining_credit > Decimal('0.01'):
            # Insert back in sorted position
            _insert_sorted(creditors, (creditor_id, remaining_credit))

        # Remove or update debtor
        debtors.pop(0)
        if remaining_debt > Decimal('0.01'):
            _insert_sorted(debtors, (debtor_id, remaining_debt))

    return settlements


def _insert_sorted(
    sorted_list: list[tuple[str, Decimal]],
    item: tuple[str, Decimal],
) -> None:
    """Insert item into sorted list (descending by amount)."""
    amount = item[1]
    for i, (_, existing_amount) in enumerate(sorted_list):
        if amount > existing_amount:
            sorted_list.insert(i, item)
            return
    sorted_list.append(item)


def format_settlement_summary(
    settlements: list[Settlement],
    user_names: dict[str, str],
) -> list[str]:
    """Format settlements as human-readable strings.

    Args:
        settlements: List of Settlement objects
        user_names: Mapping of user_id to display name

    Returns:
        List of formatted strings like "Alice owes Bob $25.00"
    """
    return [
        f"{user_names.get(s.from_user_id, s.from_user_id)} owes "
        f"{user_names.get(s.to_user_id, s.to_user_id)} ${s.amount:.2f}"
        for s in settlements
    ]

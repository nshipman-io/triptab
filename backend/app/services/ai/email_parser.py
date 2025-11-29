from app.services.ai.agents import email_parser_agent, EmailParserDeps
from app.services.ai.schemas import ParsedReservation


async def parse_reservation_email(content: str) -> ParsedReservation:
    """Parse email content and return structured reservation data.

    Args:
        content: Raw email text content to parse

    Returns:
        ParsedReservation with extracted details
    """
    deps = EmailParserDeps(raw_email_content=content)
    result = await email_parser_agent.run(
        f"Parse this confirmation email and extract the reservation details:\n\n{content}",
        deps=deps
    )
    return result.output

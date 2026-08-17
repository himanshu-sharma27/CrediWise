"""CrediWiseAI - Assessment Report PDF Generation Service.

Provides reusable PDF generation using ReportLab for loan assessment outcomes.
"""

from __future__ import annotations

import io
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


def _format_inr(val: Optional[float]) -> str:
    """Helper to format numbers in INR currency style."""
    if val is None:
        return "N/A"
    return f"Rs. {val:,.2f}" if isinstance(val, (int, float)) else str(val)


def _format_lakhs_crores(val: Optional[float]) -> str:
    """Helper to format amounts in Lakhs and Crores."""
    if val is None or not isinstance(val, (int, float)):
        return ""
    if val >= 10_000_000:
        return f"{val / 10_000_000:.2f} Cr"
    elif val >= 100_000:
        return f"{val / 100_000:.2f} Lakhs"
    return f"{val:,.0f}"


def generate_assessment_pdf(
    application: Any,
    prediction: Any,
    risk_assessment: Optional[Dict[str, Any]] = None,
) -> bytes:
    """Generates a professional, authoritative PDF assessment report.

    Args:
        application: LoanApplication SQLAlchemy model or dict-like object.
        prediction: PredictionResult SQLAlchemy model or dict-like object.
        risk_assessment: Dict with risk evaluation metrics.

    Returns:
        bytes: The compiled PDF document in memory.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    primary_teal = colors.HexColor("#0D3B3A")
    coral_accent = colors.HexColor("#E06D53")
    dark_slate = colors.HexColor("#1E293B")
    muted_slate = colors.HexColor("#64748B")
    cream_bg = colors.HexColor("#F8FAF9")
    border_color = colors.HexColor("#E2E8F0")

    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=primary_teal,
    )

    subtitle_style = ParagraphStyle(
        "ReportSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=13,
        textColor=muted_slate,
    )

    section_header = ParagraphStyle(
        "SectionHeader",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=primary_teal,
        spaceBefore=8,
        spaceAfter=4,
    )

    cell_label_style = ParagraphStyle(
        "CellLabel",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=muted_slate,
    )

    cell_value_style = ParagraphStyle(
        "CellValue",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=dark_slate,
    )

    disclaimer_style = ParagraphStyle(
        "Disclaimer",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#78350F"),
    )

    elements: List[Any] = []

    # 1. Header Banner
    app_number = getattr(application, "application_number", "N/A")
    created_date = getattr(application, "created_at", datetime.now(timezone.utc))
    if isinstance(created_date, datetime):
        formatted_date = created_date.strftime("%d %b %Y, %H:%M UTC")
    else:
        formatted_date = str(created_date)

    header_table_data = [
        [
            Paragraph("<b>CrediWise</b> — Underwriting Assessment Report", title_style),
            Paragraph(
                f"<b>Application ID:</b> {app_number}<br/>"
                f"<b>Date:</b> {formatted_date}<br/>"
                f"<b>Model:</b> {getattr(prediction, 'model_version', 'loan-model-v2.0')}",
                subtitle_style,
            ),
        ]
    ]
    header_table = Table(header_table_data, colWidths=[340, 200])
    header_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ALIGN", (1, 0), (1, 0), "RIGHT"),
            ]
        )
    )
    elements.append(header_table)
    elements.append(Spacer(1, 10))
    elements.append(
        HRFlowable(
            width="100%",
            thickness=1.5,
            color=primary_teal,
            spaceBefore=0,
            spaceAfter=12,
        )
    )

    # 2. Executive Decision Card
    recommendation = getattr(prediction, "recommendation", "REJECTED")
    prob_val = getattr(prediction, "approval_probability", 0.0)
    risk_level = getattr(prediction, "risk_level", "MEDIUM")
    
    health_score = 50.0
    summary_text = "Standard profile analysis."
    eligible_amount = None
    if risk_assessment:
        health_score = risk_assessment.get("financial_health_score", 50.0)
        summary_text = risk_assessment.get("summary", summary_text)
        eligible_amount = risk_assessment.get("estimated_eligible_loan_amount")

    decision_bg = colors.HexColor("#ECFDF5") if recommendation == "APPROVED" else colors.HexColor("#FEF2F2")
    decision_color = colors.HexColor("#065F46") if recommendation == "APPROVED" else colors.HexColor("#991B1B")

    decision_data = [
        [
            Paragraph(f"<font size=11><b>FINAL ASSESSMENT RECOMMENDATION:</b></font><br/><font size=16 color='{decision_color.hexval()}'><b>{recommendation}</b></font>", styles["Normal"]),
            Paragraph(f"<b>Approval Probability:</b> {prob_val * 100:.1f}%<br/><b>Risk Level:</b> {risk_level}", styles["Normal"]),
            Paragraph(f"<b>Financial Health Score:</b> {health_score:.1f} / 100<br/><b>Applicant:</b> {getattr(application, 'applicant_name', 'N/A')}", styles["Normal"]),
        ]
    ]
    decision_table = Table(decision_data, colWidths=[180, 180, 180])
    decision_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), decision_bg),
                ("BOX", (0, 0), (-1, -1), 1, border_color),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    elements.append(decision_table)
    elements.append(Spacer(1, 12))

    # 3. Loan Principal & Estimated Capacity
    loan_amount = getattr(application, "loan_amount", 0.0)
    loan_term = getattr(application, "loan_term", 1)
    eligible_str = _format_inr(eligible_amount)
    if eligible_amount:
        eligible_str += f" ({_format_lakhs_crores(eligible_amount)})"
    else:
        eligible_str = "Unavailable"

    capacity_data = [
        [
            Paragraph("<b>Requested Loan Principal:</b>", cell_label_style),
            Paragraph(f"{_format_inr(loan_amount)} ({loan_term} Years Tenure)", cell_value_style),
            Paragraph("<b>Estimated Max Potential Loan:</b>", cell_label_style),
            Paragraph(eligible_str, cell_value_style),
        ],
    ]
    capacity_table = Table(capacity_data, colWidths=[135, 135, 135, 135])
    capacity_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), cream_bg),
                ("BOX", (0, 0), (-1, -1), 0.5, border_color),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    elements.append(capacity_table)
    elements.append(Spacer(1, 10))

    # 4. Derived Financial Indicators
    elements.append(Paragraph("Derived Financial Indicators", section_header))
    monthly_inc = getattr(prediction, "monthly_income", 0.0)
    est_emi = getattr(prediction, "estimated_principal_monthly_payment", 0.0)
    dti = getattr(prediction, "estimated_payment_to_income_ratio", 0.0)
    total_assets = getattr(prediction, "total_asset_value", 0.0)
    asset_to_loan = getattr(prediction, "asset_to_loan_ratio", 0.0)
    loan_to_inc = getattr(prediction, "loan_to_annual_income_ratio", 0.0)

    indicators_data = [
        [
            Paragraph("<b>Monthly Income:</b>", cell_label_style),
            Paragraph(_format_inr(monthly_inc), cell_value_style),
            Paragraph("<b>Est. Monthly EMI:</b>", cell_label_style),
            Paragraph(_format_inr(est_emi), cell_value_style),
            Paragraph("<b>Payment / Income:</b>", cell_label_style),
            Paragraph(f"{dti * 100:.1f}%", cell_value_style),
        ],
        [
            Paragraph("<b>Total Assets:</b>", cell_label_style),
            Paragraph(_format_inr(total_assets), cell_value_style),
            Paragraph("<b>Asset / Loan:</b>", cell_label_style),
            Paragraph(f"{asset_to_loan:.2f}x", cell_value_style),
            Paragraph("<b>Loan / Annual Income:</b>", cell_label_style),
            Paragraph(f"{loan_to_inc:.2f}x", cell_value_style),
        ],
    ]
    indicators_table = Table(indicators_data, colWidths=[90, 90, 90, 90, 90, 90])
    indicators_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FFFFFF")),
                ("GRID", (0, 0), (-1, -1), 0.5, border_color),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    elements.append(indicators_table)
    elements.append(Spacer(1, 10))

    # 5. Factor Attribution (Positive Catalysts & Risk Signals)
    explanations = getattr(prediction, "explanations", []) or []
    pos_items = [e for e in explanations if getattr(e, "impact", None) == "POSITIVE"]
    neg_items = [e for e in explanations if getattr(e, "impact", None) == "NEGATIVE"]

    pos_text = "<br/>".join(
        [f"• <b>{getattr(e, 'display_name', '')}:</b> {getattr(e, 'explanation_text', '')}" for e in pos_items[:3]]
    ) or "No critical positive factors identified above benchmark."
    
    neg_text = "<br/>".join(
        [f"• <b>{getattr(e, 'display_name', '')}:</b> {getattr(e, 'explanation_text', '')}" for e in neg_items[:3]]
    ) or "No critical risk factors detected."

    factors_data = [
        [
            Paragraph("<b>Key Positive Catalysts</b>", cell_label_style),
            Paragraph("<b>Key Risk Signals</b>", cell_label_style),
        ],
        [
            Paragraph(pos_text, cell_value_style),
            Paragraph(neg_text, cell_value_style),
        ],
    ]
    factors_table = Table(factors_data, colWidths=[270, 270])
    factors_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), cream_bg),
                ("GRID", (0, 0), (-1, -1), 0.5, border_color),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    elements.append(Paragraph("Factor Contribution Analysis", section_header))
    elements.append(factors_table)
    elements.append(Spacer(1, 10))

    # 6. Submitted 11-Parameter Recap
    elements.append(Paragraph("Submitted 11-Parameter Recap", section_header))
    params_data = [
        [
            Paragraph("<b>Applicant Name:</b>", cell_label_style),
            Paragraph(str(getattr(application, "applicant_name", "N/A")), cell_value_style),
            Paragraph("<b>CIBIL Score:</b>", cell_label_style),
            Paragraph(str(getattr(application, "cibil_score", "N/A")), cell_value_style),
            Paragraph("<b>Dependents:</b>", cell_label_style),
            Paragraph(str(getattr(application, "no_of_dependents", 0)), cell_value_style),
        ],
        [
            Paragraph("<b>Education:</b>", cell_label_style),
            Paragraph(str(getattr(application, "education", "N/A")), cell_value_style),
            Paragraph("<b>Self Employed:</b>", cell_label_style),
            Paragraph(str(getattr(application, "self_employed", "N/A")), cell_value_style),
            Paragraph("<b>Annual Income:</b>", cell_label_style),
            Paragraph(_format_inr(getattr(application, "income_annum", 0.0)), cell_value_style),
        ],
        [
            Paragraph("<b>Residential Assets:</b>", cell_label_style),
            Paragraph(_format_inr(getattr(application, "residential_assets_value", 0.0)), cell_value_style),
            Paragraph("<b>Commercial Assets:</b>", cell_label_style),
            Paragraph(_format_inr(getattr(application, "commercial_assets_value", 0.0)), cell_value_style),
            Paragraph("<b>Luxury Assets:</b>", cell_label_style),
            Paragraph(_format_inr(getattr(application, "luxury_assets_value", 0.0)), cell_value_style),
        ],
        [
            Paragraph("<b>Bank Liquid Assets:</b>", cell_label_style),
            Paragraph(_format_inr(getattr(application, "bank_asset_value", 0.0)), cell_value_style),
            Paragraph("<b>Requested Loan:</b>", cell_label_style),
            Paragraph(_format_inr(loan_amount), cell_value_style),
            Paragraph("<b>Loan Term:</b>", cell_label_style),
            Paragraph(f"{loan_term} Years", cell_value_style),
        ],
    ]
    params_table = Table(params_data, colWidths=[90, 90, 90, 90, 90, 90])
    params_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FFFFFF")),
                ("GRID", (0, 0), (-1, -1), 0.5, border_color),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    elements.append(params_table)
    elements.append(Spacer(1, 12))

    # 7. Responsible Assessment Disclaimer
    disclaimer_box = [
        [
            Paragraph(
                "<b>Responsible Assessment Notice:</b> This prediction is generated using historical data patterns "
                "from the certified Kaggle INR dataset. It provides an advisory assessment for credit analysis "
                "and does not constitute a guaranteed bank sanction or loan disbursement decision.",
                disclaimer_style,
            )
        ]
    ]
    disclaimer_table = Table(disclaimer_box, colWidths=[540])
    disclaimer_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FEF3C7")),
                ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#FDE68A")),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    elements.append(KeepTogether(disclaimer_table))

    # Build document
    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes

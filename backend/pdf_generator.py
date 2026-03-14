from reportlab.lib.pagesizes import LETTER
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem
from datetime import datetime
import os

def generate_pdf(data: dict, output_path: str):
    doc = SimpleDocTemplate(output_path, pagesize=LETTER, 
                            rightMargin=50, leftMargin=50, 
                            topMargin=50, bottomMargin=50)
    styles = getSampleStyleSheet()
    
    # Custom styles to match the screenshots
    styles.add(ParagraphStyle(
        name='HeaderInfo',
        parent=styles['Normal'],
        alignment=2, # Right align
        fontSize=11,
        leading=14,
        fontName='Helvetica-Bold'
    ))
    
    styles.add(ParagraphStyle(
        name='DateStyle',
        parent=styles['Normal'],
        alignment=2, # Right align
        fontSize=11,
        leading=20,
        fontName='Helvetica-Oblique'
    ))
    
    styles.add(ParagraphStyle(
        name='SubjectLine',
        parent=styles['Normal'],
        alignment=1, # Center align
        fontSize=12,
        leading=18,
        fontName='Helvetica-Bold',
        underline=True,
        spaceBefore=20,
        spaceAfter=20
    ))

    styles.add(ParagraphStyle(
        name='SectionTitle',
        parent=styles['Normal'],
        fontSize=11,
        leading=14,
        fontName='Helvetica-Bold',
        spaceBefore=10
    ))

    elements = []
    
    # 1. Header (Top Right)
    elements.append(Paragraph(f"<b>{data.get('name', '[Your Name]')}</b>", styles['HeaderInfo']))
    elements.append(Paragraph(f"[{data.get('phone', '[Your Phone Number]')}]", styles['HeaderInfo']))
    elements.append(Paragraph(f"[{data.get('email', '[Your Email Address]')}]", styles['HeaderInfo']))
    elements.append(Paragraph(f"[{data.get('address', '[Your Address]')}]", styles['HeaderInfo']))
    
    # 2. Date
    today = datetime.now().strftime("%B %d, %Y")
    elements.append(Spacer(1, 10))
    elements.append(Paragraph(f"<b>[{today}]</b>", styles['DateStyle']))
    
    # 3. Recipient Info (Top Left)
    elements.append(Spacer(1, 20))
    elements.append(Paragraph(f"<b>[Recipient's Name]</b>", styles['Normal']))
    elements.append(Paragraph("[Recipient's Title or Position], [Recipient's Organization]", styles['Normal']))
    elements.append(Paragraph("[Address] [City, State, ZIP Code]", styles['Normal']))
    
    # 4. Subject
    elements.append(Paragraph("<u>Subject: Cyber Crime Complaint</u>", styles['SubjectLine']))
    
    # 5. Salutation
    elements.append(Paragraph("Dear [Recipient's Name],", styles['Normal']))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph("[Salutation]: Begin the letter with a professional salutation addressing the recipient by name or title.", styles['Normal']))
    elements.append(Spacer(1, 12))

    # 6. Introduction
    elements.append(Paragraph("[Introduction]:", styles['SectionTitle']))
    elements.append(Paragraph(
        f"I am writing to formally complain about a cybercrime incident that occurred on {data.get('incident_date')} involving "
        f"[{data.get('crime_type')}]. This letter serves as an official notification of the incident and a request for investigation and appropriate action.",
        styles['Normal']
    ))
    elements.append(Spacer(1, 12))
    
    # 7. Body
    elements.append(Paragraph("[Body]:", styles['SectionTitle']))
    
    # Point 1: Incident Description
    elements.append(Paragraph("<b>1. Clear and concise description of the incident:</b> Provide a detailed account of the cyber crime incident, including:", styles['Normal']))
    
    p1_items = [
        ListItem(Paragraph(f"Date, time, and location of the incident: {data.get('incident_date')}", styles['Normal'])),
        ListItem(Paragraph(f"Nature of the cyber crime (e.g., hacking, phishing, identity theft): {data.get('crime_type')}", styles['Normal'])),
        ListItem(Paragraph(f"How the incident occurred: {data.get('description')}", styles['Normal'])),
        ListItem(Paragraph(f"Transaction ID (if applicable): {data.get('transaction_id', 'N/A')}", styles['Normal'])),
    ]
    elements.append(ListFlowable(p1_items, bulletType='bullet', leftIndent=20))
    elements.append(Spacer(1, 12))
    
    # Point 2: Evidence
    elements.append(Paragraph("<b>2. Documentation of evidence and supporting information:</b> Attach any relevant evidence or documentation to support your complaint, such as:", styles['Normal']))
    
    p2_items = [
        ListItem(Paragraph("Screenshots of suspicious emails or websites", styles['Normal'])),
        ListItem(Paragraph("Transaction records", styles['Normal'])),
        ListItem(Paragraph("Log files.", styles['Normal'])),
        ListItem(Paragraph("Forensic analysis reports", styles['Normal'])),
    ]
    elements.append(ListFlowable(p2_items, bulletType='bullet', leftIndent=20))
    elements.append(Spacer(1, 12))

    # Point 3: Parties involved
    elements.append(Paragraph("<b>3. Identification of the parties involved:</b> Identify yourself or your organization as the complainant(s).", styles['Normal']))
    
    p3_items = [
        ListItem(Paragraph(f"Name: {data.get('name')}", styles['Normal'])),
        ListItem(Paragraph(f"Contact Information: {data.get('phone')}, {data.get('email')}", styles['Normal'])),
        ListItem(Paragraph(f"Suspect Info: {data.get('suspect_info', 'Unknown')}", styles['Normal'])),
    ]
    elements.append(ListFlowable(p3_items, bulletType='bullet', leftIndent=20))
    elements.append(Spacer(1, 20))
    
    # 8. Conclusion
    elements.append(Paragraph("[Conclusion]:", styles['SectionTitle']))
    elements.append(Paragraph(
        "In light of the seriousness of the cyber crime incident and its impact on [Your Name or Your Organization], I respectfully request that [Recipient's Name or Organization] initiate an investigation into the matter and take appropriate action against the perpetrators. I am available to provide any further information or assistance required for the investigation.",
        styles['Normal']
    ))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph("Thank you for your attention to this matter. I look forward to your prompt response and resolution of the issue.", styles['Normal']))
    elements.append(Spacer(1, 40))
    
    # 9. Closure
    elements.append(Paragraph("Sincerely,", styles['Normal']))
    elements.append(Spacer(1, 20))
    elements.append(Paragraph(f"{data.get('name', '[Your Name]')}", styles['Normal']))
    elements.append(Paragraph("[Your Signature]", styles['Normal']))
    elements.append(Spacer(1, 40))
    
    # 10. Footer
    elements.append(Paragraph("[Enclosures: List any documents or evidence attached to the letter]", styles['Normal']))
    elements.append(Paragraph("[CC: List any additional recipients copied on the letter, if applicable]", styles['Normal']))

    doc.build(elements)

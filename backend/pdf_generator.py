from reportlab.lib.pagesizes import LETTER
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, HRFlowable
from datetime import datetime
import os
import requests
from io import BytesIO

def generate_pdf(data: dict, output_path: str):
    doc = SimpleDocTemplate(output_path, pagesize=LETTER, 
                            rightMargin=50, leftMargin=50, 
                            topMargin=50, bottomMargin=50)
    styles = getSampleStyleSheet()
    
    # Professional Style Palette
    PRIMARY_COLOR = colors.HexColor("#1A237E") # Dark Blue
    SECONDARY_COLOR = colors.HexColor("#424242") # Dark Grey
    
    # Custom styles
    styles.add(ParagraphStyle(
        name='MainTitle',
        parent=styles['Heading1'],
        fontSize=22,
        textColor=PRIMARY_COLOR,
        alignment=1, # Center
        spaceAfter=20,
        fontName='Helvetica-Bold'
    ))

    styles.add(ParagraphStyle(
        name='LetterHeader',
        parent=styles['Normal'],
        alignment=2, # Right
        fontSize=10,
        leading=12,
        textColor=SECONDARY_COLOR,
        fontName='Helvetica'
    ))
    
    styles.add(ParagraphStyle(
        name='RecipientHeader',
        parent=styles['Normal'],
        alignment=0, # Left
        fontSize=10,
        leading=12,
        fontName='Helvetica-Bold',
        spaceAfter=12
    ))

    styles.add(ParagraphStyle(
        name='SubjectTitle',
        parent=styles['Normal'],
        alignment=0,
        fontSize=12,
        leading=14,
        fontName='Helvetica-Bold',
        textTransform='uppercase',
        spaceBefore=15,
        spaceAfter=15,
        borderPadding=5,
        backColor=colors.HexColor("#F5F5F5")
    ))

    styles.add(ParagraphStyle(
        name='SectionHeader',
        parent=styles['Normal'],
        fontSize=12,
        leading=14,
        fontName='Helvetica-Bold',
        textColor=PRIMARY_COLOR,
        spaceBefore=12,
        spaceAfter=6,
        underlineWidth=1
    ))
    
    styles.add(ParagraphStyle(
        name='BodyTextJP',
        parent=styles['Normal'],
        fontSize=11,
        leading=15,
        fontName='Helvetica',
        alignment=4, # Justified
        firstLineIndent=20
    ))

    styles.add(ParagraphStyle(
        name='BulletPoint',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        leftIndent=25,
        bulletIndent=10,
        spaceBefore=2,
        spaceAfter=2
    ))

    elements = []
    
    # --- 1. HEADER & LOGO ALIGNMENT ---
    elements.append(Paragraph("CYBERCRIME INCIDENT REPORT", styles['MainTitle']))
    
    # User Info (Top Right)
    name = data.get('complainantName') or data.get('name', '[Name Not Provided]')
    phone = data.get('complainantPhone') or data.get('phone', '[Phone Number Not Provided]')
    email = data.get('complainantEmail') or data.get('email', '[Email Not Provided]')
    address_parts = [
        data.get('complainantAddress'),
        data.get('complainantCity'),
        data.get('complainantState'),
        data.get('complainantZip')
    ]
    address = ", ".join([p for p in address_parts if p]) or data.get('address', '[Address Not Provided]')
    
    elements.append(Paragraph(f"<b>From:</b> {name}", styles['LetterHeader']))
    elements.append(Paragraph(f"<b>Contact:</b> {phone} | {email}", styles['LetterHeader']))
    elements.append(Paragraph(f"<b>Address:</b> {address}", styles['LetterHeader']))
    
    today = datetime.now().strftime("%B %d, %Y")
    elements.append(Paragraph(f"<b>Date:</b> {today}", styles['LetterHeader']))
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=1, color=PRIMARY_COLOR, spaceBefore=5, spaceAfter=20))
    
    # --- 2. RECIPIENT ---
    elements.append(Paragraph("<b>TO:</b>", styles['RecipientHeader']))
    elements.append(Paragraph("Officer-in-Charge / Superintendent of Police", styles['Normal']))
    elements.append(Paragraph("Cyber Crime Cell", styles['Normal']))
    elements.append(Paragraph("Police Department", styles['Normal']))
    elements.append(Spacer(1, 15))
    
    # --- 3. SUBJECT ---
    crime_type = data.get('crimeType') or data.get('crime_type', 'Cybercrime Incident')
    elements.append(Paragraph(f"SUBJECT: FORMAL COMPLAINT REGARDING {crime_type.upper()}", styles['SubjectTitle']))
    
    # --- 4. SALUTATION ---
    elements.append(Paragraph("Respected Sir/Madam,", styles['Normal']))
    elements.append(Spacer(1, 12))
    
    # --- 5. INTRODUCTION ---
    incident_date = data.get('incidentDate') or data.get('incident_date', '[Incident Date]')
    intro_txt = f"I am writing to formally report a cybercrime incident that occurred on or about <b>{incident_date}</b>. I am a victim of <b>{crime_type}</b> and request your immediate intervention and investigation into this matter."
    elements.append(Paragraph(intro_txt, styles['BodyTextJP']))
    elements.append(Spacer(1, 15))
    
    # --- 6. INCIDENT DESCRIPTION ---
    elements.append(Paragraph("Incident Description", styles['SectionHeader']))
    description = data.get('incidentDescription') or data.get('description', 'No detailed description provided.')
    elements.append(Paragraph(description, styles['BodyTextJP']))
    elements.append(Spacer(1, 12))
    
    # --- 7. FORENSIC EVIDENCE ANALYSIS ---
    if data.get('ocr_text') or data.get('incident_overview'):
        elements.append(Paragraph("Forensic Evidence Analysis (AI-Generated)", styles['SectionHeader']))
        
        # Overview
        overview = data.get('incident_overview') or "See incident description for details."
        elements.append(Paragraph(f"<b>Analytical Summary:</b> {overview}", styles['BodyTextJP']))
        elements.append(Spacer(1, 10))
        
        # Analysis Table
        analysis_data = [
            ["Attribute", "Information Extracted"],
            ["Detected Crime", crime_type],
            ["Methods Used", data.get('methods_used') or data.get('methodUsed') or "N/A"],
            ["Indicators Found", ", ".join(data.get('indicators_list', [])) or "None identified"],
            ["Potential Impact", data.get('impact') or "N/A"]
        ]
        
        analysis_table = Table(analysis_data, colWidths=[120, 350])
        analysis_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_COLOR),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
        ]))
        elements.append(analysis_table)
        elements.append(Spacer(1, 15))

        # URL Assessment
        url_threats = data.get('url_threats') or []
        if url_threats:
            elements.append(Paragraph("URL Threat Assessment:", styles['Normal']))
            for ut in url_threats:
                elements.append(Paragraph(f"• <b>URL:</b> {ut['url']} (Risk Level: {ut['risk_level']})", styles['BulletPoint']))
            elements.append(Spacer(1, 10))

        # Timeline
        timeline = data.get('timeline') or []
        if timeline:
            elements.append(Paragraph("Reconstructed Evidence Timeline:", styles['Normal']))
            for event in timeline:
                elements.append(Paragraph(event, styles['BulletPoint']))
            elements.append(Spacer(1, 15))

    # --- 8. SUSPECT / ACCUSED ---
    elements.append(Paragraph("Accused Information", styles['SectionHeader']))
    accused_name = data.get('accusedName') or "To be determined through investigation."
    accused_contact = data.get('accusedContact') or "To be determined."
    elements.append(Paragraph(f"<b>Name/Handle:</b> {accused_name}", styles['Normal']))
    elements.append(Paragraph(f"<b>Contact Information:</b> {accused_contact}", styles['Normal']))
    elements.append(Spacer(1, 15))
    
    # --- 9. CONCLUSION (Before Attachments) ---
    elements.append(Paragraph("Conclusion", styles['SectionHeader']))
    conclusion_text = (
        "In light of the evidence provided, I earnestly request your office to investigate "
        "this matter and initiate necessary legal proceedings against the perpetrators. "
        "I am available to provide any further assistance or statements required for the investigation."
    )
    elements.append(Paragraph(conclusion_text, styles['BodyTextJP']))
    elements.append(Spacer(1, 25))
    
    # --- 10. CLOSING & SIGNATURE ---
    elements.append(Paragraph("Yours Respectfully,", styles['Normal']))
    elements.append(Spacer(1, 30))
    elements.append(Paragraph(f"__________________________", styles['Normal']))
    elements.append(Paragraph(f"<b>(Signature)</b>", styles['Normal']))
    elements.append(Paragraph(f"<b>{name}</b>", styles['Normal']))
    elements.append(Spacer(1, 40))
    
    # --- 11. ENCLOSURES / ATTACHMENTS ---
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.grey, spaceBefore=20, spaceAfter=20))
    elements.append(Paragraph("LIST OF ENCLOSURES", styles['SectionHeader']))
    elements.append(Paragraph("1. Digital Screenshot Evidence (attached below)", styles['BulletPoint']))
    elements.append(Paragraph("2. Narrative forensic analysis report logs", styles['BulletPoint']))
    
    # --- 12. EMBEDDED IMAGE ---
    if data.get('evidence_url'):
        try:
            response = requests.get(data['evidence_url'])
            if response.status_code == 200:
                img_data = BytesIO(response.content)
                img = Image(img_data)
                
                # Proportional scaling
                orig_w, orig_h = img.drawWidth, img.drawHeight
                max_w = 460
                scale = max_w / float(orig_w)
                img.drawWidth = max_w
                img.drawHeight = orig_h * scale
                
                img.hAlign = 'CENTER'
                elements.append(Spacer(1, 30))
                elements.append(Paragraph("<b>Attachment 1: Evidence Screenshot</b>", styles['Normal']))
                elements.append(Spacer(1, 15))
                elements.append(img)
        except Exception as e:
            print(f"Error embedding image: {e}")

    # OCR Log Section at end
    if data.get('ocr_text'):
        elements.append(Spacer(1, 30))
        elements.append(Paragraph("<b>Attachment 2: Extracted Data Logs</b>", styles['Normal']))
        elements.append(Spacer(1, 5))
        # Use Monospace for logs
        elements.append(Paragraph(f"<font size='8' face='Courier'>{data['ocr_text']}</font>", styles['Normal']))

    doc.build(elements)

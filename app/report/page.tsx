"use client"

import React, { useState } from "react"
import { FileText, Upload, X, AlertCircle, CheckCircle2, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { generateComplaintPDF } from "@/lib/generate-pdf"

const crimeTypes = [
  "Hacking",
  "Phishing",
  "Identity Theft",
  "Online Fraud",
  "Financial Scam",
  "Digital Harassment",
  "Data Breach",
  "Ransomware Attack",
  "Social Engineering",
  "Other",
]

interface ComplaintForm {
  // Complainant Information
  complainantName: string
  complainantPhone: string
  complainantEmail: string
  complainantAddress: string
  complainantCity: string
  complainantState: string
  complainantZip: string
  
  // Recipient Information
  recipientName: string
  recipientTitle: string
  recipientOrganization: string
  recipientAddress: string
  recipientCity: string
  recipientState: string
  recipientZip: string
  
  // Incident Details
  incidentDate: string
  incidentTime: string
  incidentLocation: string
  crimeType: string
  incidentDescription: string
  methodUsed: string
  impact: string
  
  // Accused Information
  accusedName: string
  accusedContact: string
  accusedDetails: string
  
  // Evidence (Optional)
  evidenceDescription?: string
  
  // AI Analysis Fields
  ocr_text?: string
  detected_urls?: string
  detected_contacts?: string
  evidence_image_url?: string
  auto_generated_description?: string
  
  // New Extended Analysis Fields
  incident_overview?: string
  methods_used?: string
  indicators_list?: string[]
  evidence_observed?: string[]
  timeline?: string[]
  url_threats?: {
    url: string
    risk_level: string
    category: string
  }[]
}

interface SubmissionResult {
  complaintId: string
  crimeType: string
  date: string
  formData: ComplaintForm
}

interface AnalysisResult {
  crime_type: string
  description: string
  incident_overview: string
  methods_used: string
  indicators_list: string[]
  impact: string
  recommended_action: string
  evidence_observed: string[]
  timeline: string[]
  url_threats: {
    url: string
    risk_level: string
    category: string
  }[]
  suspect_contact: string
  image_url: string
  ocr_text: string
  indicators: {
    urls: string[]
    phones: string[]
    emails: string[]
    upi_ids: string[]
    transaction_ids: string[]
    otp_codes: string[]
  }
}

export default function ReportPage() {
  const [formData, setFormData] = useState<ComplaintForm>({
    complainantName: "",
    complainantPhone: "",
    complainantEmail: "",
    complainantAddress: "",
    complainantCity: "",
    complainantState: "",
    complainantZip: "",
    recipientName: "",
    recipientTitle: "",
    recipientOrganization: "",
    recipientAddress: "",
    recipientCity: "",
    recipientState: "",
    recipientZip: "",
    incidentDate: "",
    incidentTime: "",
    incidentLocation: "",
    crimeType: "",
    incidentDescription: "",
    methodUsed: "",
    impact: "",
    accusedName: "",
    accusedContact: "",
    accusedDetails: "",
    ocr_text: "",
    detected_urls: "",
    detected_contacts: "",
    evidence_image_url: "",
    auto_generated_description: "",
    incident_overview: "",
    methods_used: "",
    indicators_list: [],
    evidence_observed: [],
    timeline: [],
    url_threats: [],
  })
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null)
  const [backendPdfUrl, setBackendPdfUrl] = useState<string | null>(null)
  
  // AI Analysis States
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [aiFilledFields, setAiFilledFields] = useState<Set<string>>(new Set())

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev: ComplaintForm) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length > 0) {
      const newFiles = [...files, ...selectedFiles]
      setFiles(newFiles)
      
      selectedFiles.forEach((file) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPreviews((prev) => [...prev, reader.result as string])
        }
        reader.readAsDataURL(file)
        
        // Trigger AI Analysis for the first uploaded image
        if (file.type.startsWith("image/")) {
          handleAnalysis(file)
        }
      })
    }
  }

  const handleAnalysis = async (file: File) => {
    setIsAnalyzing(true)
    const formDataUpload = new FormData()
    formDataUpload.append("file", file)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/upload-image`, {
        method: "POST",
        body: formDataUpload,
      })

      if (!response.ok) throw new Error("Analysis failed")

      const data: AnalysisResult = await response.json()
      setAnalysisResult(data)

      // Auto-fill form fields
      const filled = new Set<string>()
      
      setFormData((prev: ComplaintForm) => {
        const updated = { ...prev }
        
        if (data.crime_type && data.crime_type !== "Cybercrime" && data.crime_type !== "Data Format Error") {
          // Normalize crime type to match our predefined list or default to "Other"
          const normalizedCrimeType = crimeTypes.includes(data.crime_type) 
            ? data.crime_type 
            : (crimeTypes.find(t => data.crime_type.toLowerCase().includes(t.toLowerCase())) || "Other");
          
          updated.crimeType = normalizedCrimeType
          filled.add("crimeType")
        }
        
        if (data.incident_overview) {
          updated.incidentDescription = data.incident_overview
          filled.add("incidentDescription")
        }
        
        if (data.methods_used) {
          updated.methodUsed = data.methods_used
          filled.add("methodUsed")
        }

        if (data.impact) {
          updated.impact = data.impact
          filled.add("impact")
        }
        
        if (data.suspect_contact && data.suspect_contact !== "Unknown") {
          updated.accusedContact = data.suspect_contact
          filled.add("accusedContact")
        }

        if (data.ocr_text) {
          updated.ocr_text = data.ocr_text
          if (data.indicators?.urls) {
            updated.detected_urls = data.indicators.urls.join(", ")
          }
          updated.detected_contacts = data.suspect_contact || ""
          filled.add("ocr_text")
        }

        // Fill new forensic fields with safe fallbacks
        updated.incident_overview = data.incident_overview || ""
        updated.methods_used = data.methods_used || ""
        updated.indicators_list = data.indicators_list || []
        updated.evidence_observed = data.evidence_observed || []
        updated.timeline = data.timeline || []
        updated.url_threats = (data as any).url_threats || []

        if (data.image_url) {
          updated.evidence_image_url = data.image_url
        }

        if (data.description) {
          updated.auto_generated_description = data.description
        }
        
        return updated
      })

      setAiFilledFields(filled)
    } catch (error) {
      console.error("Analysis error:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev: File[]) => prev.filter((_, i) => i !== index))
    setPreviews((prev: string[]) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus("idle")
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/submit-complaint`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to submit complaint");
      }

      const data = await response.json();
      
      setSubmissionResult({
        complaintId: data.complaint_id,
        crimeType: formData.crimeType,
        date: new Date().toISOString().split("T")[0],
        formData,
      })
      
      // Store the backend PDF URL if available
      if (data.pdf_url) {
        setBackendPdfUrl(data.pdf_url);
      }
      
      setSubmitStatus("success")
    } catch (error) {
      console.error("Submission Error:", error);
      setSubmitStatus("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!submissionResult) return
    
    // If backend provided a PDF URL, use it
    if (backendPdfUrl) {
      window.open(backendPdfUrl, "_blank", "noopener,noreferrer")
      return
    }

    setIsDownloading(true)
    
    try {
      await generateComplaintPDF(submissionResult.formData, submissionResult.complaintId)
    } catch (error) {
      console.error("Error generating PDF:", error)
    }
    
    setIsDownloading(false)
  }

  const handleReset = () => {
    setFormData({
      complainantName: "",
      complainantPhone: "",
      complainantEmail: "",
      complainantAddress: "",
      complainantCity: "",
      complainantState: "",
      complainantZip: "",
      recipientName: "",
      recipientTitle: "",
      recipientOrganization: "",
      recipientAddress: "",
      recipientCity: "",
      recipientState: "",
      recipientZip: "",
      incidentDate: "",
      incidentTime: "",
      incidentLocation: "",
      crimeType: "",
      incidentDescription: "",
      methodUsed: "",
      impact: "",
      accusedName: "",
      accusedContact: "",
      accusedDetails: "",
      ocr_text: "",
      detected_urls: "",
      detected_contacts: "",
      evidence_image_url: "",
      auto_generated_description: "",
      incident_overview: "",
      methods_used: "",
      indicators_list: [],
      evidence_observed: [],
      timeline: [],
      url_threats: [],
    })
    setFiles([])
    setPreviews([])
    setSubmitStatus("idle")
    setSubmissionResult(null)
    setAnalysisResult(null)
    setAiFilledFields(new Set())
  }

  if (submitStatus === "success" && submissionResult) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <Card className="border-accent/50 bg-accent/5">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
                <CheckCircle2 className="h-8 w-8 text-accent" />
              </div>
              <CardTitle className="text-2xl text-accent">Complaint Submitted Successfully</CardTitle>
              <CardDescription className="text-base">
                Your complaint report has been generated. Download the official complaint letter below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Complaint ID</p>
                    <p className="font-semibold text-primary">{submissionResult.complaintId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Crime Type</p>
                    <p className="font-semibold">{submissionResult.crimeType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-semibold">{new Date(submissionResult.date).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="w-full"
                size="lg"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-5 w-5" />
                    Download Complaint Report
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleReset}
                className="w-full"
              >
                Submit Another Complaint
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <h1 className="mb-2 text-3xl font-bold text-foreground">Report a Cybercrime Complaint</h1>
          <p className="text-muted-foreground">
            Fill out the form below to submit your official cybercrime complaint letter.
          </p>
        </div>

        {submitStatus === "error" && (
          <Alert className="mb-6 border-destructive bg-destructive/10">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertTitle className="text-destructive">Error</AlertTitle>
            <AlertDescription className="text-destructive/80">
              There was an error submitting your complaint. Please try again.
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Cyber Crime Complaint Letter</CardTitle>
            <CardDescription>
              This form follows the official cyber crime complaint letter format.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* AI Analysis Panel */}
            {isAnalyzing && (
              <div className="mb-8 rounded-lg border border-accent/30 bg-accent/5 p-6 text-center">
                <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-accent" />
                <h3 className="mb-2 text-lg font-semibold text-accent">AI Evidence Analysis in Progress...</h3>
                <p className="text-sm text-muted-foreground">
                  Our AI is extracting text, detecting crime patterns, and analyzing technical threats.
                </p>
              </div>
            )}

            {analysisResult && !isAnalyzing && (
              <div className="mb-8 space-y-6 rounded-lg border border-accent/20 bg-accent/5 p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-accent">Evidence Analysis Report</h3>
                  <Badge variant="outline" className="border-accent text-accent">AI Generated</Badge>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-accent">Cybercrime Category</Label>
                      <p className="text-lg font-semibold">{analysisResult.crime_type}</p>
                    </div>
                    <div>
                      <Label className="text-accent">Incident Overview</Label>
                      <p className="text-sm leading-relaxed">{analysisResult.incident_overview}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-accent">Methods Used</Label>
                      <p className="text-sm">{analysisResult.methods_used}</p>
                    </div>
                    <div>
                      <Label className="text-accent">Detected Indicators</Label>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {Array.isArray(analysisResult?.indicators_list) && analysisResult.indicators_list.map((ind, i) => (
                          <Badge key={i} variant="secondary" className="bg-accent/10 font-normal">
                            {ind}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="bg-accent/10" />

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h4 className="mb-3 font-semibold text-accent">Incident Timeline</h4>
                    <div className="space-y-3">
                      {Array.isArray(analysisResult?.timeline) && analysisResult.timeline.map((step, i) => (
                        <div key={i} className="flex gap-3 text-sm">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/20 text-[10px] font-bold text-accent">
                            {i + 1}
                          </span>
                          <p className="text-muted-foreground">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="mb-3 font-semibold text-accent">URL Threat Analysis</h4>
                    <div className="space-y-3">
                      {Array.isArray(analysisResult?.url_threats) && analysisResult.url_threats.map((ut, i) => (
                        <div key={i} className="rounded border border-border bg-card p-3 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="truncate font-mono font-medium max-w-[150px]">{ut?.url || "Unknown URL"}</span>
                            <Badge className={
                              ut?.risk_level === "High" ? "bg-destructive text-destructive-foreground" : 
                              ut?.risk_level === "Medium" ? "bg-orange-500 text-white" : "bg-green-500 text-white"
                            }>
                              {ut?.risk_level || "Unknown"} Risk
                            </Badge>
                          </div>
                          <p className="text-muted-foreground italic">{ut?.category || "Analyzing..."}</p>
                        </div>
                      ))}
                      {(!analysisResult?.url_threats || analysisResult.url_threats.length === 0) && (
                        <p className="text-xs text-muted-foreground italic">No suspicious URLs detected in evidence.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-md bg-accent/10 p-4 border border-accent/20">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-accent" />
                    <div>
                      <p className="text-sm font-medium text-accent">Auto-fill Complete</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        We've pre-filled the form with this analysis. Please review and edit the details before submitting.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">

              {/* Complainant Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">Your Information (Complainant)</h3>
                </div>
                <Separator />
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="complainantName">Full Name *</Label>
                    <Input
                      id="complainantName"
                      name="complainantName"
                      placeholder="Your full name"
                      value={formData.complainantName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="complainantPhone">Phone Number *</Label>
                    <Input
                      id="complainantPhone"
                      name="complainantPhone"
                      placeholder="Your phone number"
                      value={formData.complainantPhone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="complainantEmail">Email Address *</Label>
                  <Input
                    id="complainantEmail"
                    name="complainantEmail"
                    type="email"
                    placeholder="Your email address"
                    value={formData.complainantEmail}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="complainantAddress">Street Address *</Label>
                  <Input
                    id="complainantAddress"
                    name="complainantAddress"
                    placeholder="Your street address"
                    value={formData.complainantAddress}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="complainantCity">City *</Label>
                    <Input
                      id="complainantCity"
                      name="complainantCity"
                      placeholder="City"
                      value={formData.complainantCity}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="complainantState">State *</Label>
                    <Input
                      id="complainantState"
                      name="complainantState"
                      placeholder="State"
                      value={formData.complainantState}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="complainantZip">ZIP Code *</Label>
                    <Input
                      id="complainantZip"
                      name="complainantZip"
                      placeholder="ZIP Code"
                      value={formData.complainantZip}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Recipient Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">Recipient Information</h3>
                </div>
                <Separator />
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="recipientName">Recipient Name *</Label>
                    <Input
                      id="recipientName"
                      name="recipientName"
                      placeholder="e.g., Cyber Crime Cell"
                      value={formData.recipientName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recipientTitle">Title/Position</Label>
                    <Input
                      id="recipientTitle"
                      name="recipientTitle"
                      placeholder="e.g., Station House Officer"
                      value={formData.recipientTitle}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipientOrganization">Organization *</Label>
                  <Input
                    id="recipientOrganization"
                    name="recipientOrganization"
                    placeholder="e.g., Cyber Crime Police Station"
                    value={formData.recipientOrganization}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipientAddress">Street Address</Label>
                  <Input
                    id="recipientAddress"
                    name="recipientAddress"
                    placeholder="Recipient street address"
                    value={formData.recipientAddress}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="recipientCity">City</Label>
                    <Input
                      id="recipientCity"
                      name="recipientCity"
                      placeholder="City"
                      value={formData.recipientCity}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recipientState">State</Label>
                    <Input
                      id="recipientState"
                      name="recipientState"
                      placeholder="State"
                      value={formData.recipientState}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recipientZip">ZIP Code</Label>
                    <Input
                      id="recipientZip"
                      name="recipientZip"
                      placeholder="ZIP Code"
                      value={formData.recipientZip}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              {/* Incident Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">Incident Details</h3>
                </div>
                <Separator />
                
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="incidentDate">Date of Incident *</Label>
                    <Input
                      id="incidentDate"
                      name="incidentDate"
                      type="date"
                      value={formData.incidentDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="incidentTime">Time of Incident</Label>
                    <Input
                      id="incidentTime"
                      name="incidentTime"
                      type="time"
                      value={formData.incidentTime}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="incidentLocation">Location</Label>
                    <Input
                      id="incidentLocation"
                      name="incidentLocation"
                      placeholder="e.g., Online, Home"
                      value={formData.incidentLocation}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="crimeType">Nature of Cyber Crime *</Label>
                  <Select
                    value={formData.crimeType}
                    onValueChange={(value) =>
                      setFormData((prev: ComplaintForm) => ({ ...prev, crimeType: value }))
                    }
                    required
                  >
                    <SelectTrigger id="crimeType">
                      <SelectValue placeholder="Select crime type" />
                    </SelectTrigger>
                    <SelectContent>
                      {crimeTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="incidentDescription" className="flex items-center gap-2">
                    Description of Incident *
                    {aiFilledFields.has("incidentDescription") && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px] py-0">AI Filled</Badge>
                    )}
                  </Label>
                  <Textarea
                    id="incidentDescription"
                    name="incidentDescription"
                    placeholder="Provide a detailed account of the cyber crime incident..."
                    rows={5}
                    value={formData.incidentDescription}
                    onChange={(e) => {
                      handleInputChange(e)
                      setAiFilledFields(prev => {
                        const next = new Set(prev)
                        next.delete("incidentDescription")
                        return next
                      })
                    }}
                    required
                    className={aiFilledFields.has("incidentDescription") ? "border-primary/50 bg-primary/5" : ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="methodUsed">Methods Used by Perpetrators</Label>
                  <Textarea
                    id="methodUsed"
                    name="methodUsed"
                    placeholder="Describe how the incident occurred and the methods used..."
                    rows={3}
                    value={formData.methodUsed}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="impact">Impact and Consequences *</Label>
                  <Textarea
                    id="impact"
                    name="impact"
                    placeholder="Describe the impact (e.g., financial losses, data breaches, personal harm)..."
                    rows={3}
                    value={formData.impact}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              {/* Accused Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">Accused Party Information (If Known)</h3>
                </div>
                <Separator />
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="accusedName">Name</Label>
                    <Input
                      id="accusedName"
                      name="accusedName"
                      placeholder="Name of accused (if known)"
                      value={formData.accusedName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accusedContact">Contact Information</Label>
                    <Input
                      id="accusedContact"
                      name="accusedContact"
                      placeholder="Phone, email, or online handle"
                      value={formData.accusedContact}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accusedDetails">Additional Details</Label>
                  <Textarea
                    id="accusedDetails"
                    name="accusedDetails"
                    placeholder="Any other relevant details about the accused..."
                    rows={3}
                    value={formData.accusedDetails}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Evidence */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">Evidence and Documentation</h3>
                </div>
                <Separator />



                <div className="space-y-2">
                  <Label>Upload Evidence Files</Label>
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="evidence"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">Screenshots, PDFs, or other evidence files</p>
                      </div>
                      <input
                        id="evidence"
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx,.txt"
                        multiple
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>

                  {previews.length > 0 && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
                      {previews.map((preview, index) => (
                        <div key={index} className="relative">
                          {files[index]?.type.startsWith("image/") ? (
                            <img
                              src={preview}
                              alt={`Evidence ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border border-border"
                            />
                          ) : (
                            <div className="w-full h-32 flex items-center justify-center rounded-lg border border-border bg-secondary/30">
                              <FileText className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          <p className="mt-1 text-xs text-muted-foreground truncate">{files[index]?.name}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {isAnalyzing && (
                    <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20 animate-pulse">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm font-medium text-primary">AI is analyzing your evidence...</span>
                      </div>
                    </div>
                  )}

                  {analysisResult && !isAnalyzing && (
                    <Card className="mt-4 border-primary/20 bg-primary/5">
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          Evidence Analysis Complete
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="py-0 px-4 pb-4 space-y-3">
                        <div className="text-xs">
                          <p className="font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Detected Crime Type</p>
                          <Badge variant="outline" className="border-primary/30 text-primary">{analysisResult.crime_type}</Badge>
                        </div>
                        
                        {analysisResult?.indicators?.urls && analysisResult.indicators.urls.length > 0 && (
                          <div className="text-xs">
                            <p className="font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Detected Suspicious URLs</p>
                            <ul className="space-y-1">
                              {Array.isArray(analysisResult?.indicators?.urls) && analysisResult.indicators.urls.map((url: string, i: number) => (
                                <li key={i} className="text-destructive font-mono truncate">{url}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="text-xs">
                          <p className="font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Extracted Insights</p>
                          <p className="text-foreground leading-relaxed italic">"{analysisResult?.description?.split("\n\n")[0] || analysisResult?.incident_overview?.split("\n\n")[0] || "No summary available."}"</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Complaint"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={isSubmitting}
                >
                  Reset Form
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

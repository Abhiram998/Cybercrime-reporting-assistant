"use client"

import { useState } from "react"
import { FileText, Upload, X, AlertCircle, CheckCircle2 } from "lucide-react"
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

const crimeTypes = [
  "Online Fraud",
  "Phishing",
  "Account Hacking",
  "Digital Harassment",
  "Financial Scam",
]

export default function ReportPage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    crimeType: "",
    description: "",
    suspectInfo: "",
    transactionId: "",
    incident_date: new Date().toISOString().split('T')[0],
  })
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const removeFile = () => {
    setFile(null)
    setPreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/submit-complaint`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          crime_type: formData.crimeType,
          description: formData.description,
          suspect_info: formData.suspectInfo,
          transaction_id: formData.transactionId,
          incident_date: formData.incident_date,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit complaint");
      }

      const data = await response.json();
      setPdfUrl(data.pdf_download_url);
      setSubmitStatus("success")
      
      // Optionally reset form but keep PDF link
    } catch (error) {
      console.error("Submission Error:", error);
      setSubmitStatus("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
      crimeType: "",
      description: "",
      suspectInfo: "",
      transactionId: "",
      incident_date: new Date().toISOString().split('T')[0],
    })
    setFile(null)
    setPreview(null)
    setSubmitStatus("idle")
    setPdfUrl(null)
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <h1 className="mb-2 text-3xl font-bold text-foreground">Report a Complaint</h1>
          <p className="text-muted-foreground">
            Fill out the form below to submit your cybercrime complaint.
          </p>
        </div>

        {submitStatus === "success" && (
          <Alert className="mb-6 border-accent bg-accent/10">
            <CheckCircle2 className="h-4 w-4 text-accent" />
            <AlertTitle className="text-accent">Success!</AlertTitle>
            <AlertDescription className="text-accent/80">
              Your complaint has been submitted successfully. 
              {pdfUrl && (
                <div className="mt-4">
                  <Button asChild variant="outline" size="sm" className="bg-accent text-accent-foreground border-accent hover:bg-accent/80">
                    <a href={pdfUrl} download target="_blank" rel="noopener noreferrer">
                      Download Complaint PDF
                    </a>
                  </Button>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

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
            <CardTitle>Complaint Details</CardTitle>
            <CardDescription>
              Provide as much detail as possible to help us investigate your case.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="incident_date">Incident Date</Label>
                  <Input
                    id="incident_date"
                    name="incident_date"
                    type="date"
                    value={formData.incident_date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="Enter your address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="crimeType">Crime Type</Label>
                <Select
                  value={formData.crimeType}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, crimeType: value }))
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
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe the incident in detail..."
                  rows={5}
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="suspectInfo">Suspect Information (if known)</Label>
                <Input
                  id="suspectInfo"
                  name="suspectInfo"
                  placeholder="Any information about the suspect"
                  value={formData.suspectInfo}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transactionId">Transaction ID (if applicable)</Label>
                <Input
                  id="transactionId"
                  name="transactionId"
                  placeholder="Transaction or reference ID"
                  value={formData.transactionId}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label>Upload Evidence</Label>
                {!preview ? (
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
                        <p className="text-xs text-muted-foreground">PNG, JPG or GIF</p>
                      </div>
                      <input
                        id="evidence"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={preview}
                      alt="Evidence preview"
                      className="w-full h-48 object-cover rounded-lg border border-border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={removeFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <p className="mt-2 text-sm text-muted-foreground">{file?.name}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Complaint"}
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

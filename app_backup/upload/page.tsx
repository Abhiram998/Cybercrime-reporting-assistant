"use client"

import { useState, useCallback } from "react"
import { Upload, X, FileImage, Loader2, Copy, Check, ScanText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractedText, setExtractedText] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.type.startsWith("image/")) {
      processFile(droppedFile)
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      processFile(selectedFile)
    }
  }

  const processFile = (selectedFile: File) => {
    setFile(selectedFile)
    setExtractedText(null)
    
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(selectedFile)
  }

  const removeFile = () => {
    setFile(null)
    setPreview(null)
    setExtractedText(null)
  }

  const handleExtractText = async () => {
    if (!file) return;
    setIsExtracting(true)
    
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/upload-image`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to extract text");
      }

      const data = await response.json();
      setExtractedText(data.extracted_text);
    } catch (error) {
      console.error("OCR Error:", error);
      setExtractedText("Error extracting text from image. Please try again.");
    } finally {
      setIsExtracting(false)
    }
  }

  const copyToClipboard = async () => {
    if (extractedText) {
      await navigator.clipboard.writeText(extractedText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ScanText className="h-6 w-6 text-primary" />
          </div>
          <h1 className="mb-2 text-3xl font-bold text-foreground">Upload Evidence</h1>
          <p className="text-muted-foreground">
            Upload screenshot evidence and let our AI extract text for analysis.
          </p>
        </div>

        <Card className="border-border/50 mb-6">
          <CardHeader>
            <CardTitle>Evidence Upload</CardTitle>
            <CardDescription>
              Drag and drop or click to upload an image file.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!preview ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border bg-secondary/30 hover:bg-secondary/50 hover:border-primary/50"
                )}
              >
                <label htmlFor="evidence-upload" className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <p className="mb-2 text-lg font-medium text-foreground">
                      {isDragging ? "Drop your file here" : "Drag and drop your file"}
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supports PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                  <input
                    id="evidence-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative group">
                  <img
                    src={preview}
                    alt="Evidence preview"
                    className="w-full max-h-80 object-contain rounded-xl border border-border bg-muted/20"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-3 right-3 h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={removeFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileImage className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{file?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {file && (file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    onClick={handleExtractText}
                    disabled={isExtracting}
                    className="shrink-0"
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Extracting...
                      </>
                    ) : (
                      <>
                        <ScanText className="mr-2 h-4 w-4" />
                        Extract Text
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Extracted Text Result */}
        {extractedText && (
          <Card className="border-accent/30 bg-accent/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ScanText className="h-5 w-5 text-accent" />
                  Extracted Text
                </CardTitle>
                <CardDescription>
                  Text extracted from your uploaded evidence
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-background border border-border p-4">
                <pre className="whitespace-pre-wrap text-sm text-foreground font-mono leading-relaxed">
                  {extractedText}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

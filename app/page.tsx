import Link from "next/link"
import { Shield, FileText, Eye, Upload, Lock, Zap, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const features = [
  {
    icon: Lock,
    title: "Secure Reporting",
    description: "Your reports are encrypted and handled with the highest level of confidentiality.",
  },
  {
    icon: Zap,
    title: "AI-Powered Analysis",
    description: "Advanced AI helps extract information from uploaded evidence automatically.",
  },
  {
    icon: Users,
    title: "Expert Support",
    description: "Trained professionals review and process every complaint submitted.",
  },
]

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background py-20 md:py-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-primary" />
              <span>Secure Cybercrime Reporting Platform</span>
            </div>
            
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl text-balance">
              Cybercrime Reporting AI Assistant
            </h1>
            
            <p className="mb-10 text-lg text-muted-foreground leading-relaxed md:text-xl text-pretty">
              A secure platform to report cybercrime incidents and upload digital evidence. 
              Our AI-powered system helps streamline the reporting process and extract valuable 
              information from your evidence.
            </p>
            
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-8 text-base">
                <Link href="/report">
                  <FileText className="mr-2 h-5 w-5" />
                  Report Cybercrime
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border bg-card py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground">
              How We Help You Stay Safe
            </h2>
            <p className="text-muted-foreground">
              Our platform provides comprehensive tools to report and track cybercrime incidents.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="border-border/50 bg-background">
                <CardContent className="pt-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-background py-20">
        <div className="container mx-auto px-4">
          <Card className="mx-auto max-w-4xl border-primary/20 bg-primary/5">
            <CardContent className="flex flex-col items-center gap-6 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="mb-2 text-2xl font-bold text-foreground">Have Evidence to Submit?</h2>
                <p className="text-muted-foreground">
                  Upload screenshots and let our AI extract text and relevant information.
                </p>
              </div>
              <Button asChild size="lg">
                <Link href="/upload">
                  Upload Evidence
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}

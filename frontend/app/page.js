import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Code, FileUp, MessageSquare, BookOpen, Network, Calendar, FileCode } from "lucide-react"

export default function Home() {
  const features = [
    {
      icon: Code,
      title: "DSA Practice Questions",
      description: "Practice Data Structures & Algorithms with curated questions by difficulty and topic.",
      href: "/dsa-practice",
    },
    {
      icon: FileUp,
      title: "Document Upload",
      description: "Upload study materials in PDF, DOCX, or TXT format for AI processing.",
      href: "/document-upload",
    },
    {
      icon: MessageSquare,
      title: "AI-Powered Chat",
      description: "Get instant answers to your technical questions with our AI assistant.",
      href: "/ai-chat",
    },
    {
      icon: BookOpen,
      title: "Study Notes Generator",
      description: "Generate concise, well-structured notes from your uploaded documents.",
      href: "/study-notes",
    },
    {
      icon: Network,
      title: "Mind Map Generator",
      description: "Visualize concepts and their relationships in interactive mind maps.",
      href: "/mind-maps",
    },
    {
      icon: Calendar,
      title: "Study Roadmap",
      description: "Get a personalized study plan based on your goals and timeline.",
      href: "/study-roadmap",
    },
    {
      icon: FileCode,
      title: "Code Debugging",
      description: "Get AI-powered feedback and debugging tips for your code.",
      href: "/code-debugging",
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 3D Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background"></div>

        {/* 3D Floating Elements */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/5 blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-primary/5 blur-3xl animate-float-delay"></div>

        {/* 3D Geometric Shapes */}
        <div className="absolute top-20 left-[10%] w-16 h-16 rounded-lg border border-primary/20 transform rotate-12 animate-spin-slow"></div>
        <div className="absolute bottom-20 right-[10%] w-20 h-20 rounded-full border border-primary/20 animate-bounce-slow"></div>
        <div className="absolute top-1/3 right-[20%] w-12 h-12 rounded-md border border-primary/20 transform rotate-45 animate-pulse"></div>

        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight animate-text-reveal">
            Ace Your Technical Interviews with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70">
              InterviewBuddy AI
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8 animate-text-reveal-delay">
            Your AI-powered companion for interview preparation, coding challenges, and technical exams.
          </p>
          <div className="flex flex-wrap justify-center gap-4 animate-fade-in-up">
            <Button size="lg" className="shadow-lg hover:shadow-xl transition-all" asChild>
              <Link href="/dsa-practice">Start Practicing DSA</Link>
            </Button>
            <Button size="lg" variant="outline" className="shadow-md hover:shadow-lg transition-all" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>

        {/* 3D Code Blocks */}
        <div className="hidden lg:block absolute -left-20 top-1/3 w-64 h-40 bg-card/80 backdrop-blur-sm border border-border rounded-lg shadow-xl transform -rotate-12 animate-float-delay">
          <div className="p-4 font-mono text-xs opacity-70">
            <div className="text-primary">function</div>
            <div className="pl-2">
              <span className="text-primary">binarySearch</span>
              <span>(arr, target) {`{`}</span>
            </div>
            <div className="pl-4">// Implementation</div>
            <div className="pl-2">{`}`}</div>
          </div>
        </div>

        <div className="hidden lg:block absolute -right-20 top-2/3 w-64 h-40 bg-card/80 backdrop-blur-sm border border-border rounded-lg shadow-xl transform rotate-12 animate-float">
          <div className="p-4 font-mono text-xs opacity-70">
            <div className="text-primary">class</div>
            <div className="pl-2">
              <span className="text-primary">TreeNode</span>
              <span> {`{`}</span>
            </div>
            <div className="pl-4">// Properties</div>
            <div className="pl-2">{`}`}</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="slide-in transform-3d hover:rotate-y-5 transition-all duration-300 hover:shadow-lg"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader>
                <feature.icon className="h-10 w-10 text-primary mb-2" />
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button variant="outline" asChild className="w-full">
                  <Link href={feature.href}>Explore</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 text-center bg-gradient-to-br from-primary/5 via-secondary to-primary/5 rounded-lg p-8 mt-8 transform-3d hover:rotate-y-2 transition-all duration-500">
        <h2 className="text-3xl font-bold mb-6">Ready to Boost Your Interview Preparation?</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Join thousands of students and professionals who have improved their technical interview skills with
          InterviewBuddy AI.
        </p>
        <Button size="lg" className="shadow-lg hover:shadow-xl transition-all" asChild>
          <Link href="/login">Get Started Now</Link>
        </Button>
      </section>
    </div>
  )
}


import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  Orbit,
  Kanban,
  Users,
  Shield,
  Activity,
  Sparkles,
  BarChart3,
  Container,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Kanban,
    title: "Kanban Boards",
    description: "Organize tasks with drag-and-drop boards. Move cards between Todo, In Progress, Review, and Done.",
  },
  {
    icon: Zap,
    title: "Real-Time Sync",
    description: "See changes instantly. When a teammate moves a card, everyone sees it live via WebSockets.",
  },
  {
    icon: Users,
    title: "Team Workspaces",
    description: "Create workspaces, invite members with a code, and collaborate across multiple boards.",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    description: "Owner, Admin, and Member roles with server-side authorization on every action.",
  },
  {
    icon: Activity,
    title: "Activity Logs",
    description: "Track every action — card created, moved, assigned, completed — with a live activity feed.",
  },
  {
    icon: Sparkles,
    title: "AI Summaries",
    description: "Generate AI-powered board summaries with completed work, blockers, and next steps.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Visualize progress with charts for card status, priority, and team workload.",
  },
  {
    icon: Container,
    title: "Docker & CI/CD",
    description: "Fully containerized with Docker Compose, GitHub Actions, and automated testing.",
  },
];

const techStack = [
  "Next.js",
  "TypeScript",
  "Tailwind CSS",
  "PostgreSQL",
  "Prisma",
  "Socket.IO",
  "Auth.js",
  "Zustand",
  "dnd-kit",
  "Recharts",
  "Docker",
  "GitHub Actions",
];

export default function LandingPage() {
  return (
    <div className="bg-white dark:bg-gray-950">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950 dark:via-gray-950 dark:to-purple-950" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Orbit className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
              <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">OrbitDesk</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-6">
              Real-Time Collaborative{" "}
              <span className="text-indigo-600 dark:text-indigo-400">Workspace</span>
              {" "}for Modern Teams
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
              Manage projects, collaborate on Kanban boards, track activity, and generate AI-powered summaries — all in real time.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg">Get Started Free</Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg">Sign In</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Everything your team needs</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              A complete workspace with boards, real-time collaboration, roles, analytics, and AI — built with production-grade technology.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-md transition-shadow bg-white dark:bg-gray-900"
              >
                <feature.icon className="h-8 w-8 text-indigo-600 dark:text-indigo-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Built with modern technology</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Production-grade stack designed for scalability, developer experience, and real-time performance.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
            {techStack.map((tech) => (
              <span
                key={tech}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-indigo-600 dark:bg-indigo-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to get started?</h2>
          <p className="text-lg text-indigo-100 mb-8 max-w-xl mx-auto">
            Create your workspace, invite your team, and start collaborating in real time.
          </p>
          <Link href="/register">
            <Button
              size="lg"
              className="bg-white text-indigo-600 hover:bg-indigo-50"
            >
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

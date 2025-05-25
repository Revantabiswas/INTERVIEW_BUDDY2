import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Dashboard - InterviewBuddy AI",
  description: "Your AI-powered interview preparation dashboard",
}

export default function DashboardLayout({ children }) {
  return (
    <div className="dashboard-layout">
      {children}
    </div>
  )
}
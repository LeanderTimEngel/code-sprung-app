import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-6">Welcome to the Coding Challenge Platform</h1>
      <p className="text-xl mb-8">Improve your coding skills with interactive challenges</p>
      <div className="space-x-4">
        <Button asChild>
          <Link href="/login">Get Started</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/about">Learn More</Link>
        </Button>
      </div>
    </main>
  )
}
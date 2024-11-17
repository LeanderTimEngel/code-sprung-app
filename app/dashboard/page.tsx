"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Code2, LogOut, Star, Video } from 'lucide-react'
import Link from "next/link"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { Challenge, getAllChallenges } from "@/lib/challenges"
import { getUserProgress } from "@/lib/userProgress"
import { Leaderboard } from "@/components/Leaderboard"

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [userProgress, setUserProgress] = useState<Record<string, number>>({})
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        const fetchedChallenges = await getAllChallenges()
        setChallenges(fetchedChallenges)
        const progress = await getUserProgress(currentUser.uid)
        setUserProgress(progress)
      } else {
        router.push("/login")
      }
    })

    return () => unsubscribe()
  }, [router])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push("/login")
    } catch (error) {
      console.error("Failed to log out", error)
    }
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex min-h-screen flex-col space-y-6 p-4 md:p-8">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {user.email}</h1>
          <p className="text-muted-foreground">Master Java programming with hands-on practice</p>
        </div>
        <div className="flex items-center gap-4">
          <Button>Start New Challenge</Button>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All Challenges</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-6">
              <div className="grid gap-6 md:grid-cols-2">
                {challenges.map((challenge) => (
                  <Link key={challenge.id} href={`/challenge/${challenge.id}`}>
                    <Card className="hover:bg-muted/50">
                      <CardHeader className="space-y-1">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl">{challenge.title}</CardTitle>
                          <div className="flex">
                            {Array(challenge.difficulty)
                              .fill(null)
                              .map((_, i) => (
                                <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                              ))}
                          </div>
                        </div>
                        <CardDescription>{challenge.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <Progress value={userProgress[challenge.id] || 0} className="h-2" />
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Code2 className="h-4 w-4" />
                              <span>Practice</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Video className="h-4 w-4" />
                              <span>Video</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4" />
                              <span>Hints</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
        <Leaderboard />
      </div>
    </div>
  )
}
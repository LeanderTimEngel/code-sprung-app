"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Play, RotateCcw, Eye, EyeOff, MessageSquare } from 'lucide-react'
import dynamic from 'next/dynamic'
import { auth } from "@/lib/firebase"
import { updateUserProgress, getUserProgress } from "@/lib/userProgress"
import { getChallengeById, Challenge, resetChallengeCode } from "@/lib/challenges"
import { updateLeaderboard } from "@/lib/leaderboard"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { onAuthStateChanged } from "firebase/auth"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { addComment, getCommentsByChallengeId, Comment } from "@/lib/comments"
import { checkAndUpdateAchievements } from "@/lib/achievements"

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false })

const JUDGE0_API_URL = "https://judge0-ce.p.rapidapi.com"
const JUDGE0_API_KEY = process.env.NEXT_PUBLIC_JUDGE0_API_KEY

export default function ChallengePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params)
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [code, setCode] = useState("")
  const [output, setOutput] = useState<React.ReactNode | string>("")
  const [isRunning, setIsRunning] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("problem")
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
      } else {
        router.push("/login")
      }
    })
    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const challengeData = await getChallengeById(resolvedParams.id)
        if (challengeData) {
          setChallenge(challengeData)
          setCode(challengeData.initialCode)
          if (user) {
            const userProgress = await getUserProgress(user.uid)
            setProgress(userProgress[resolvedParams.id] || 0)
          }
          const challengeComments = await getCommentsByChallengeId(resolvedParams.id)
          setComments(challengeComments)
        } else {
          setError("Challenge not found")
        }
      } catch (err) {
        setError("Failed to load challenge")
      } finally {
        setIsLoading(false)
      }
    }
    if (user) {
      fetchChallenge()
    }
  }, [resolvedParams.id, user])

  const runCode = async () => {
    setIsRunning(true)
    setOutput("")
    setError(null)

    if (!challenge) {
      setError("Challenge data is missing")
      setIsRunning(false)
      return
    }

    const submission = {
      source_code: code,
      language_id: 62, // Java
      stdin: challenge.testCases.map(tc => tc.input).join("\n")
    }

    try {
      if (!JUDGE0_API_KEY) {
        throw new Error("Judge0 API key is missing")
      }

      const response = await fetch(`${JUDGE0_API_URL}/submissions?base64_encoded=false&wait=true`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "X-RapidAPI-Key": JUDGE0_API_KEY,
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com"
        },
        body: JSON.stringify(submission)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.status.id <= 3) { // Accepted, Wrong Answer, Time Limit Exceeded
        const userOutput = result.stdout.trim().split("\n")
        const testResults = challenge.testCases.map((tc, index) => ({
          input: tc.input,
          expected: tc.expected,
          actual: userOutput[index],
          passed: userOutput[index] === tc.expected
        }))
        
        const allPassed = testResults.every(tr => tr.passed)
        
        setOutput(
          <div>
            <h3 className="font-bold mb-2">{allPassed ? "All test cases passed!" : "Some test cases failed. Keep trying!"}</h3>
            {testResults.map((tr, index) => (
              <div key={index} className={`mb-2 p-2 rounded ${tr.passed ? "bg-green-100" : "bg-red-100"}`}>
                <p>Test Case {index + 1}:</p>
                <p>Input: {tr.input}</p>
                <p>Expected: {tr.expected}</p>
                <p>Actual: {tr.actual}</p>
                <p>{tr.passed ? "Passed" : "Failed"}</p>
              </div>
            ))}
          </div>
        )
        
        if (allPassed) {
          const newProgress = 100
          setProgress(newProgress)
          await updateUserProgress(user.uid, challenge.id, newProgress)
          await updateLeaderboard(user.uid, user.email.split('@')[0], challenge.id)
          const newAchievements = await checkAndUpdateAchievements(user.uid, Object.keys(await getUserProgress(user.uid)).length)
          if (newAchievements.length > 0) {
            alert(`Congratulations! You've earned new achievements: ${newAchievements.map(a => a.name).join(', ')}`)
          }
        }
      } else {
        setOutput(`Execution Error: ${result.status.description}`)
      }
    } catch (error) {
      console.error("Error running code:", error)
      setError(`An error occurred while running your code: ${error.message}`)
    }

    setIsRunning(false)
  }

  const resetCode = async () => {
    const boilerplateCode = await resetChallengeCode(resolvedParams.id)
    if (boilerplateCode) {
      setCode(boilerplateCode)
    } else {
      console.error("Could not reset code.")
    }
  }

  const handleCommentSubmit = async () => {
    if (newComment.trim() === "") return
    try {
      await addComment({
        challengeId: resolvedParams.id,
        userId: user.uid,
        username: user.email.split('@')[0],
        content: newComment
      })
      const updatedComments = await getCommentsByChallengeId(resolvedParams.id)
      setComments(updatedComments)
      setNewComment("")
    } catch (error) {
      console.error("Error submitting comment:", error)
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!challenge) {
    return <div>Challenge not found</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{challenge.title}</h1>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="problem">Problem</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
          <TabsTrigger value="output">Output</TabsTrigger>
          <TabsTrigger value="discussion">Discussion</TabsTrigger>
        </TabsList>
        <TabsContent value="problem">
          <Card>
            <CardHeader>
              <CardTitle>Problem Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{challenge.description}</p>
              <Progress value={progress} className="mt-4" />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="code">
          <Card>
            <CardHeader>
              <CardTitle>Code Editor</CardTitle>
            </CardHeader>
            <CardContent>
              <Editor
                height="400px"
                defaultLanguage="java"
                value={code}
                onChange={(value) => setCode(value || "")}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: "on",
                  renderLineHighlight: "all",
                  tabSize: 2,
                }}
              />
              <div className="mt-4 space-x-2">
                <Button onClick={runCode} disabled={isRunning}>
                  {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                  Run Code
                </Button>
                <Button variant="outline" onClick={resetCode}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset Code
                </Button>
                <Button variant="outline" onClick={() => setShowHint(!showHint)}>
                  {showHint ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                  {showHint ? "Hide Hint" : "Show Hint"}
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Eye className="mr-2 h-4 w-4" />
                      View Solution
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Solution</DialogTitle>
                      <DialogDescription>
                        Here's one possible solution to the challenge. Remember, there might be multiple ways to solve this problem!
                      </DialogDescription>
                    </DialogHeader>
                    <Editor
                      height="300px"
                      defaultLanguage="java"
                      value={challenge.solutionCode}
                      theme="vs-dark"
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: "on",
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
              {showHint && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Hint</CardTitle>
                  </CardHeader>
                  <CardContent>{challenge.hint}</CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="output">
          <Card>
            <CardHeader>
              <CardTitle>Output</CardTitle>
            </CardHeader>
            <CardContent>
              {typeof output === 'string' ? (
                <pre className="bg-gray-100 p-4 rounded">{output}</pre>
              ) : (
                output
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="discussion">
          <Card>
            <CardHeader>
              <CardTitle>Discussion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-100 p-4 rounded">
                    <p className="font-semibold">{comment.username}</p>
                    <p>{comment.content}</p>
                    <p className="text-sm text-gray-500">{comment.createdAt.toDate().toLocaleString()}</p>
                  </div>
                ))}
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <Button onClick={handleCommentSubmit}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Post Comment
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Video Tutorial</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-w-16 aspect-h-9">
            <iframe
              src={challenge.videoUrl}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
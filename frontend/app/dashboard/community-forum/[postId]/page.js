"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  MessageSquare, 
  ThumbsUp, 
  MessageCircle, 
  Share2, 
  ChevronLeft,
  Flag,
  Bookmark,
  Send
} from "lucide-react";

export default function ForumPost() {
  const params = useParams();
  const postId = parseInt(params.postId);
  const [commentText, setCommentText] = useState("");
  
  // Mock post data - in a real app, you would fetch this based on the postId
  const post = {
    id: postId,
    title: postId === 1 
      ? "How to implement quicksort in JavaScript?"
      : "System design interview preparation tips",
    content: postId === 1
      ? "I'm struggling with implementing quicksort algorithm in JavaScript. Can someone explain the partition function in detail? I'm confused about how to choose the pivot element efficiently.\n\nHere's my current implementation, but it's not working correctly:\n\n```javascript\nfunction quickSort(arr) {\n  if (arr.length <= 1) {\n    return arr;\n  }\n  \n  const pivot = arr[Math.floor(arr.length / 2)];\n  const left = [];\n  const right = [];\n  const equal = [];\n  \n  for (let val of arr) {\n    if (val < pivot) {\n      left.push(val);\n    } else if (val > pivot) {\n      right.push(val);\n    } else {\n      equal.push(val);\n    }\n  }\n  \n  return [...quickSort(left), ...equal, ...quickSort(right)];\n}\n```\n\nThe issue seems to be with the partition logic. Any help would be appreciated!"
      : "I have a system design interview coming up next week with a FAANG company. What's the best approach to prepare in a short time? Any resources or tips would be greatly appreciated.\n\nI'm particularly interested in:\n\n1. Distributed systems concepts\n2. Database scaling strategies\n3. Real-time processing architectures\n4. Caching techniques\n\nAre there any good books, courses, or practice platforms you'd recommend for system design preparation? How do I structure my answers effectively during the interview?",
    author: {
      name: postId === 1 ? "Alice Johnson" : "Robert Chen",
      avatar: "/placeholder-user.jpg",
      reputation: postId === 1 ? 1240 : 3580,
      joinDate: "May 2023"
    },
    category: postId === 1 ? "algorithms" : "interview-prep",
    tags: postId === 1 
      ? ["javascript", "sorting", "algorithms", "dsa"]
      : ["system-design", "interview", "architecture"],
    upvotes: postId === 1 ? 25 : 42,
    comments: postId === 1 ? 12 : 18,
    timestamp: postId === 1 ? "3 hours ago" : "1 day ago",
    solved: false,
  };
  
  // Mock comments data
  const mockComments = [
    {
      id: 1,
      author: {
        name: "Tech Mentor",
        avatar: "/placeholder-user.jpg",
        reputation: 9875
      },
      content: postId === 1
        ? "Your implementation looks mostly correct, but there's a subtle issue with your pivot selection. When you choose the middle element as the pivot, it can lead to worst-case O(n²) performance for already sorted or reverse-sorted arrays.\n\nTry using a randomized pivot selection instead:\n\n```javascript\nconst pivotIndex = Math.floor(Math.random() * arr.length);\nconst pivot = arr[pivotIndex];\n```\n\nThis will give you better average-case performance. Also, your current implementation is using extra space with the three arrays. For better space efficiency, consider implementing the in-place partition algorithm."
        : "For system design interviews, I recommend the following approach:\n\n1. **Clarify requirements** - Ask questions to understand the scope\n2. **Back-of-the-envelope calculations** - Estimate scale and capacity\n3. **System interface definition** - Define the API\n4. **High-level design** - Draw the major components\n5. **Detailed design** - Go deeper into key components\n6. **Bottlenecks and scaling** - Identify and address limitations\n\nGood resources: 'Designing Data-Intensive Applications' by Martin Kleppmann, 'System Design Interview' by Alex Xu, and Grokking the System Design Interview course.",
      timestamp: "2 hours ago",
      upvotes: 18,
      isVerified: true
    },
    {
      id: 2,
      author: {
        name: "DevWhiz",
        avatar: "/placeholder-user.jpg",
        reputation: 5632
      },
      content: postId === 1
        ? "Another thing to consider is that your current implementation creates new arrays for each recursive call, which increases memory usage. A more efficient approach would be to implement quicksort in-place.\n\nHere's an example of in-place quicksort:\n\n```javascript\nfunction quickSort(arr, left = 0, right = arr.length - 1) {\n  if (left < right) {\n    const pivotIndex = partition(arr, left, right);\n    quickSort(arr, left, pivotIndex - 1);\n    quickSort(arr, pivotIndex + 1, right);\n  }\n  return arr;\n}\n\nfunction partition(arr, left, right) {\n  // Use a random pivot for better average performance\n  const randomIndex = Math.floor(left + Math.random() * (right - left + 1));\n  swap(arr, randomIndex, right);\n  \n  const pivot = arr[right];\n  let i = left - 1;\n  \n  for (let j = left; j < right; j++) {\n    if (arr[j] <= pivot) {\n      i++;\n      swap(arr, i, j);\n    }\n  }\n  \n  swap(arr, i + 1, right);\n  return i + 1;\n}\n\nfunction swap(arr, i, j) {\n  [arr[i], arr[j]] = [arr[j], arr[i]];\n}\n```\n\nThis implementation modifies the array in-place and uses O(log n) space for the recursion stack."
        : "I'd add that for FAANG-level system design interviews, you need to be very comfortable with specific technologies and trade-offs:\n\n- **CAP theorem** and how it affects your architecture choices\n- **Eventual vs. strong consistency** models\n- **Sharding strategies** for databases\n- **Load balancing** techniques and algorithms\n- **Caching strategies** (write-through, write-behind, etc.)\n\nA great practice method is to take everyday applications (like Twitter, Netflix, Uber) and try to design their architecture from scratch. Then compare your solution with available architecture breakdowns online.",
      timestamp: "1 hour ago",
      upvotes: 12,
      isVerified: false
    },
    {
      id: 3,
      author: {
        name: "AlgoExpert",
        avatar: "/placeholder-user.jpg",
        reputation: 7245
      },
      content: postId === 1
        ? "Adding to the above answers, it's worth understanding why quicksort has an average time complexity of O(n log n) but worst-case O(n²).\n\nThe recurrence relation for quicksort is:\nT(n) = T(k) + T(n-k-1) + Θ(n)\n\nWhere k is the number of elements smaller than the pivot. In the best case, the pivot divides the array into two roughly equal halves, making k ≈ n/2, which gives us O(n log n) complexity.\n\nIn the worst case (like with already sorted arrays and choosing the first/last element as pivot), k = 0 or k = n-1, which leads to O(n²).\n\nThat's why the randomized pivot selection or \"median of three\" pivot strategy is important in practice."
        : "For your upcoming interview, make sure you also understand:\n\n1. **Data partitioning vs data replication**\n2. **Message queues** and when to use them (Kafka vs RabbitMQ)\n3. **Consistent hashing** for distributed caching\n4. **Database indexing** strategies\n5. **Rate limiting** and API gateway patterns\n\nI find that the System Design Primer on GitHub is an excellent free resource that covers all these topics concisely. Also, practicing with past system design questions from GeeksforGeeks or LeetCode's system design section can be very helpful.",
      timestamp: "45 minutes ago",
      upvotes: 8,
      isVerified: true
    }
  ];
  
  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    alert("In a real app, your comment would be saved here!");
    setCommentText("");
  };

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8">
      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <Button variant="ghost" className="gap-2" asChild>
          <Link href="/community-forum">
            <ChevronLeft className="h-4 w-4" />
            Back to Forum
          </Link>
        </Button>
      </motion.div>
    
      {/* Main Post */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="mb-8">
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl md:text-3xl mb-2">{post.title}</CardTitle>
                <CardDescription className="flex flex-wrap gap-2 mb-3">
                  {post.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="hover:bg-muted cursor-pointer">
                      #{tag}
                    </Badge>
                  ))}
                </CardDescription>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Avatar className="h-6 w-6 mr-2">
                      <img src={post.author.avatar} alt={post.author.name} />
                    </Avatar>
                    <span>{post.author.name}</span>
                  </div>
                  <span>·</span>
                  <span>{post.timestamp}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Bookmark className="h-4 w-4" />
                  Save
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Flag className="h-4 w-4" />
                  Report
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="prose dark:prose-invert max-w-none">
              {post.content.split('\n\n').map((paragraph, index) => {
                if (paragraph.startsWith('```') && paragraph.endsWith('```')) {
                  // Handle code blocks
                  const code = paragraph.substring(10, paragraph.length - 3); // Remove ```javascript and ```
                  return (
                    <pre key={index} className="bg-muted p-4 rounded-md overflow-x-auto">
                      <code className="text-sm font-mono">{code}</code>
                    </pre>
                  );
                } else {
                  // Handle regular paragraphs
                  return <p key={index} className="mb-4">{paragraph}</p>;
                }
              })}
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between pt-3 border-t">
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-1 text-sm hover:text-primary">
                <ThumbsUp className="h-4 w-4" />
                <span>{post.upvotes}</span>
              </button>
              <div className="flex items-center gap-1 text-sm">
                <MessageCircle className="h-4 w-4" />
                <span>{mockComments.length} comments</span>
              </div>
            </div>
            <div>
              <Button variant="outline" size="sm" className="gap-2">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
      
      {/* Comments Section */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">Comments ({mockComments.length})</h2>
        
        {/* Add Comment */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-10 w-10">
                <img src="/placeholder-user.jpg" alt="Your Avatar" />
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="Share your thoughts or solutions..."
                  className="mb-3 resize-none"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button onClick={handleSubmitComment} className="gap-2">
                    <Send className="h-4 w-4" />
                    Post Comment
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Comments List */}
        <div className="space-y-6">
          {mockComments.map((comment) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <img src={comment.author.avatar} alt={comment.author.name} />
                      </Avatar>
                      <div>
                        <div className="flex items-center">
                          <span className="font-medium">{comment.author.name}</span>
                          {comment.isVerified && (
                            <Badge variant="outline" className="ml-2 text-xs bg-primary/10">Expert</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {comment.timestamp} • Reputation: {comment.author.reputation.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="prose dark:prose-invert max-w-none text-sm">
                    {comment.content.split('\n\n').map((paragraph, index) => {
                      if (paragraph.startsWith('```') && paragraph.endsWith('```')) {
                        // Handle code blocks
                        const code = paragraph.substring(10, paragraph.length - 3); // Remove ```javascript and ```
                        return (
                          <pre key={index} className="bg-muted p-4 rounded-md overflow-x-auto">
                            <code className="text-sm font-mono">{code}</code>
                          </pre>
                        );
                      } else {
                        // Handle regular paragraphs and lists
                        return <p key={index} className="mb-4">{paragraph}</p>;
                      }
                    })}
                  </div>
                </CardContent>
                
                <CardFooter className="text-xs text-muted-foreground pt-2">
                  <div className="flex items-center gap-4">
                    <span>{comment.upvotes} upvotes</span>
                    <button className="hover:text-primary">Reply</button>
                    <button className="hover:text-primary">Share</button>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
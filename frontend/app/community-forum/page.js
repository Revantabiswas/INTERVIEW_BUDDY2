"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, ThumbsUp, MessageCircle, Share2, Search, Filter, PlusCircle } from "lucide-react";

export default function CommunityForum() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
  // Mock forum posts data
  const forumPosts = [
    {
      id: 1,
      title: "How to implement quicksort in JavaScript?",
      content: "I'm struggling with implementing quicksort algorithm in JavaScript. Can someone explain the partition function in detail? I'm confused about how to choose the pivot element efficiently.",
      author: {
        name: "Alice Johnson",
        avatar: "/placeholder-user.jpg",
      },
      category: "algorithms",
      tags: ["javascript", "sorting", "algorithms", "dsa"],
      upvotes: 25,
      comments: 12,
      timestamp: "3 hours ago",
      solved: false,
    },
    {
      id: 2,
      title: "System design interview preparation tips",
      content: "I have a system design interview coming up next week with a FAANG company. What's the best approach to prepare in a short time? Any resources or tips would be greatly appreciated.",
      author: {
        name: "Robert Chen",
        avatar: "/placeholder-user.jpg",
      },
      category: "interview-prep",
      tags: ["system-design", "interview", "architecture"],
      upvotes: 42,
      comments: 18,
      timestamp: "1 day ago",
      solved: false,
    },
    {
      id: 3,
      title: "React hooks vs class components",
      content: "I'm transitioning from class components to hooks in React. What are the best practices to follow? Are there any scenarios where class components are still preferable?",
      author: {
        name: "Sophia Williams",
        avatar: "/placeholder-user.jpg",
      },
      category: "frontend",
      tags: ["react", "hooks", "javascript", "frontend"],
      upvotes: 18,
      comments: 7,
      timestamp: "2 days ago",
      solved: true,
    },
    {
      id: 4,
      title: "Time complexity analysis of heap sort",
      content: "Can someone help me understand the time complexity analysis of heap sort? Particularly why it's more efficient in certain scenarios than quicksort?",
      author: {
        name: "David Kim",
        avatar: "/placeholder-user.jpg",
      },
      category: "algorithms",
      tags: ["algorithms", "complexity", "dsa", "sorting"],
      upvotes: 15,
      comments: 5,
      timestamp: "3 days ago",
      solved: true,
    },
    {
      id: 5,
      title: "Preparing for behavioral interviews",
      content: "What are some effective strategies for behavioral interviews? How do I structure my responses using the STAR method effectively?",
      author: {
        name: "Eliza Martinez",
        avatar: "/placeholder-user.jpg",
      },
      category: "interview-prep",
      tags: ["behavioral", "interview", "soft-skills"],
      upvotes: 31,
      comments: 14,
      timestamp: "4 days ago",
      solved: false,
    },
    {
      id: 6,
      title: "Understanding binary trees and traversal algorithms",
      content: "I'm having trouble with tree traversal algorithms. Can someone explain the differences between inorder, preorder, and postorder traversals with examples?",
      author: {
        name: "Michael Johnson",
        avatar: "/placeholder-user.jpg",
      },
      category: "data-structures",
      tags: ["tree", "algorithms", "traversal", "dsa"],
      upvotes: 22,
      comments: 9,
      timestamp: "5 days ago",
      solved: false,
    },
    {
      id: 7,
      title: "Database indexing best practices",
      content: "When should I create indexes in a database? Are there scenarios where indexing might actually slow down performance?",
      author: {
        name: "Jessica Liu",
        avatar: "/placeholder-user.jpg",
      },
      category: "databases",
      tags: ["sql", "database", "performance", "indexing"],
      upvotes: 35,
      comments: 21,
      timestamp: "1 week ago",
      solved: true,
    }
  ];
  
  // Filter posts based on search query and active tab
  const filteredPosts = forumPosts
    .filter(post => 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .filter(post => {
      if (activeTab === "all") return true;
      if (activeTab === "solved") return post.solved;
      if (activeTab === "unsolved") return !post.solved;
      return post.category === activeTab;
    });
  
  // Categories for filtering
  const categories = [
    { id: "all", label: "All Topics" },
    { id: "algorithms", label: "Algorithms" },
    { id: "data-structures", label: "Data Structures" },
    { id: "interview-prep", label: "Interview Prep" },
    { id: "frontend", label: "Frontend" },
    { id: "databases", label: "Databases" },
    { id: "solved", label: "Solved Questions" },
    { id: "unsolved", label: "Unsolved Questions" },
  ];

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold mb-2">Community Forum</h1>
        <p className="text-muted-foreground text-lg">
          Ask questions, share knowledge, and connect with fellow learners preparing for technical interviews.
        </p>
      </motion.div>
      
      {/* Search and Create Post Section */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Search posts, topics, or tags..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button className="gap-2" size="default" asChild>
          <Link href="/community-forum/create">
            <PlusCircle className="h-4 w-4" />
            Create New Post
          </Link>
        </Button>
      </div>
      
      {/* Categories Tabs */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="w-full overflow-x-auto flex-nowrap whitespace-nowrap pb-1 justify-start">
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.id} className="px-4">
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      
      {/* Forum Posts */}
      {filteredPosts.length > 0 ? (
        <div className="grid gap-6">
          {filteredPosts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="overflow-hidden hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl mb-1 hover:text-primary transition-colors">
                        <Link href={`/community-forum/${post.id}`}>
                          {post.title}
                        </Link>
                        {post.solved && (
                          <Badge variant="success" className="ml-2 bg-green-600 hover:bg-green-700">Solved</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="flex flex-wrap gap-2">
                        {post.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="cursor-pointer hover:bg-muted">
                            #{tag}
                          </Badge>
                        ))}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-muted-foreground line-clamp-2">{post.content}</p>
                </CardContent>
                
                <CardFooter className="flex justify-between pt-3 border-t">
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
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
                      <ThumbsUp className="h-4 w-4" />
                      <span>{post.upvotes}</span>
                    </button>
                    <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
                      <MessageCircle className="h-4 w-4" />
                      <span>{post.comments}</span>
                    </button>
                    <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No posts found</h3>
          <p className="text-muted-foreground mb-6">
            No posts match your search criteria. Try different keywords or create a new post.
          </p>
          <Button>Create New Post</Button>
        </div>
      )}
    </div>
  );
}
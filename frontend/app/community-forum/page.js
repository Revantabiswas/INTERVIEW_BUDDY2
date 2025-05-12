"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, ThumbsUp, MessageCircle, Share2, Search, Filter, PlusCircle } from "lucide-react";
import { forumApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function CommunityForum() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState(null);
  const { toast } = useToast();
  
  // Fetch forum posts from backend
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const data = await forumApi.getAllPosts();
        console.log("Fetched forum posts:", data);
        setPosts(data);
      } catch (err) {
        console.error("Failed to fetch forum posts:", err);
        setError(err.message);
        toast({
          title: "Error",
          description: "Failed to load forum posts. " + err.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchPosts();
  }, [toast]);
  
  // Mock forum posts as fallback if API fails
  const mockForumPosts = [
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
      user_id: "user123",
      created_at: "2025-05-10T15:30:00Z"
    },
    // ...existing mock posts...
  ];
  
  // Use fetched posts if available, otherwise use mock posts
  const forumPosts = posts.length > 0 ? posts.map(post => ({
    ...post,
    author: {
      name: post.user_id, // Replace with actual username when user data is available
      avatar: "/placeholder-user.jpg"
    },
    category: post.tags?.[0] || "general",
    upvotes: post.upvotes || 0,
    comments: post.comments || 0,
    timestamp: formatTimestamp(post.created_at),
    solved: post.solved || false
  })) : mockForumPosts;
  
  // Helper to format the timestamp
  function formatTimestamp(timestamp) {
    if (!timestamp) return "Unknown time";
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);
    
    if (isNaN(diffSeconds)) return "Invalid date";
    
    if (diffSeconds < 60) return "Just now";
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} minutes ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} hours ago`;
    if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)} days ago`;
    
    return date.toLocaleDateString();
  }
  
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
      
      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
      
      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h3 className="text-xl font-medium mb-2">Unable to load posts</h3>
          <p className="text-muted-foreground mb-6">
            {error}
          </p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      )}
      
      {/* Forum Posts */}
      {!loading && !error && filteredPosts.length > 0 ? (
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
                        {post.tags && post.tags.map(tag => (
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
      ) : !loading && !error ? (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No posts found</h3>
          <p className="text-muted-foreground mb-6">
            No posts match your search criteria. Try different keywords or create a new post.
          </p>
          <Button asChild>
            <Link href="/community-forum/create">Create New Post</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
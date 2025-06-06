"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, ChevronLeft, MessageSquare, Loader2 } from "lucide-react";
import { forumApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function CreatePost() {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    tags: []
  });
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // List of categories
  const categories = [
    { id: "algorithms", name: "Algorithms" },
    { id: "data-structures", name: "Data Structures" },
    { id: "interview-prep", name: "Interview Preparation" },
    { id: "frontend", name: "Frontend Development" },
    { id: "backend", name: "Backend Development" },
    { id: "databases", name: "Databases" },
    { id: "system-design", name: "System Design" },
    { id: "career-advice", name: "Career Advice" },
  ];

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const addTag = (e) => {
    e.preventDefault();
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim().toLowerCase())) {
      // Only add tag if it's not already in the list and not empty
      if (formData.tags.length < 5) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim().toLowerCase()]
        }));
        setTagInput("");
      } else {
        setErrors(prev => ({ ...prev, tags: "Maximum 5 tags allowed" }));
      }
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
    // Clear tags error if any
    if (errors.tags) {
      setErrors(prev => ({ ...prev, tags: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length < 10) {
      newErrors.title = "Title must be at least 10 characters";
    }
    
    if (!formData.content.trim()) {
      newErrors.content = "Content is required";
    } else if (formData.content.length < 30) {
      newErrors.content = "Content must be at least 30 characters";
    }
    
    if (!formData.category) {
      newErrors.category = "Please select a category";
    }
    
    if (formData.tags.length === 0) {
      newErrors.tags = "Add at least one tag";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Analyze text content to suggest tags
  const analyzeContent = async () => {
    if (formData.content.length < 30) {
      toast({
        title: "Content too short",
        description: "Please add more content before analysis",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsAnalyzing(true);
      const response = await forumApi.analyzeText(formData.content);
      
      // Add suggested tags that aren't already in the list
      const suggestedTags = response.tags || [];
      const newTags = suggestedTags
        .filter(tag => !formData.tags.includes(tag))
        .slice(0, 5 - formData.tags.length);
      
      if (newTags.length > 0) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, ...newTags].slice(0, 5)
        }));
        
        toast({
          title: "Content analyzed",
          description: `Added ${newTags.length} suggested tags based on your content`,
          variant: "default"
        });
      } else {
        toast({
          title: "No new tags",
          description: "No additional tags could be suggested",
          variant: "default"
        });
      }
      
    } catch (error) {
      console.error("Error analyzing content:", error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Could not analyze your content",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        setIsSubmitting(true);
        
        // Generate a unique ID and convert to string to match backend expectations
        const userId = String(Math.floor(Date.now() / 1000)); // Unix timestamp as string ID
        
        // Submit post to backend API
        await forumApi.createPost(
          formData.title,
          formData.content,
          userId,
          [...formData.tags, formData.category] // Include category as a tag
        );
        
        // Show success message and redirect
        toast({
          title: "Success!",
          description: "Your post has been published",
          variant: "default"
        });
        
        router.push("/community-forum");
      } catch (error) {
        console.error("Error creating post:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to create your post",
          variant: "destructive"
        });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Scroll to the first error
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        document.getElementById(firstErrorField)?.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8">
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
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <MessageSquare className="h-6 w-6" />
          Create New Post
        </h1>
        <p className="text-muted-foreground mt-2">
          Share your question or doubt with the community to get help from other users.
        </p>
      </motion.div>
      
      {/* Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Post Details</CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., How to implement binary search in JavaScript?"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  className={errors.title ? "border-destructive" : ""}
                  disabled={isSubmitting}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Be specific and clear to get better responses.
                </p>
              </div>
              
              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content" className="text-base">
                  Content <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="content"
                  placeholder="Describe your question in detail. Include code snippets, error messages, or specific scenarios you're dealing with."
                  value={formData.content}
                  onChange={(e) => handleChange("content", e.target.value)}
                  rows={10}
                  className={errors.content ? "border-destructive" : ""}
                  disabled={isSubmitting}
                />
                {errors.content && (
                  <p className="text-sm text-destructive">{errors.content}</p>
                )}
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    For code blocks, use triple backticks: ```code here```
                  </p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={analyzeContent}
                    disabled={isAnalyzing || isSubmitting || formData.content.length < 30}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      "Suggest Tags"
                    )}
                  </Button>
                </div>
              </div>
              
              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-base">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleChange("category", value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="category" className={errors.category ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-destructive">{errors.category}</p>
                )}
              </div>
              
              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags" className="text-base">
                  Tags <span className="text-destructive">*</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    (max 5)
                  </span>
                </Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1 py-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-muted-foreground hover:text-foreground focus:outline-none"
                        aria-label={`Remove tag ${tag}`}
                        disabled={isSubmitting}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex">
                  <Input
                    id="tags"
                    placeholder="Add a tag and press Enter (e.g., javascript, sorting)"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addTag(e);
                      }
                    }}
                    className={errors.tags ? "border-destructive" : ""}
                    disabled={isSubmitting || formData.tags.length >= 5}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={addTag}
                    className="ml-2"
                    disabled={isSubmitting || formData.tags.length >= 5 || !tagInput.trim()}
                  >
                    Add
                  </Button>
                </div>
                {errors.tags && (
                  <p className="text-sm text-destructive">{errors.tags}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Add relevant tags to help others find your post. Press Enter after each tag.
                </p>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-end space-x-4 pt-6">
              <Button 
                variant="outline" 
                type="button" 
                asChild 
                disabled={isSubmitting}
              >
                <Link href="/community-forum">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  "Publish Post"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Network, Download, Trash2, Search, Filter, Plus, Eye, List } from "lucide-react"

// Mock data for mind maps
const mockMindMaps = [
  {
    id: 1,
    title: "Data Structures Overview",
    source: "Data Structures Notes.pdf",
    createdAt: "2023-10-15",
    nodes: 24,
    description: "A comprehensive overview of common data structures and their relationships.",
    preview: "/placeholder.svg?height=200&width=400",
  },
  {
    id: 2,
    title: "Sorting Algorithms Comparison",
    source: "Algorithm Cheat Sheet.docx",
    createdAt: "2023-10-12",
    nodes: 16,
    description: "Visual comparison of different sorting algorithms and their properties.",
    preview: "/placeholder.svg?height=200&width=400",
  },
]

export default function MindMaps() {
  const [mindMaps, setMindMaps] = useState(mockMindMaps)
  const [searchQuery, setSearchQuery] = useState("")
  const [sourceFilter, setSourceFilter] = useState("All")
  const [viewMode, setViewMode] = useState("visual")

  // Get unique sources for filter
  const sources = ["All", ...new Set(mindMaps.map((map) => map.source))]

  // Filter mind maps based on search and filters
  const filteredMindMaps = mindMaps.filter((map) => {
    const matchesSearch =
      map.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      map.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSource = sourceFilter === "All" || map.source === sourceFilter

    return matchesSearch && matchesSource
  })

  const handleDeleteMap = (id) => {
    setMindMaps(mindMaps.filter((map) => map.id !== id))
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <h1 className="text-3xl font-bold mb-6">Mind Map Generator</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <Card className="lg:col-span-1 h-fit animate-slide-in">
          <CardHeader>
            <CardTitle>Generate Mind Maps</CardTitle>
            <CardDescription>Visualize concepts and their relationships</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Button className="w-full flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                New Mind Map
              </Button>
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium mb-2">Filter Mind Maps</h3>
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search mind maps..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by source" />
                  </SelectTrigger>
                  <SelectContent>
                    {sources.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mind Maps List */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="all">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="all">All Mind Maps</TabsTrigger>
                <TabsTrigger value="recent">Recent</TabsTrigger>
                <TabsTrigger value="favorites">Favorites</TabsTrigger>
              </TabsList>

              <div className="flex border rounded-md overflow-hidden">
                <Button
                  variant={viewMode === "visual" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none"
                  onClick={() => setViewMode("visual")}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Visual
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4 mr-2" />
                  List
                </Button>
              </div>
            </div>

            <TabsContent value="all" className="mt-6">
              {viewMode === "visual" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredMindMaps.length > 0 ? (
                    filteredMindMaps.map((map) => (
                      <Card key={map.id} className="animate-slide-in">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle>{map.title}</CardTitle>
                              <CardDescription className="flex items-center mt-1">
                                <Network className="h-4 w-4 mr-1" />
                                {map.source} • {map.createdAt}
                              </CardDescription>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDeleteMap(map.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="aspect-video bg-secondary rounded-md overflow-hidden mb-3">
                            <img
                              src={map.preview || "/placeholder.svg"}
                              alt={map.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <p className="text-sm text-muted-foreground">{map.description}</p>
                        </CardContent>
                        <CardFooter>
                          <div className="flex justify-between items-center w-full">
                            <Badge variant="outline">{map.nodes} nodes</Badge>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Export
                              </Button>
                            </div>
                          </div>
                        </CardFooter>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12 border rounded-lg">
                      <Network className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-1">No Mind Maps Found</h3>
                      <p className="text-muted-foreground mb-4">
                        {searchQuery || sourceFilter !== "All"
                          ? "No mind maps match your search criteria. Try adjusting your filters."
                          : "Generate your first mind map to get started."}
                      </p>
                      {searchQuery || sourceFilter !== "All" ? (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSearchQuery("")
                            setSourceFilter("All")
                          }}
                        >
                          Reset Filters
                        </Button>
                      ) : (
                        <Button>Generate Mind Map</Button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2 animate-fade-in">
                  {filteredMindMaps.length > 0 ? (
                    filteredMindMaps.map((map) => (
                      <Card key={map.id} className="animate-slide-in">
                        <div className="flex items-center p-4">
                          <div className="h-10 w-10 bg-primary/10 rounded-md flex items-center justify-center mr-4">
                            <Network className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">{map.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {map.source} • {map.nodes} nodes
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteMap(map.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-12 border rounded-lg">
                      <Network className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-1">No Mind Maps Found</h3>
                      <p className="text-muted-foreground mb-4">
                        {searchQuery || sourceFilter !== "All"
                          ? "No mind maps match your search criteria. Try adjusting your filters."
                          : "Generate your first mind map to get started."}
                      </p>
                      {searchQuery || sourceFilter !== "All" ? (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSearchQuery("")
                            setSourceFilter("All")
                          }}
                        >
                          Reset Filters
                        </Button>
                      ) : (
                        <Button>Generate Mind Map</Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="recent" className="mt-6">
              {viewMode === "visual" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredMindMaps.length > 0 ? (
                    filteredMindMaps
                      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                      .slice(0, 2)
                      .map((map) => (
                        <Card key={map.id} className="animate-slide-in">
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle>{map.title}</CardTitle>
                                <CardDescription className="flex items-center mt-1">
                                  <Network className="h-4 w-4 mr-1" />
                                  {map.source} • {map.createdAt}
                                </CardDescription>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteMap(map.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="aspect-video bg-secondary rounded-md overflow-hidden mb-3">
                              <img
                                src={map.preview || "/placeholder.svg"}
                                alt={map.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p className="text-sm text-muted-foreground">{map.description}</p>
                          </CardContent>
                          <CardFooter>
                            <div className="flex justify-between items-center w-full">
                              <Badge variant="outline">{map.nodes} nodes</Badge>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Download className="h-4 w-4 mr-2" />
                                  Export
                                </Button>
                              </div>
                            </div>
                          </CardFooter>
                        </Card>
                      ))
                  ) : (
                    <div className="col-span-full text-center py-12 border rounded-lg">
                      <Network className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-1">No Recent Mind Maps</h3>
                      <p className="text-muted-foreground mb-4">You haven't generated any mind maps recently.</p>
                      <Button>Generate Mind Map</Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2 animate-fade-in">
                  {filteredMindMaps.length > 0 ? (
                    filteredMindMaps
                      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                      .slice(0, 2)
                      .map((map) => (
                        <Card key={map.id} className="animate-slide-in">
                          <div className="flex items-center p-4">
                            <div className="h-10 w-10 bg-primary/10 rounded-md flex items-center justify-center mr-4">
                              <Network className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium">{map.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {map.source} • {map.nodes} nodes
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDeleteMap(map.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))
                  ) : (
                    <div className="text-center py-12 border rounded-lg">
                      <Network className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-1">No Recent Mind Maps</h3>
                      <p className="text-muted-foreground mb-4">You haven't generated any mind maps recently.</p>
                      <Button>Generate Mind Map</Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="favorites" className="mt-6">
              <div className="text-center py-12 border rounded-lg animate-fade-in">
                <Network className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-1">No Favorite Mind Maps</h3>
                <p className="text-muted-foreground mb-4">Mark mind maps as favorites to access them quickly.</p>
                <Button variant="outline">Browse All Mind Maps</Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}


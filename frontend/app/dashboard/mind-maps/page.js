"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Network, Download, Trash2, Search, Filter, Plus, Eye, List, Loader2, X, ZoomIn, ZoomOut, Move } from "lucide-react"
import { documentApi, mindMapsApi } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import dynamic from "next/dynamic"

// Dynamically import D3MindMap component with SSR disabled
const D3MindMap = dynamic(() => import("@/components/D3MindMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  ),
})

export default function MindMaps() {
  const [mindMaps, setMindMaps] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sourceFilter, setSourceFilter] = useState("All")
  const [viewMode, setViewMode] = useState("visual")
  const [documents, setDocuments] = useState([])
  const [selectedDocument, setSelectedDocument] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedMap, setSelectedMap] = useState(null)
  const [isViewingMap, setIsViewingMap] = useState(false)
  const { toast } = useToast()

  // Fetch available documents and mind maps on mount
  useEffect(() => {
    fetchDocuments()
    fetchMindMaps()
  }, [])

  const fetchDocuments = async () => {
    try {
      setIsLoading(true)
      const docs = await documentApi.getAllDocuments()
      setDocuments(docs)
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMindMaps = async () => {
    try {
      setIsLoading(true)
      const maps = await mindMapsApi.getAllMindMaps()
      // Format mind maps to match our component's expected structure
      const formattedMaps = maps.map(map => ({
        id: map.id,
        title: map.topic,
        source: documents.find(d => d.id === map.document_id)?.filename || "Document",
        createdAt: new Date(map.created_at).toLocaleDateString(),
        nodes: map.nodes.length,
        edges: map.edges,
        description: `Mind map about ${map.topic}`,
        preview: "/placeholder.svg",
        rawData: map // Keep the original data
      }))
      setMindMaps(formattedMaps)
    } catch (error) {
      console.error("Error fetching mind maps:", error)
      toast({
        title: "Error",
        description: "Failed to load mind maps: " + error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generateMindMap = async () => {
    if (!selectedDocument) {
      toast({
        title: "Error",
        description: "Please select a document first",
        variant: "destructive",
      })
      return
    }

    const topic = searchQuery || "full document content";

    try {
      setIsGenerating(true);
      // Note: mindMapsApi.generateMindMap expects (documentId, topic) in that order
      const response = await mindMapsApi.generateMindMap(selectedDocument, topic);
      toast({
        title: "Success",
        description: "Mind map generated successfully",
      });
      // Refresh the mind maps list to include the new one
      await fetchMindMaps();
    } catch (error) {
      console.error("Error generating mind map:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate mind map",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const viewMindMap = useCallback((map) => {
    setSelectedMap(map);
    setIsViewingMap(true);
  }, []);

  const closeMindMapView = useCallback(() => {
    setSelectedMap(null);
    setIsViewingMap(false);
  }, []);

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

  const handleDeleteMap = async (id) => {
    try {
      await mindMapsApi.deleteMindMap(id);
      setMindMaps(mindMaps.filter((map) => map.id !== id));
      if (selectedMap?.id === id) {
        setSelectedMap(null);
      }
      toast({
        title: "Success",
        description: "Mind map deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting mind map:", error);
      toast({
        title: "Error",
        description: "Failed to delete mind map: " + error.message,
        variant: "destructive",
      });
    }
  };

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
              <Label>Select Document</Label>
              <Select value={selectedDocument} onValueChange={setSelectedDocument}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a document" />
                </SelectTrigger>
                <SelectContent>
                  {documents.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {doc.filename}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Topic or search query..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Button 
              className="w-full" 
              onClick={generateMindMap}
              disabled={isGenerating || !selectedDocument}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Generate Mind Map
                </>
              )}
            </Button>

            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium mb-2">Filter Mind Maps</h3>
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

            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium mb-2">View Mode</h3>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "visual" ? "default" : "outline"}
                  size="sm"
                  className="w-full"
                  onClick={() => setViewMode("visual")}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Visual
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  className="w-full"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4 mr-2" />
                  List
                </Button>
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
                              <Button variant="outline" size="sm" onClick={() => viewMindMap(map)}>
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
                            <Button variant="ghost" size="sm" onClick={() => viewMindMap(map)}>
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
                                <Button variant="outline" size="sm" onClick={() => viewMindMap(map)}>
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
                              <Button variant="ghost" size="sm" onClick={() => viewMindMap(map)}>
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

      {/* Mind Map Viewer */}
      {isViewingMap && selectedMap && (
        <Dialog open={isViewingMap} onOpenChange={closeMindMapView}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedMap.title}</DialogTitle>
              <DialogDescription>{selectedMap.description}</DialogDescription>
            </DialogHeader>
            <div className="w-full h-[500px]">
              <D3MindMap
                nodes={selectedMap.rawData.nodes}
                edges={selectedMap.rawData.edges}
              />
            </div>
            <Button variant="outline" className="mt-4" onClick={closeMindMapView}>
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}


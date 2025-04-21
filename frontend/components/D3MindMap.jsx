'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { ZoomIn, ZoomOut, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';

const D3MindMap = ({ nodes, edges }) => {
  const svgRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  
  // Process data into D3 compatible format
  const processData = () => {
    // Ensure we have valid data
    if (!nodes || !edges) return { nodes: [], links: [] };
    
    let processedNodes = [];
    let processedLinks = [];
    
    // Process nodes
    if (Array.isArray(nodes)) {
      // Identify the root node (usually has level 0 or the lowest level)
      const rootNodeId = findRootNode(nodes, edges);
      
      processedNodes = nodes.map(node => ({
        id: node.id.toString(),
        label: node.label || node.text || node.id.toString(),
        group: determineNodeGroup(node, rootNodeId),
        level: determineNodeLevel(node, rootNodeId, edges),
        isRoot: node.id.toString() === rootNodeId.toString()
      }));
    }
    
    // Process edges
    if (Array.isArray(edges)) {
      processedLinks = edges.map(edge => ({
        source: edge.source.toString(),
        target: edge.target.toString(),
        value: edge.value || 1
      }));
    }
    
    return { nodes: processedNodes, links: processedLinks };
  };
  
  // Find the root node by analyzing the graph structure
  const findRootNode = (nodes, edges) => {
    // If nodes have level property, use the one with level 0 or minimum level
    const nodeWithLevel = nodes.find(n => n.level === 0 || n.level === 'root');
    if (nodeWithLevel) return nodeWithLevel.id;
    
    // Otherwise determine by analyzing edges (node with most outgoing connections)
    if (edges && edges.length) {
      const outgoingConnections = {};
      const incomingConnections = {};
      
      edges.forEach(edge => {
        outgoingConnections[edge.source] = (outgoingConnections[edge.source] || 0) + 1;
        incomingConnections[edge.target] = (incomingConnections[edge.target] || 0) + 1;
      });
      
      // Root node typically has many outgoing but few incoming connections
      let rootCandidate = null;
      let highestScore = -1;
      
      nodes.forEach(node => {
        const nodeId = node.id.toString();
        const outgoing = outgoingConnections[nodeId] || 0;
        const incoming = incomingConnections[nodeId] || 0;
        const score = outgoing - incoming;
        
        if (score > highestScore) {
          highestScore = score;
          rootCandidate = nodeId;
        }
      });
      
      if (rootCandidate) return rootCandidate;
    }
    
    // Fallback: return first node ID
    return nodes[0]?.id?.toString() || '1';
  };
  
  // Determine group based on connection to root and content
  const determineNodeGroup = (node, rootNodeId) => {
    if (node.id.toString() === rootNodeId.toString()) return 0;
    if (node.group) return node.group;
    
    // Use text content to determine a consistent group
    const label = (node.label || node.text || '').toLowerCase();
    
    // Map certain keywords to specific groups
    if (label.includes('concept') || label.includes('definition')) return 1;
    if (label.includes('example') || label.includes('instance')) return 2;
    if (label.includes('property') || label.includes('attribute')) return 3;
    if (label.includes('relation') || label.includes('connection')) return 4;
    if (label.includes('application') || label.includes('use')) return 5;
    
    // Hash the text to get a consistent group number
    let hash = 0;
    for (let i = 0; i < label.length; i++) {
      hash = ((hash << 5) - hash) + label.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash % 6) + 1; // Return 1-6 for consistency
  };
  
  // Determine node level by analyzing graph distance from root
  const determineNodeLevel = (node, rootNodeId, edges) => {
    if (node.level !== undefined) return node.level;
    if (node.id.toString() === rootNodeId.toString()) return 0;
    
    // Build adjacency list
    const adjacencyList = {};
    if (Array.isArray(edges)) {
      edges.forEach(edge => {
        const source = edge.source.toString();
        const target = edge.target.toString();
        
        if (!adjacencyList[source]) adjacencyList[source] = [];
        if (!adjacencyList[target]) adjacencyList[target] = [];
        
        adjacencyList[source].push(target);
        adjacencyList[target].push(source); // For undirected graph
      });
    }
    
    // BFS to find shortest path from root
    const visited = new Set();
    const queue = [{ id: rootNodeId, level: 0 }];
    
    while (queue.length > 0) {
      const { id, level } = queue.shift();
      
      if (id === node.id.toString()) {
        return level;
      }
      
      if (!visited.has(id)) {
        visited.add(id);
        
        const neighbors = adjacencyList[id] || [];
        neighbors.forEach(neighbor => {
          if (!visited.has(neighbor)) {
            queue.push({ id: neighbor, level: level + 1 });
          }
        });
      }
    }
    
    // Default if not found in traversal
    return 1;
  };

  // Initialize and render the mind map
  useEffect(() => {
    if (!svgRef.current) return;
    
    // Clear any existing visualization
    d3.select(svgRef.current).selectAll('*').remove();
    
    // Process the data
    const data = processData();
    if (data.nodes.length === 0) return;
    
    // Update dimensions
    const container = svgRef.current.parentElement;
    if (container) {
      setWidth(container.clientWidth);
      setHeight(container.clientHeight);
    }
    
    // Create SVG element
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);
    
    // Define a gradient for links
    const defs = svg.append("defs");
    
    // Create arrow marker for directed edges
    defs.append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "-0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .append("path")
      .attr("d", "M 0,-5 L 10,0 L 0,5")
      .attr("fill", "#999");
    
    // Define the main group that will contain our visualization
    const g = svg.append("g")
      .attr("class", "everything");
    
    // Create a hierarchical force simulation
    const simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.links)
        .id(d => d.id)
        .distance(d => 80 + d.source.level * 20) // Longer distances for higher levels
        .strength(0.7))
      .force("charge", d3.forceManyBody()
        .strength(d => d.isRoot ? -1000 : -300) // Stronger repulsion for root
        .distanceMin(10)
        .distanceMax(300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide()
        .radius(d => d.isRoot ? 50 : 35)
        .strength(0.7))
      .force("x", d3.forceX(width / 2).strength(0.05))
      .force("y", d3.forceY(height / 2).strength(0.05));
    
    // Add force to push nodes of similar levels into rings around the root
    simulation.force("radial", d3.forceRadial(
      d => d.level * 120, // Distance from center based on level
      width / 2, 
      height / 2
    ).strength(0.3));
    
    // Define a color scale for node groups with better contrast
    const colorScheme = d3.schemeCategory10.concat(d3.schemeSet2);
    const color = d3.scaleOrdinal(colorScheme);
    
    // Add curved links (edges)
    const link = g.append("g")
      .attr("class", "links")
      .selectAll("path")
      .data(data.links)
      .enter().append("path")
      .attr("fill", "none")
      .attr("stroke", d => {
        // Create gradient based on source and target
        const gradientId = `gradient-${d.source.id}-${d.target.id}`;
        
        const gradient = defs.append("linearGradient")
          .attr("id", gradientId)
          .attr("gradientUnits", "userSpaceOnUse");
        
        gradient.append("stop")
          .attr("offset", "0%")
          .attr("stop-color", d => color(d.source.group || 0));
          
        gradient.append("stop")
          .attr("offset", "100%")
          .attr("stop-color", d => color(d.target.group || 1));
        
        return `url(#${gradientId})`;
      })
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", d => Math.sqrt(d.value) * 1.5)
      .attr("marker-end", "url(#arrowhead)");
    
    // Create node groups
    const node = g.append("g")
      .attr("class", "nodes")
      .selectAll(".node")
      .data(data.nodes)
      .enter().append("g")
      .attr("class", d => `node level-${d.level}`)
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended))
      .on("click", clicked);
    
    // Add outer glow effect for nodes
    node.append("circle")
      .attr("r", d => {
        return d.isRoot ? 40 : 30 - d.level * 2;
      })
      .attr("fill", "none")
      .attr("stroke", d => d3.rgb(color(d.group)).brighter(0.5))
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.3)
      .attr("filter", "url(#glow)");
      
    // Add nodes circles with gradient fill
    node.append("circle")
      .attr("r", d => {
        return d.isRoot ? 35 : 25 - d.level * 2;
      })
      .attr("fill", d => {
        // Create a unique gradient ID for each node
        const gradientId = `node-gradient-${d.id}`;
        
        // Create a radial gradient
        const gradient = defs.append("radialGradient")
          .attr("id", gradientId)
          .attr("cx", "30%")
          .attr("cy", "30%")
          .attr("r", "70%");
          
        // Add color stops
        const baseColor = d.isRoot ? "#7c3aed" : color(d.group);
        gradient.append("stop")
          .attr("offset", "0%")
          .attr("stop-color", d3.rgb(baseColor).brighter(0.7));
          
        gradient.append("stop")
          .attr("offset", "100%")
          .attr("stop-color", baseColor);
        
        return `url(#${gradientId})`;
      })
      .attr("stroke", d => d3.rgb(color(d.group)).darker(0.8))
      .attr("stroke-width", d => d.isRoot ? 2 : 1.5);
    
    // Add text labels to nodes with background for better readability
    const nodeLabelGroup = node.append("g")
      .attr("class", "node-label");
      
    // Text background for readability
    nodeLabelGroup.append("text")
      .attr("dy", ".3em")
      .attr("text-anchor", "middle")
      .attr("stroke", "#fff")
      .attr("stroke-width", 4)
      .attr("stroke-opacity", 0.8)
      .attr("paint-order", "stroke")
      .attr("font-size", d => d.isRoot ? "14px" : "11px")
      .attr("font-weight", d => d.isRoot ? "bold" : "normal")
      .text(d => {
        // Truncate long labels
        if (d.label.length > 20) {
          return d.label.substring(0, 20) + '...';
        }
        return d.label;
      });
      
    // Actual text
    nodeLabelGroup.append("text")
      .attr("dy", ".3em")
      .attr("text-anchor", "middle")
      .attr("fill", d => d.isRoot ? "#fff" : "#333")
      .attr("font-size", d => d.isRoot ? "14px" : "11px")
      .attr("font-weight", d => d.isRoot ? "bold" : "normal")
      .text(d => {
        if (d.label.length > 20) {
          return d.label.substring(0, 20) + '...';
        }
        return d.label;
      })
      .attr("pointer-events", "none");
    
    // Add glow filter for highlights
    const filter = defs.append("filter")
      .attr("id", "glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
      
    filter.append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "coloredBlur");
      
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");
    
    // Add title for tooltip on hover
    node.append("title")
      .text(d => d.label);
    
    // Setup zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        setZoom(event.transform.k);
      });
    
    svg.call(zoom);
    
    // Define drag behavior functions
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
      setIsDragging(true);
    }
    
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      // Keep root node fixed after dragging
      if (!d.isRoot) {
        d.fx = null;
        d.fy = null;
      }
      setIsDragging(false);
    }
    
    // Define click behavior
    function clicked(event, d) {
      // Center the clicked node
      event.stopPropagation();
      
      // Highlight the clicked node
      node.selectAll("circle")
        .attr("filter", null);
      
      d3.select(this).selectAll("circle")
        .attr("filter", "url(#glow)");
      
      // First, reduce opacity of all elements
      node.selectAll("circle")
        .attr("opacity", 0.4);
      
      link.attr("stroke-opacity", 0.1);
      
      // Find all connected nodes
      const linkedNodes = new Set();
      linkedNodes.add(d.id);
      
      data.links.forEach(l => {
        if (l.source.id === d.id) {
          linkedNodes.add(l.target.id);
        } else if (l.target.id === d.id) {
          linkedNodes.add(l.source.id);
        }
      });
      
      // Highlight connected nodes and links
      node.filter(n => linkedNodes.has(n.id))
        .selectAll("circle")
        .attr("opacity", 1);
      
      link.filter(l => 
        l.source.id === d.id || l.target.id === d.id
      )
        .attr("stroke-opacity", 1)
        .attr("stroke-width", d => Math.sqrt(d.value) * 2);
      
      // Optional: Zoom to focus on the clicked node and its connections
      const transition = svg.transition().duration(750);
      
      const bounds = getBoundsForNodes(Array.from(linkedNodes).map(id => 
        data.nodes.find(n => n.id === id)
      ));
      
      const dx = bounds.width;
      const dy = bounds.height;
      const x = (bounds.minX + bounds.maxX) / 2;
      const y = (bounds.minY + bounds.maxY) / 2;
      
      // Calculate the appropriate zoom level
      const scale = 0.8 / Math.max(dx / width, dy / height);
      const translate = [width / 2 - scale * x, height / 2 - scale * y];
      
      // Apply the transformation
      svg.transition(transition)
        .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
      
      // Reset after delay
      setTimeout(() => {
        node.selectAll("circle")
          .attr("opacity", 1)
          .attr("filter", null);
          
        link
          .attr("stroke-opacity", 0.6)
          .attr("stroke-width", d => Math.sqrt(d.value) * 1.5);
      }, 3000);
    }
    
    // Helper function to calculate bounds for a set of nodes
    function getBoundsForNodes(nodes) {
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      
      nodes.forEach(node => {
        if (!node) return;
        
        const radius = node.isRoot ? 40 : 30;
        minX = Math.min(minX, node.x - radius);
        maxX = Math.max(maxX, node.x + radius);
        minY = Math.min(minY, node.y - radius);
        maxY = Math.max(maxY, node.y + radius);
      });
      
      return {
        minX, maxX, minY, maxY,
        width: maxX - minX,
        height: maxY - minY
      };
    }
    
    // Update positions on each tick with curved edges
    simulation.on("tick", () => {
      // Draw curved links
      link.attr("d", d => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy) * 2;
        
        // Draw a curved line
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
      });
      
      // Position nodes
      node.attr("transform", d => `translate(${d.x},${d.y})`);
      
      // Update gradient positions after nodes have moved
      data.links.forEach(d => {
        const gradientId = `gradient-${d.source.id}-${d.target.id}`;
        defs.select(`#${gradientId}`)
          .attr("x1", d.source.x)
          .attr("y1", d.source.y)
          .attr("x2", d.target.x)
          .attr("y2", d.target.y);
      });
    });
    
    // Optional: Fix root node in center initially
    const rootNode = data.nodes.find(n => n.isRoot);
    if (rootNode) {
      rootNode.fx = width / 2;
      rootNode.fy = height / 2;
      
      // After initial stabilization, allow root to move if needed
      setTimeout(() => {
        if (rootNode) {
          rootNode.fx = null;
          rootNode.fy = null;
        }
      }, 2000);
    }
    
    // Resize handler
    const handleResize = () => {
      if (!svgRef.current) return;
      const container = svgRef.current.parentElement;
      if (container) {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        
        // Update SVG dimensions
        d3.select(svgRef.current)
          .attr("width", newWidth)
          .attr("height", newHeight);
        
        // Update force center
        simulation.force("center", d3.forceCenter(newWidth / 2, newHeight / 2));
        simulation.force("x", d3.forceX(newWidth / 2).strength(0.05));
        simulation.force("y", d3.forceY(newHeight / 2).strength(0.05));
        simulation.force("radial", d3.forceRadial(
          d => d.level * 120, 
          newWidth / 2, 
          newHeight / 2
        ).strength(0.3));
        
        simulation.alpha(0.3).restart();
        
        setWidth(newWidth);
        setHeight(newHeight);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      simulation.stop();
    };
  }, [nodes, edges, width, height]);

  const handleZoomIn = () => {
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(d3.zoom().scaleBy, 1.3);
  };
  
  const handleZoomOut = () => {
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(d3.zoom().scaleBy, 0.7);
  };
  
  const handleReset = () => {
    d3.select(svgRef.current)
      .transition()
      .duration(500)
      .call(
        d3.zoom().transform,
        d3.zoomIdentity.translate(width / 2, height / 2).scale(1)
      );
  };

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <Button variant="outline" size="icon" onClick={handleZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleReset}>
          <Move className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="bg-muted/20 rounded-md border overflow-hidden w-full h-full p-2">
        <svg 
          ref={svgRef} 
          className={`w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{ minHeight: '500px' }}
        />
        
        {(!nodes || nodes.length === 0) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p>No mind map data available</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default D3MindMap;
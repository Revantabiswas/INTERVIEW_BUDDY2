import React, { useEffect, useRef } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';

const MindMapVisualizer = ({ graphData }) => {
  const networkRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!graphData || !graphData.nodes || !graphData.edges) {
      return;
    }

    // Clean up previous network if it exists
    if (networkRef.current) {
      networkRef.current.destroy();
      networkRef.current = null;
    }

    // Create vis.js datasets
    const nodes = new DataSet(
      graphData.nodes.map(node => ({
        id: node.id,
        label: node.label,
        group: node.group,
        font: { size: node.id === 'center' ? 18 : 14 },
        shape: node.id === 'center' ? 'ellipse' : 'box',
        color: {
          background: node.id === 'center' ? '#7CB9E8' : undefined
        }
      }))
    );

    const edges = new DataSet(graphData.edges);

    // Create network
    const data = { nodes, edges };
    const options = {
      layout: {
        hierarchical: {
          direction: 'UD',
          sortMethod: 'directed',
          nodeSpacing: 120,
          levelSeparation: 150
        }
      },
      physics: {
        enabled: true,
        hierarchicalRepulsion: {
          nodeDistance: 150,
          centralGravity: 0.0,
          springLength: 200,
          springConstant: 0.01,
          damping: 0.09
        }
      },
      nodes: {
        font: {
          size: 14,
          face: 'Arial'
        },
        borderWidth: 2,
        shadow: true
      },
      edges: {
        width: 2,
        shadow: true,
        smooth: {
          type: 'dynamic',
          forceDirection: 'none',
          roundness: 0.5
        }
      },
      interaction: {
        hover: true,
        navigationButtons: true,
        keyboard: true
      }
    };

    // Initialize network
    networkRef.current = new Network(containerRef.current, data, options);

    // Center the network
    setTimeout(() => {
      if (networkRef.current) {
        networkRef.current.fit();
      }
    }, 500);

    // Clean up on unmount
    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [graphData]);

  return (
    <div className="mind-map-container">
      {!graphData && <div className="loading">Loading mind map...</div>}
      <div
        ref={containerRef}
        className="mind-map-network"
        style={{ height: '600px', width: '100%' }}
      />
    </div>
  );
};

export default MindMapVisualizer;

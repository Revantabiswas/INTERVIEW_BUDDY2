"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function SplashScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [showText, setShowText] = useState(false);
  const [particles, setParticles] = useState([]);

  // Code snippets that will be animated in the background
  const codeSnippets = [
    "function mergeSort(arr) {",
    "  if (arr.length <= 1) return arr;",
    "  const mid = Math.floor(arr.length / 2);",
    "  const left = mergeSort(arr.slice(0, mid));",
    "  const right = mergeSort(arr.slice(mid));",
    "  return merge(left, right);",
    "}",
    "class Node {",
    "  constructor(value) {",
    "    this.value = value;",
    "    this.next = null;",
    "  }",
    "}",
    "const binarySearch = (arr, target) => {",
    "  let left = 0;",
    "  let right = arr.length - 1;",
    "  while (left <= right) {",
    "    const mid = Math.floor((left + right) / 2);",
    "    if (arr[mid] === target) return mid;",
    "    if (arr[mid] < target) left = mid + 1;",
    "    else right = mid - 1;",
    "  }",
    "  return -1;",
    "}",
    "function quickSort(arr, left = 0, right = arr.length - 1) {",
    "  if (left < right) {",
    "    const pivotIndex = partition(arr, left, right);",
    "    quickSort(arr, left, pivotIndex - 1);",
    "    quickSort(arr, pivotIndex + 1, right);",
    "  }",
    "  return arr;",
    "}",
    "class TreeNode {",
    "  constructor(val) {",
    "    this.val = val;",
    "    this.left = null;",
    "    this.right = null;",
    "  }",
    "}",
    "function dijkstra(graph, start) {",
    "  const distances = {};",
    "  const visited = {};",
    "  const previous = {};",
    "  const nodes = new PriorityQueue();",
    "  // Initialize distances",
    "  for (let vertex in graph) {",
    "    distances[vertex] = Infinity;",
    "    previous[vertex] = null;",
    "  }",
    "  distances[start] = 0;",
    "  nodes.enqueue(start, 0);",
    "  // Process all nodes",
    "  while (!nodes.isEmpty()) {",
    "    const current = nodes.dequeue().val;",
    "    if (visited[current]) continue;",
    "    visited[current] = true;",
    "    // For each neighbor",
    "    for (let neighbor in graph[current]) {",
    "      const distance = graph[current][neighbor];",
    "      const totalDist = distances[current] + distance;",
    "      if (totalDist < distances[neighbor]) {",
    "        distances[neighbor] = totalDist;",
    "        previous[neighbor] = current;",
    "        nodes.enqueue(neighbor, totalDist);",
    "      }",
    "    }",
    "  }",
    "  return { distances, previous };",
    "}"
  ];

  // Generate particles for background effect
  useEffect(() => {
    const newParticles = [];
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 6 + 2,
        opacity: Math.random() * 0.5 + 0.1,
        speed: Math.random() * 0.4 + 0.1
      });
    }
    setParticles(newParticles);
  }, []);

  useEffect(() => {
    // Show text after a slight delay
    setTimeout(() => setShowText(true), 500);
    
    // Progress bar animation with easing for smoother progress
    const timer = setInterval(() => {
      setProgress(prevProgress => {
        if (prevProgress >= 100) {
          clearInterval(timer);
          // Add a longer delay for a more satisfying completion
          setTimeout(() => router.push('/login'), 800);
          return 100;
        }
        // Variable speed progress for more natural feeling
        const increment = 0.7 * (1 - prevProgress / 200);
        return prevProgress + increment;
      });
    }, 25);

    return () => clearInterval(timer);
  }, [router]);

  // Pulse animation variants
  const pulseVariants = {
    pulse: {
      scale: [1, 1.05, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center overflow-hidden relative">
      {/* Dynamic gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 animate-gradient-shift"></div>
      
      {/* Animated particle background */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-white"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
            }}
            animate={{
              y: ["0%", "100%"],
              opacity: [particle.opacity, 0]
            }}
            transition={{
              duration: 15 / particle.speed,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 10
            }}
          />
        ))}
      </div>

      {/* Animated code snippets with improved styling */}
      <div className="absolute inset-0 overflow-hidden opacity-15 filter blur-[0.5px]">
        {codeSnippets.map((snippet, index) => (
          <motion.div
            key={index}
            initial={{ 
              x: Math.random() > 0.5 ? -2000 : 2000,
              y: Math.random() * window.innerHeight
            }}
            animate={{ 
              x: Math.random() > 0.5 ? 2000 : -2000,
              y: Math.random() * window.innerHeight,
            }}
            transition={{
              duration: Math.random() * 20 + 15,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "linear"
            }}
            className="absolute whitespace-nowrap font-mono text-cyan-300"
            style={{ 
              fontSize: `${Math.random() * 14 + 12}px`,
              textShadow: '0 0 10px rgba(0, 255, 255, 0.5)'
            }}
          >
            {snippet}
          </motion.div>
        ))}
      </div>

      {/* Glowing overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent to-black opacity-70"></div>

      {/* Main content with enhanced styling */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo animation with glow effect */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            duration: 1.2, 
            type: "spring",
            stiffness: 80,
            damping: 15
          }}
          className="mb-8 relative"
        >
          <motion.div 
            variants={pulseVariants}
            animate="pulse"
            className="absolute w-32 h-32 rounded-full bg-primary opacity-30 blur-md"
            style={{ boxShadow: '0 0 40px rgba(124, 58, 237, 0.8)' }}
          />
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg">
            <span className="text-5xl font-bold text-white">IB</span>
          </div>
        </motion.div>

        {/* Title animation with enhanced typography */}
        {showText && (
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
              <motion.span 
                className="bg-gradient-to-r from-cyan-300 to-blue-500 text-transparent bg-clip-text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                Interview
              </motion.span>{" "}
              <motion.span
                className="text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                Buddy AI
              </motion.span>
            </h1>
            <motion.p 
              className="text-lg text-gray-300 mb-8 max-w-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.5 }}
            >
              Your AI-powered interview preparation companion for acing tech interviews
            </motion.p>
          </motion.div>
        )}

        {/* Enhanced progress bar with glow effect */}
        <div className="w-72 md:w-96 bg-gray-800/50 backdrop-blur-sm rounded-full h-3 mb-4 overflow-hidden shadow-inner">
          <motion.div 
            className="h-full rounded-full"
            style={{ 
              background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)',
              boxShadow: '0 0 10px rgba(139, 92, 246, 0.7)'
            }}
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: "easeInOut" }}
          />
        </div>
        
        <motion.p 
          className="text-sm text-gray-300 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {progress < 30 ? 'Loading resources...' : 
           progress < 60 ? 'Initializing AI modules...' : 
           progress < 90 ? 'Preparing interview materials...' : 'Ready!'}
        </motion.p>

        {/* Flying code elements with improved visuals */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute font-mono"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                scale: 0,
                rotate: Math.random() * 360
              }}
              animate={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                scale: [0, 1, 0],
                rotate: Math.random() * 360
              }}
              transition={{
                duration: Math.random() * 5 + 5,
                repeat: Infinity,
                repeatType: "loop",
                delay: Math.random() * 5,
                ease: "easeInOut"
              }}
              style={{
                fontSize: `${Math.random() * 20 + 10}px`,
                color: `hsl(${Math.random() * 60 + 200}, 70%, 75%)`,
                textShadow: '0 0 5px rgba(0, 150, 255, 0.7)',
                opacity: Math.random() * 0.4 + 0.1
              }}
            >
              {['{}', '[]', '()', '<>', '//', '/*', '*/', '===', '=>', 'function', 'class', 'import', 'export', 'const', 'let', '+', '-', '*', '/', '%'][Math.floor(Math.random() * 20)]}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
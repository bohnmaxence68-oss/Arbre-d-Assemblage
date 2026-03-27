/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  addEdge,
  Background,
  Controls,
  Connection,
  Edge,
  Node,
  useNodesState,
  useEdgesState,
  Panel,
  ReactFlowProvider,
  useReactFlow,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { v4 as uuidv4 } from 'uuid';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Plus, Download, Trash2, Layout, FileImage, FileText, Search, FileJson } from 'lucide-react';
import { FoundryItem } from './types';
import { PartNode, OperationNode } from './components/CustomNodes';
import { getLayoutedElements } from './lib/layout';
import { getAssemblyMethodsSuggestions } from './services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { ConfirmDialog } from './components/ConfirmDialog';

const nodeTypes = {
  part: PartNode,
  operation: OperationNode,
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [library, setLibrary] = useState<FoundryItem[]>([]);
  const [newItem, setNewItem] = useState<Partial<FoundryItem>>({
    qte: 1,
    label: '',
    repere: '',
  });
  const [excelPaste, setExcelPaste] = useState('');
  const [customOp, setCustomOp] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [librarySearch, setLibrarySearch] = useState('');

  const standardOperations = [
    'SOUDURE TIG',
    'SOUDURE MIG',
    'SOUDURE MAG',
    'SOUDURE ARC',
    'RIVETAGE',
    'BOULONNAGE',
    'COLLAGE'
  ];

  const { screenToFlowPosition, fitView } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-save & Restore logic
  const stateRef = useRef({ nodes, edges, library });
  useEffect(() => {
    stateRef.current = { nodes, edges, library };
  }, [nodes, edges, library]);

  useEffect(() => {
    const savedState = localStorage.getItem('foundry-tree-state');
    if (savedState) {
      try {
        const { nodes: savedNodes, edges: savedEdges, library: savedLibrary } = JSON.parse(savedState);
        
        // Re-attach functions to nodes
        const restoredNodes = savedNodes.map((node: Node) => ({
          ...node,
          data: {
            ...node.data,
            onChange: (newData: any) => {
              setNodes((nds) =>
                nds.map((n) =>
                  n.id === node.id ? { ...n, data: { ...n.data, ...newData } } : n
                )
              );
            },
            onDelete: () => {
              setNodes((nds) => nds.filter((n) => n.id !== node.id));
            }
          }
        }));

        setNodes(restoredNodes);
        setEdges(savedEdges);
        if (savedLibrary) setLibrary(savedLibrary);
        
        // Small delay to ensure React Flow is ready
        setTimeout(() => fitView(), 100);
      } catch (e) {
        console.error('Failed to restore state', e);
      }
    }
  }, [setNodes, setEdges, setLibrary, fitView]);

  useEffect(() => {
    const interval = setInterval(() => {
      const { nodes: n, edges: e, library: l } = stateRef.current;
      // Skip saving if everything is empty to avoid overwriting on initial load
      if (n.length === 0 && e.length === 0 && l.length === 0) return;

      const stateToSave = {
        nodes: n.map(({ data, ...node }) => {
          // Strip functions from data before saving
          const { onChange, onDelete, ...cleanData } = data as any;
          return { ...node, data: cleanData };
        }),
        edges: e,
        library: l
      };
      localStorage.setItem('foundry-tree-state', JSON.stringify(stateToSave));
      showToast('Sauvegarde automatique effectuée');
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: Edge = {
        ...params,
        id: uuidv4(),
        type: 'step',
        animated: false,
        style: { strokeWidth: 2, stroke: '#1e293b' },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#1e293b',
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const onEdgeDoubleClick = useCallback((_event: React.MouseEvent, edge: Edge) => {
    const newLabel = prompt('Annotation de liaison (ex: Soudure continue, Pointage...) :', (edge.label as string) || '');
    if (newLabel !== null) {
      setEdges((eds) =>
        eds.map((e) => 
          e.id === edge.id 
            ? { 
                ...e, 
                label: newLabel,
                labelStyle: { fill: '#1e293b', fontWeight: 700, fontSize: 10, textTransform: 'uppercase' as const },
                labelBgStyle: { fill: '#f1f5f9', fillOpacity: 0.9 },
                labelBgPadding: [6, 3] as [number, number],
                labelBgBorderRadius: 4,
              } 
            : e
        )
      );
      showToast('Annotation mise à jour');
    }
  }, [setEdges]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const onLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges
    );
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
    setTimeout(() => fitView(), 50);
  }, [nodes, edges, setNodes, setEdges, fitView]);

  const handleNewProject = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Nouveau Projet',
      message: 'Êtes-vous sûr de vouloir effacer tout le canvas ? Cette action est irréversible.',
      onConfirm: () => {
        setNodes([]);
        setEdges([]);
        localStorage.removeItem('foundry-tree-state');
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        showToast('Projet réinitialisé');
      }
    });
  };

  const handleDeleteLibraryItem = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Supprimer l\'article',
      message: 'Voulez-vous vraiment supprimer cet article de la bibliothèque ?',
      onConfirm: () => {
        setLibrary(prev => prev.filter(item => item.id !== id));
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        showToast('Article supprimé');
      }
    });
  };

  const addToLibrary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.label || !newItem.repere) {
      showToast('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }
    const item: FoundryItem = {
      id: uuidv4(),
      label: newItem.label,
      repere: newItem.repere,
      qte: newItem.qte || 1,
      methodBefore: '',
      children: [],
    };
    setLibrary([...library, item]);
    setNewItem({ qte: 1, label: '', repere: '' });
    showToast('Article ajouté à la bibliothèque');
  };

  const handleExcelImport = () => {
    if (!excelPaste.trim()) return;
    
    // Excel paste format: repere \t label \t qte
    const lines = excelPaste.trim().split('\n');
    const newItems: FoundryItem[] = [];
    
    lines.forEach(line => {
      const [rep, name, quantity] = line.split('\t');
      if (rep && name) {
        newItems.push({
          id: uuidv4(),
          repere: rep.trim(),
          label: name.trim(),
          qte: parseInt(quantity?.trim() || '1'),
          methodBefore: '',
          children: []
        });
      }
    });

    if (newItems.length > 0) {
      setLibrary(prev => [...prev, ...newItems]);
      setExcelPaste('');
      showToast(`${newItems.length} articles importés`);
    } else {
      showToast('Format invalide (utilisez: Repère [TAB] Nom [TAB] Quantité)', 'error');
    }
  };

  const onDragStart = (event: React.DragEvent, type: 'article' | 'operation', data: any) => {
    event.dataTransfer.setData('application/reactflow/type', type);
    event.dataTransfer.setData('application/reactflow/data', JSON.stringify(data));
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow/type');
      const dataStr = event.dataTransfer.getData('application/reactflow/data');
      
      if (!type || !dataStr) return;

      const data = JSON.parse(dataStr);
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      if (type === 'article') {
        const item: FoundryItem = data;
        const nodeId = uuidv4();
        const newNode: Node = {
          id: nodeId,
          type: 'part',
          position,
          data: { 
            label: item.label, 
            repere: item.repere, 
            qte: item.qte, 
            onChange: (newData: any) => {
              setNodes((nds) => 
                nds.map((node) => 
                  node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node
                )
              );
            },
            onDelete: () => {
              setNodes((nds) => nds.filter((node) => node.id !== nodeId));
            }
          },
        };
        setNodes((nds) => nds.concat(newNode));
      } else if (type === 'operation') {
        const opId = uuidv4();
        const newNode: Node = {
          id: opId,
          type: 'operation',
          position,
          data: { 
            method: data,
            label: 'ASSEMBLAGE',
            qte: 1,
            onChange: (newData: any) => {
              setNodes((nds) => 
                nds.map((node) => 
                  node.id === opId ? { ...node, data: { ...node.data, ...newData } } : node
                )
              );
            },
            onDelete: () => {
              setNodes((nds) => nds.filter((node) => node.id !== opId));
            }
          },
        };
        setNodes((nds) => nds.concat(newNode));
      }
    },
    [screenToFlowPosition, setNodes]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const exportPng = async () => {
    if (reactFlowWrapper.current === null) return;
    const dataUrl = await toPng(reactFlowWrapper.current, {
      backgroundColor: '#f8fafc',
      quality: 1,
      pixelRatio: 2,
    });
    const link = document.createElement('a');
    link.download = 'arbre-assemblage.png';
    link.href = dataUrl;
    link.click();
  };

  const exportPdf = async () => {
    if (reactFlowWrapper.current === null) return;
    const dataUrl = await toPng(reactFlowWrapper.current, {
      backgroundColor: '#f8fafc',
      quality: 1,
      pixelRatio: 2,
    });
    const pdf = new jsPDF('l', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(dataUrl);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.setFontSize(16);
    pdf.text("Arbre d'Assemblage de Chaudronnerie", 10, 15);
    pdf.addImage(dataUrl, 'PNG', 0, 25, pdfWidth, pdfHeight);
    pdf.save('arbre-assemblage.pdf');
  };

  const exportJson = () => {
    const { nodes: n, edges: e, library: l } = stateRef.current;
    const data = {
      nodes: n.map(({ data, ...node }) => {
        const { onChange, onDelete, ...cleanData } = data as any;
        return { ...node, data: cleanData };
      }),
      edges: e,
      library: l,
      exportedAt: new Date().toISOString(),
      version: "1.0"
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `projet-chaudronnerie-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Export JSON réussi');
  };

  const importJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const { nodes: savedNodes, edges: savedEdges, library: savedLibrary } = JSON.parse(content);
        
        // Re-attach functions to nodes
        const restoredNodes = savedNodes.map((node: Node) => ({
          ...node,
          data: {
            ...node.data,
            onChange: (newData: any) => {
              setNodes((nds) =>
                nds.map((n) =>
                  n.id === node.id ? { ...n, data: { ...n.data, ...newData } } : n
                )
              );
            },
            onDelete: () => {
              setNodes((nds) => nds.filter((n) => n.id !== node.id));
            }
          }
        }));

        setNodes(restoredNodes);
        setEdges(savedEdges);
        if (savedLibrary) setLibrary(savedLibrary);
        
        showToast('Import JSON réussi');
        setTimeout(() => fitView(), 100);
      } catch (err) {
        console.error('Failed to import JSON', err);
        showToast('Erreur lors de l\'importation du fichier JSON', 'error');
      }
    };
    reader.readAsText(file);
    // Reset input value to allow importing the same file again
    event.target.value = '';
  };

  const handleSearchSuggestions = async () => {
    if (!newItem.label) return;
    setIsSearching(true);
    try {
      const results = await getAssemblyMethodsSuggestions(newItem.label);
      setSuggestions(results);
      showToast('Suggestions récupérées');
    } catch (error) {
      console.error(error);
      showToast('Erreur lors de la récupération des suggestions', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 border-r border-slate-200 bg-white flex flex-col shadow-xl z-10">
        <div className="p-6 border-bottom border-slate-100">
          <h1 className="text-xl font-black tracking-tighter uppercase italic text-slate-800">
            Foundry<span className="text-orange-600">Tree</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest mt-1">
            Méthodes & Assemblage v1.0
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Form */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
              <Plus size={14} /> Nouvel Article
            </h2>
            <form onSubmit={addToLibrary} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Repère</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    placeholder="1.1.2"
                    value={newItem.repere}
                    onChange={(e) => setNewItem({ ...newItem, repere: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Quantité</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    value={newItem.qte}
                    onChange={(e) => setNewItem({ ...newItem, qte: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Désignation</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  placeholder="ex: Virola, Fond BOM..."
                  value={newItem.label}
                  onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-slate-900 text-white rounded font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
              >
                Ajouter
              </button>
            </form>
          </section>

          {/* Excel Import */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
              <FileText size={14} /> Import Excel
            </h2>
            <div className="space-y-3">
              <textarea
                className="w-full h-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded text-[10px] font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none"
                placeholder="Collez ici (Repère [TAB] Nom [TAB] Qté)"
                value={excelPaste}
                onChange={(e) => setExcelPaste(e.target.value)}
              />
              <button
                onClick={handleExcelImport}
                className="w-full py-2 bg-slate-100 text-slate-700 rounded font-bold text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Importer la sélection
              </button>
            </div>
          </section>

          {/* Standard Operations */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
              <Search size={14} /> Opérations
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {standardOperations.map((op) => (
                  <div
                    key={op}
                    draggable
                    onDragStart={(e) => onDragStart(e, 'operation', op)}
                    className="px-2 py-1.5 bg-orange-50 border border-orange-200 rounded text-[9px] font-bold text-orange-700 text-center cursor-grab active:cursor-grabbing hover:bg-orange-100 transition-colors"
                  >
                    {op}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-[10px] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  placeholder="Opération personnalisée..."
                  value={customOp}
                  onChange={(e) => setCustomOp(e.target.value)}
                />
                <div
                  draggable={!!customOp}
                  onDragStart={(e) => onDragStart(e, 'operation', customOp)}
                  className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${
                    customOp 
                      ? 'bg-orange-500 text-white cursor-grab active:cursor-grabbing shadow-md' 
                      : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                  }`}
                >
                  Drag
                </div>
              </div>
            </div>
          </section>

          {/* Library List */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Layout size={14} /> Bibliothèque
              </h2>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                {library.length} ART.
              </span>
            </div>

            <div className="mb-4 relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded text-[10px] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                placeholder="Filtrer par repère ou nom..."
                value={librarySearch}
                onChange={(e) => setLibrarySearch(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <AnimatePresence>
                {library.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Aucun article créé.</p>
                ) : library.filter(item => 
                    item.label.toLowerCase().includes(librarySearch.toLowerCase()) || 
                    item.repere.toLowerCase().includes(librarySearch.toLowerCase())
                  ).length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Aucun résultat pour "{librarySearch}".</p>
                ) : (
                  library
                    .filter(item => 
                      item.label.toLowerCase().includes(librarySearch.toLowerCase()) || 
                      item.repere.toLowerCase().includes(librarySearch.toLowerCase())
                    )
                    .map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        draggable
                        onDragStart={(e) => onDragStart(e, 'article', item)}
                        className="p-3 bg-white border border-slate-200 rounded shadow-sm cursor-grab active:cursor-grabbing hover:border-orange-500 transition-colors group"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-bold text-slate-800 uppercase">{item.label}</p>
                            <p className="text-[10px] text-slate-400 font-mono">REP: {item.repere}</p>
                          </div>
                          <span className="text-[8px] px-1.5 py-0.5 rounded font-bold bg-slate-50 text-slate-500">
                            QTÉ: {item.qte}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-end">
                          <button 
                            onClick={() => handleDeleteLibraryItem(item.id)}
                            className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </motion.div>
                    ))
                )}
              </AnimatePresence>
            </div>
          </section>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        {/* Toolbar */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 z-10 shadow-sm">
          <div className="flex items-center gap-6">
            <button
              onClick={handleNewProject}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-red-600 transition-colors"
            >
              <Trash2 size={16} /> Nouveau Projet
            </button>
            <button
              onClick={onLayout}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-orange-600 transition-colors"
            >
              <Layout size={16} /> Auto-Layout
            </button>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={importJson}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded text-xs font-bold uppercase tracking-widest hover:bg-slate-200 transition-all"
            >
              <Download size={16} /> Import JSON
            </button>
            <button
              onClick={exportPng}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded text-xs font-bold uppercase tracking-widest hover:bg-slate-200 transition-all"
            >
              <FileImage size={16} /> PNG
            </button>
            <button
              onClick={exportPdf}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded text-xs font-bold uppercase tracking-widest hover:bg-orange-700 transition-all shadow-md"
            >
              <FileText size={16} /> PDF (A4)
            </button>
            <button
              onClick={exportJson}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded text-xs font-bold uppercase tracking-widest hover:bg-slate-900 transition-all shadow-md"
            >
              <FileJson size={16} /> JSON
            </button>
          </div>
        </header>

        {/* Canvas */}
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgeDoubleClick={onEdgeDoubleClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            defaultEdgeOptions={{
              type: 'step',
              style: { strokeWidth: 2, stroke: '#1e293b' },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#1e293b' },
            }}
          >
            <Background color="#cbd5e1" gap={20} />
            <Controls />
            <Panel position="bottom-right" className="bg-white/80 backdrop-blur p-2 rounded border border-slate-200 text-[10px] font-mono text-slate-500 shadow-sm">
              DRAG & DROP DEPUIS LA BIBLIOTHÈQUE
            </Panel>
          </ReactFlow>
        </div>
      </main>

      {/* Custom Dialogs & Toasts */}
      <ConfirmDialog
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl z-[110] text-xs font-bold uppercase tracking-widest flex items-center gap-3 ${
              toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PhotoIcon,
  DocumentTextIcon,
  CursorArrowRaysIcon,
  SwatchIcon,
  AdjustmentsHorizontalIcon,
  Square3Stack3DIcon,
  MagnifyingGlassIcon,
  DocumentDuplicateIcon,
  TicketIcon,
  UserGroupIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

const TicketTemplates = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showDesigner, setShowDesigner] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [templateAssignments, setTemplateAssignments] = useState([]);
  const [designerMode, setDesignerMode] = useState('select'); // select, text, image, shape
  const [selectedElement, setSelectedElement] = useState(null);
  const [canvasElements, setCanvasElements] = useState([]);
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 600 });
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const fileInputRef = useRef(null);
  const [showRulers, setShowRulers] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [gridSize, setGridSize] = useState(10);
  const [formData, setFormData] = useState({
    name: '',
    design: {
      headerText: 'LOTTERY TICKET',
      footerText: 'Good Luck!',
      backgroundColor: '#ffffff',
      textColor: '#000000',
      fontSize: '12px',
      logoUrl: '',
      elements: [],
      canvasSize: { width: 400, height: 600 }
    }
  });
  const [templateType, setTemplateType] = useState('standard'); // 'standard' or 'mobile'

  // Dynamic data fields available for tickets
  const dynamicFields = useMemo(() => [
    { id: 'ticketNumber', label: 'Ticket Number', sample: '12345678901234567' },
    { id: 'drawTime', label: 'Draw Time', sample: '14:00' },
    { id: 'drawDate', label: 'Draw Date', sample: '2025/09/16 Tue 14:00' },
    { id: 'betNumbers', label: 'Bet Numbers', sample: '123, 456, 789' },
    { id: 'betType', label: 'Bet Type', sample: 'Standard' },
    { id: 'betAmount', label: 'Bet Amount', sample: '₱10.00' },
    { id: 'totalBet', label: 'Total Bet', sample: '₱50.00' },
    { id: 'agentName', label: 'Agent Name', sample: 'Juan Dela Cruz' },
    { id: 'timestamp', label: 'Timestamp', sample: '2025/09/16 Tue 14:00' },
    { id: 'qrCode', label: 'QR Code', sample: 'https://quickchart.io/qr?text=sample' },
    { id: 'barcode', label: 'Barcode', sample: '|||12345678|||' },
    { id: 'betCount', label: 'Bet Count', sample: '3' },
    { id: 'allBets', label: 'All Bets Detail', sample: 'Standard                                                                                        1    2    3\nA                                                                                                    Price: ₱10.00\n\nRambolito                                                                                        4   5   6 \nB                                                                                                     Price: ₱20.00' },
    { id: 'bet1Type', label: 'Bet 1 Type', sample: 'Standard' },
    { id: 'bet1Numbers', label: 'Bet 1 Numbers', sample: '1    2    3' },
    { id: 'bet1Sequence', label: 'Bet 1 Sequence', sample: 'A' },
    { id: 'bet1Price', label: 'Bet 1 Price', sample: 'Price: ₱10.00' },
    { id: 'bet2Type', label: 'Bet 2 Type', sample: 'Rambolito' },
    { id: 'bet2Numbers', label: 'Bet 2 Numbers', sample: '4   5   6' },
    { id: 'bet2Sequence', label: 'Bet 2 Sequence', sample: 'B' },
    { id: 'bet2Price', label: 'Bet 2 Price', sample: 'Price: ₱20.00' },
    { id: 'bet3Type', label: 'Bet 3 Type', sample: 'Standard' },
    { id: 'bet3Numbers', label: 'Bet 3 Numbers', sample: '7   8   9' },
    { id: 'bet3Sequence', label: 'Bet 3 Sequence', sample: 'C' },
    { id: 'bet3Price', label: 'Bet 3 Price', sample: 'Price: ₱15.00' },
    { id: 'bet4Type', label: 'Bet 4 Type', sample: 'Rambolito' },
    { id: 'bet4Numbers', label: 'Bet 4 Numbers', sample: '1   4   7' },
    { id: 'bet4Sequence', label: 'Bet 4 Sequence', sample: 'D' },
    { id: 'bet4Price', label: 'Bet 4 Price', sample: 'Price: ₱25.00' },
    { id: 'bet5Type', label: 'Bet 5 Type', sample: 'Standard' },
    { id: 'bet5Numbers', label: 'Bet 5 Numbers', sample: '2   5   8' },
    { id: 'bet5Sequence', label: 'Bet 5 Sequence', sample: 'E' },
    { id: 'bet5Price', label: 'Bet 5 Price', sample: 'Price: ₱12.00' },
    { id: 'bet6Type', label: 'Bet 6 Type', sample: 'Rambolito' },
    { id: 'bet6Numbers', label: 'Bet 6 Numbers', sample: '3   6   9' },
    { id: 'bet6Sequence', label: 'Bet 6 Sequence', sample: 'F' },
    { id: 'bet6Price', label: 'Bet 6 Price', sample: 'Price: ₱18.00' },
    { id: 'bet7Type', label: 'Bet 7 Type', sample: 'Standard' },
    { id: 'bet7Numbers', label: 'Bet 7 Numbers', sample: '1   2   3' },
    { id: 'bet7Sequence', label: 'Bet 7 Sequence', sample: 'G' },
    { id: 'bet7Price', label: 'Bet 7 Price', sample: 'Price: ₱14.00' },
    { id: 'bet8Type', label: 'Bet 8 Type', sample: 'Rambolito' },
    { id: 'bet8Numbers', label: 'Bet 8 Numbers', sample: '4   5   6' },
    { id: 'bet8Sequence', label: 'Bet 8 Sequence', sample: 'H' },
    { id: 'bet8Price', label: 'Bet 8 Price', sample: 'Price: ₱22.00' },
    { id: 'bet9Type', label: 'Bet 9 Type', sample: 'Standard' },
    { id: 'bet9Numbers', label: 'Bet 9 Numbers', sample: '7   8   9' },
    { id: 'bet9Sequence', label: 'Bet 9 Sequence', sample: 'I' },
    { id: 'bet9Price', label: 'Bet 9 Price', sample: 'Price: ₱16.00' },
    { id: 'bet10Type', label: 'Bet 10 Type', sample: 'Rambolito' },
    { id: 'bet10Numbers', label: 'Bet 10 Numbers', sample: '1   5   9' },
    { id: 'bet10Sequence', label: 'Bet 10 Sequence', sample: 'J' },
    { id: 'bet10Price', label: 'Bet 10 Price', sample: 'Price: ₱30.00' }
  ], []);

  useEffect(() => {
    fetchTemplates();
    fetchUsers();
    fetchTemplateAssignments();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/ticket-templates');
      setTemplates(response.data.data || []);
    } catch (err) {
      setError('Failed to fetch ticket templates');
      console.error('Error fetching templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchTemplateAssignments = async () => {
    try {
      const response = await api.get('/ticket-templates/assignments');
      setTemplateAssignments(response.data.data || []);
    } catch (err) {
      console.error('Error fetching template assignments:', err);
    }
  };

  const toggleActiveTemplate = async (templateId) => {
    try {
      await api.put(`/ticket-templates/${templateId}/toggle-active`);
      fetchTemplates();
    } catch (err) {
      setError('Failed to update template status');
      console.error('Error toggling template status:', err);
    }
  };

  const openAssignModal = (template) => {
    setSelectedTemplate(template);
    setShowAssignModal(true);
  };

  const handleAssignTemplate = async (userId, templateId) => {
    try {
      await api.post('/ticket-templates/assign', {
        userId,
        templateId
      });
      fetchTemplateAssignments();
    } catch (err) {
      setError('Failed to assign template');
      console.error('Error assigning template:', err);
    }
  };

  const handleUnassignTemplate = async (assignmentId) => {
    try {
      await api.delete(`/ticket-templates/assignments/${assignmentId}`);
      fetchTemplateAssignments();
    } catch (err) {
      setError('Failed to unassign template');
      console.error('Error unassigning template:', err);
    }
  };

  // Canvas and Designer Functions
  const generateElementId = () => {
    return 'element_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  };

  const addTextElement = useCallback((x = 50, y = 50) => {
    const newElement = {
      id: generateElementId(),
      type: 'text',
      content: 'Sample Text',
      x,
      y,
      width: 150,
      height: 30,
      style: {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#000000',
        fontWeight: 'normal',
        textAlign: 'left',
        letterSpacing: '0px',
        backgroundColor: 'transparent',
        border: 'none',
        padding: '4px'
      },
      zIndex: canvasElements.length + 1
    };
    setCanvasElements(prev => [...prev, newElement]);
    setSelectedElement(newElement.id);
  }, [canvasElements.length]);

  const addDynamicField = useCallback((fieldId, x = 50, y = 50) => {
    const field = dynamicFields.find(f => f.id === fieldId);
    if (!field) return;

    const newElement = {
      id: generateElementId(),
      type: 'dynamic',
      fieldId: fieldId,
      content: field.sample,
      label: field.label,
      x,
      y,
      width: 150,
      height: 30,
      style: {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#000000',
        fontWeight: 'normal',
        textAlign: 'left',
        letterSpacing: '0px',
        backgroundColor: 'transparent',
        border: '1px solid #ccc',
        padding: '4px'
      },
      zIndex: canvasElements.length + 1
    };
    setCanvasElements(prev => [...prev, newElement]);
    setSelectedElement(newElement.id);
  }, [canvasElements.length, dynamicFields]);

  const addImageElement = useCallback((x = 50, y = 50, src = '') => {
    const newElement = {
      id: generateElementId(),
      type: 'image',
      src: src,
      alt: 'Image',
      x,
      y,
      width: 100,
      height: 100,
      style: {
        border: '1px solid #ccc',
        borderRadius: '0px'
      },
      zIndex: canvasElements.length + 1
    };
    setCanvasElements(prev => [...prev, newElement]);
    setSelectedElement(newElement.id);
  }, [canvasElements.length]);

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        addImageElement(50, 50, event.target.result);
      };
      reader.readAsDataURL(file);
    }
    // Reset file input
    e.target.value = '';
  }, [addImageElement]);

  const addShapeElement = useCallback((shapeType = 'rectangle', x = 50, y = 50) => {
    const newElement = {
      id: generateElementId(),
      type: 'shape',
      shapeType,
      x,
      y,
      width: 100,
      height: 100,
      style: {
        backgroundColor: '#f0f0f0',
        border: '1px solid #000000',
        borderRadius: shapeType === 'circle' ? '50%' : '0px'
      },
      zIndex: canvasElements.length + 1
    };
    setCanvasElements(prev => [...prev, newElement]);
    setSelectedElement(newElement.id);
  }, [canvasElements.length]);

  const updateElement = useCallback((elementId, updates) => {
    setCanvasElements(prev => prev.map(el => 
      el.id === elementId ? { ...el, ...updates } : el
    ));
  }, []);

  const deleteElement = useCallback((elementId) => {
    setCanvasElements(prev => prev.filter(el => el.id !== elementId));
    if (selectedElement === elementId) {
      setSelectedElement(null);
    }
  }, [selectedElement]);

  const duplicateElement = useCallback((elementId) => {
    const element = canvasElements.find(el => el.id === elementId);
    if (!element) return;

    const newElement = {
      ...element,
      id: generateElementId(),
      x: element.x + 20,
      y: element.y + 20,
      zIndex: canvasElements.length + 1
    };
    setCanvasElements(prev => [...prev, newElement]);
    setSelectedElement(newElement.id);
  }, [canvasElements]);

  const handleCanvasClick = useCallback((e) => {
    if (designerMode === 'select') {
      setSelectedElement(null);
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    switch (designerMode) {
      case 'text':
        addTextElement(x, y);
        break;
      case 'image':
        addImageElement(x, y);
        break;
      case 'shape':
        addShapeElement('rectangle', x, y);
        break;
      default:
        break;
    }
  }, [designerMode, zoom, addTextElement, addImageElement, addShapeElement]);

  const handleElementClick = useCallback((e, elementId) => {
    e.stopPropagation();
    setSelectedElement(elementId);
  }, []);

  const handleElementMouseDown = useCallback((e, elementId) => {
    e.stopPropagation();
    if (designerMode !== 'select') return;

    // Check if clicking on a resize handle
    if (e.target.classList.contains('resize-handle')) {
      setIsResizing(true);
      setResizeHandle(e.target.dataset.handle);
      return;
    }

    setSelectedElement(elementId);
    setIsDragging(true);
    
    const rect = canvasRef.current.getBoundingClientRect();
    const element = canvasElements.find(el => el.id === elementId);
    if (element) {
      setDragOffset({
        x: (e.clientX - rect.left) / zoom - element.x,
        y: (e.clientY - rect.top) / zoom - element.y
      });
    }
  }, [designerMode, zoom, canvasElements]);

  const handleMouseMove = useCallback((e) => {
    if (isDragging && selectedElement) {
      const rect = canvasRef.current.getBoundingClientRect();
      let x = (e.clientX - rect.left) / zoom - dragOffset.x;
      let y = (e.clientY - rect.top) / zoom - dragOffset.y;

      // Snap to grid if enabled
      if (snapToGrid) {
        x = Math.round(x / gridSize) * gridSize;
        y = Math.round(y / gridSize) * gridSize;
      }

      updateElement(selectedElement, { x: Math.max(0, x), y: Math.max(0, y) });
    } else if (isResizing && selectedElement && resizeHandle) {
      const rect = canvasRef.current.getBoundingClientRect();
      const element = canvasElements.find(el => el.id === selectedElement);
      if (!element) return;

      const mouseX = (e.clientX - rect.left) / zoom;
      const mouseY = (e.clientY - rect.top) / zoom;

      let newWidth = element.width;
      let newHeight = element.height;
      let newX = element.x;
      let newY = element.y;

      switch (resizeHandle) {
        case 'se': // bottom-right
          newWidth = Math.max(20, mouseX - element.x);
          newHeight = Math.max(20, mouseY - element.y);
          break;
        case 'ne': // top-right
          newWidth = Math.max(20, mouseX - element.x);
          newHeight = Math.max(20, element.y + element.height - mouseY);
          newY = Math.min(mouseY, element.y + element.height - 20);
          break;
        case 'nw': // top-left
          newWidth = Math.max(20, element.x + element.width - mouseX);
          newHeight = Math.max(20, element.y + element.height - mouseY);
          newX = Math.min(mouseX, element.x + element.width - 20);
          newY = Math.min(mouseY, element.y + element.height - 20);
          break;
        case 'sw': // bottom-left
          newWidth = Math.max(20, element.x + element.width - mouseX);
          newHeight = Math.max(20, mouseY - element.y);
          newX = Math.min(mouseX, element.x + element.width - 20);
          break;
        default:
          break;
      }

      updateElement(selectedElement, {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight
      });
    }
  }, [isDragging, isResizing, selectedElement, zoom, dragOffset, resizeHandle, canvasElements, updateElement, snapToGrid, gridSize]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  // Arrow key controls for precise placement
  const handleKeyDown = useCallback((e) => {
    if (!selectedElement) return;
    
    const moveAmount = e.shiftKey ? 10 : 1; // Shift + arrow = 10px, normal arrow = 1px
    let newX = null;
    let newY = null;
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        newX = Math.max(0, canvasElements.find(el => el.id === selectedElement).x - moveAmount);
        break;
      case 'ArrowRight':
        e.preventDefault();
        const element = canvasElements.find(el => el.id === selectedElement);
        newX = Math.min(canvasSize.width - element.width, element.x + moveAmount);
        break;
      case 'ArrowUp':
        e.preventDefault();
        newY = Math.max(0, canvasElements.find(el => el.id === selectedElement).y - moveAmount);
        break;
      case 'ArrowDown':
        e.preventDefault();
        const elementDown = canvasElements.find(el => el.id === selectedElement);
        newY = Math.min(canvasSize.height - elementDown.height, elementDown.y + moveAmount);
        break;
      default:
        return;
    }
    
    if (newX !== null || newY !== null) {
      const updates = {};
      if (newX !== null) {
        // Snap to grid if enabled
        if (snapToGrid) {
          newX = Math.round(newX / gridSize) * gridSize;
        }
        updates.x = newX;
      }
      if (newY !== null) {
        // Snap to grid if enabled
        if (snapToGrid) {
          newY = Math.round(newY / gridSize) * gridSize;
        }
        updates.y = newY;
      }
      updateElement(selectedElement, updates);
    }
  }, [selectedElement, canvasElements, canvasSize, updateElement, snapToGrid, gridSize]);

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // Add keyboard event listener for arrow keys
  useEffect(() => {
    if (showDesigner) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [showDesigner, handleKeyDown]);

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/ticket-templates', formData);
      setShowCreateModal(false);
      setFormData({
        name: '',
        design: {
          headerText: 'LOTTERY TICKET',
          footerText: 'Good Luck!',
          backgroundColor: '#ffffff',
          textColor: '#000000',
          fontSize: '12px',
          logoUrl: ''
        }
      });
      fetchTemplates();
    } catch (err) {
      setError('Failed to create template');
      console.error('Error creating template:', err);
    }
  };

  const handleEditTemplate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/ticket-templates/${selectedTemplate.id}`, formData);
      setShowEditModal(false);
      setSelectedTemplate(null);
      fetchTemplates();
    } catch (err) {
      setError('Failed to update template');
      console.error('Error updating template:', err);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await api.delete(`/ticket-templates/${templateId}`);
        fetchTemplates();
      } catch (err) {
        setError('Failed to delete template');
        console.error('Error deleting template:', err);
      }
    }
  };

  const openEditModal = (template) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      design: template.design
    });
    setShowEditModal(true);
  };

  const createModernTemplate = () => {
    const modernElements = [
      // Header with gradient background
      {
        id: 'header-bg',
        type: 'shape',
        shapeType: 'rectangle',
        x: 0,
        y: 0,
        width: 400,
        height: 80,
        style: {
          backgroundColor: '#1e40af',
          border: 'none',
          borderRadius: '0px'
        },
        zIndex: 1
      },
      // Lottery title
      {
        id: 'lottery-title',
        type: 'text',
        content: '3D LOTTO',
        x: 200,
        y: 25,
        width: 200,
        height: 30,
        style: {
          fontSize: '24px',
          fontFamily: 'Arial',
          color: '#ffffff',
          fontWeight: 'bold',
          textAlign: 'center',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      // Subtitle
      {
        id: 'lottery-subtitle',
        type: 'text',
        content: 'Official Lottery Ticket',
        x: 200,
        y: 50,
        width: 200,
        height: 20,
        style: {
          fontSize: '12px',
          fontFamily: 'Arial',
          color: '#e0e7ff',
          fontWeight: 'normal',
          textAlign: 'center',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      // Ticket number section
      {
        id: 'ticket-number-bg',
        type: 'shape',
        shapeType: 'rectangle',
        x: 20,
        y: 100,
        width: 360,
        height: 40,
        style: {
          backgroundColor: '#f8fafc',
          border: '2px solid #e2e8f0',
          borderRadius: '8px'
        },
        zIndex: 1
      },
      {
        id: 'ticket-number-label',
        type: 'text',
        content: 'Ticket Number',
        x: 30,
        y: 105,
        width: 100,
        height: 15,
        style: {
          fontSize: '10px',
          fontFamily: 'Arial',
          color: '#64748b',
          fontWeight: 'bold',
          textAlign: 'left',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      {
        id: 'ticket-number-value',
        type: 'dynamic',
        fieldId: 'ticketNumber',
        content: '12345678901234567',
        label: 'Ticket Number',
        x: 30,
        y: 120,
        width: 340,
        height: 15,
        style: {
          fontSize: '14px',
          fontFamily: 'Arial',
          color: '#1e293b',
          fontWeight: 'bold',
          textAlign: 'left',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      // Draw information section
      {
        id: 'draw-info-bg',
        type: 'shape',
        shapeType: 'rectangle',
        x: 20,
        y: 160,
        width: 360,
        height: 50,
        style: {
          backgroundColor: '#fef3c7',
          border: '2px solid #f59e0b',
          borderRadius: '8px'
        },
        zIndex: 1
      },
      {
        id: 'draw-time-label',
        type: 'text',
        content: 'Draw Time',
        x: 30,
        y: 165,
        width: 100,
        height: 15,
        style: {
          fontSize: '10px',
          fontFamily: 'Arial',
          color: '#92400e',
          fontWeight: 'bold',
          textAlign: 'left',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      {
        id: 'draw-time-value',
        type: 'dynamic',
        fieldId: 'drawTime',
        content: '14:00',
        label: 'Draw Time',
        x: 30,
        y: 180,
        width: 100,
        height: 15,
        style: {
          fontSize: '16px',
          fontFamily: 'Arial',
          color: '#92400e',
          fontWeight: 'bold',
          textAlign: 'left',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      {
        id: 'draw-date-label',
        type: 'text',
        content: 'Draw Date',
        x: 200,
        y: 165,
        width: 100,
        height: 15,
        style: {
          fontSize: '10px',
          fontFamily: 'Arial',
          color: '#92400e',
          fontWeight: 'bold',
          textAlign: 'left',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      {
        id: 'draw-date-value',
        type: 'dynamic',
        fieldId: 'drawDate',
        content: '2025/09/16 Tue 14:00',
        label: 'Draw Date',
        x: 200,
        y: 180,
        width: 180,
        height: 15,
        style: {
          fontSize: '12px',
          fontFamily: 'Arial',
          color: '#92400e',
          fontWeight: 'bold',
          textAlign: 'left',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      // Bets section header
      {
        id: 'bets-header',
        type: 'text',
        content: 'Your Bets',
        x: 200,
        y: 230,
        width: 200,
        height: 20,
        style: {
          fontSize: '16px',
          fontFamily: 'Arial',
          color: '#1e293b',
          fontWeight: 'bold',
          textAlign: 'center',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      // Bet count
      {
        id: 'bet-count',
        type: 'dynamic',
        fieldId: 'betCount',
        content: '3',
        label: 'Bet Count',
        x: 20,
        y: 250,
        width: 360,
        height: 20,
        style: {
          fontSize: '12px',
          fontFamily: 'Arial',
          color: '#64748b',
          fontWeight: 'normal',
          textAlign: 'center',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      // All bets detail with new format
      {
        id: 'all-bets-detail',
        type: 'dynamic',
        fieldId: 'allBets',
        content: 'Standard                                                                                        1    2    3\nA                                                                                                    Price: ₱10.00\n\nRambolito                                                                                        4   5   6 \nB                                                                                                     Price: ₱20.00',
        label: 'All Bets Detail',
        x: 20,
        y: 280,
        width: 360,
        height: 80,
        style: {
          fontSize: '10px',
          fontFamily: 'Courier New',
          color: '#1e293b',
          fontWeight: 'normal',
          textAlign: 'left',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '4px',
          padding: '8px',
          lineHeight: '1.2'
        },
        zIndex: 2
      },
      // Total amount section
      {
        id: 'total-bg',
        type: 'shape',
        shapeType: 'rectangle',
        x: 20,
        y: 380,
        width: 360,
        height: 50,
        style: {
          backgroundColor: '#1e293b',
          border: 'none',
          borderRadius: '8px'
        },
        zIndex: 1
      },
      {
        id: 'total-label',
        type: 'text',
        content: 'Total Amount',
        x: 200,
        y: 390,
        width: 200,
        height: 15,
        style: {
          fontSize: '12px',
          fontFamily: 'Arial',
          color: '#e2e8f0',
          fontWeight: 'bold',
          textAlign: 'center',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      {
        id: 'total-value',
        type: 'dynamic',
        fieldId: 'totalBet',
        content: '₱50.00',
        label: 'Total Bet',
        x: 200,
        y: 405,
        width: 200,
        height: 20,
        style: {
          fontSize: '20px',
          fontFamily: 'Arial',
          color: '#ffffff',
          fontWeight: 'bold',
          textAlign: 'center',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      // Agent information
      {
        id: 'agent-info-bg',
        type: 'shape',
        shapeType: 'rectangle',
        x: 20,
        y: 450,
        width: 360,
        height: 40,
        style: {
          backgroundColor: '#f1f5f9',
          border: '1px solid #e2e8f0',
          borderRadius: '8px'
        },
        zIndex: 1
      },
      {
        id: 'agent-label',
        type: 'text',
        content: 'Agent',
        x: 30,
        y: 455,
        width: 100,
        height: 15,
        style: {
          fontSize: '10px',
          fontFamily: 'Arial',
          color: '#64748b',
          fontWeight: 'bold',
          textAlign: 'left',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      {
        id: 'agent-value',
        type: 'dynamic',
        fieldId: 'agentName',
        content: 'Juan Dela Cruz',
        label: 'Agent Name',
        x: 30,
        y: 470,
        width: 340,
        height: 15,
        style: {
          fontSize: '14px',
          fontFamily: 'Arial',
          color: '#1e293b',
          fontWeight: 'bold',
          textAlign: 'left',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      // QR Code section
      {
        id: 'qr-bg',
        type: 'shape',
        shapeType: 'rectangle',
        x: 150,
        y: 510,
        width: 100,
        height: 100,
        style: {
          backgroundColor: '#ffffff',
          border: '2px solid #e2e8f0',
          borderRadius: '8px'
        },
        zIndex: 1
      },
      {
        id: 'qr-code',
        type: 'dynamic',
        fieldId: 'qrCode',
        content: 'https://quickchart.io/qr?text=sample',
        label: 'QR Code',
        x: 150,
        y: 510,
        width: 100,
        height: 100,
        style: {
          fontSize: '8px',
          fontFamily: 'Arial',
          color: '#000000',
          fontWeight: 'normal',
          textAlign: 'center',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      // Footer
      {
        id: 'footer-text',
        type: 'text',
        content: 'Keep this ticket safe • Present for prize claims • Good luck!',
        x: 200,
        y: 620,
        width: 200,
        height: 15,
        style: {
          fontSize: '10px',
          fontFamily: 'Arial',
          color: '#64748b',
          fontWeight: 'normal',
          textAlign: 'center',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      }
    ];

    setSelectedTemplate(null);
    setFormData({
      name: 'Modern Multi-Bet Template',
      design: {
        elements: modernElements,
        canvasSize: { width: 400, height: 600 },
        backgroundColor: '#ffffff'
      }
    });
    setCanvasElements(modernElements);
    setCanvasSize({ width: 400, height: 600 });
    setShowDesigner(true);
    setDesignerMode('select');
    setSelectedElement(null);
  };

  const createMobileTemplate = () => {
    const mobileElements = [
      // Header for mobile (58mm width optimized)
      {
        id: 'mobile-header-bg',
        type: 'shape',
        shapeType: 'rectangle',
        x: 0,
        y: 0,
        width: 220, // 58mm = ~220px
        height: 40,
        style: {
          backgroundColor: '#1e40af',
          border: 'none',
          borderRadius: '0px'
        },
        zIndex: 1
      },
      {
        id: 'mobile-logo',
        type: 'text',
        content: '🎲 NEWBETTING',
        x: 110,
        y: 8,
        width: 220,
        height: 12,
        style: {
          fontSize: '12px',
          fontFamily: 'Courier New',
          color: '#ffffff',
          fontWeight: 'bold',
          textAlign: 'center',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      {
        id: 'mobile-title',
        type: 'text',
        content: '3D LOTTO TICKET',
        x: 110,
        y: 20,
        width: 220,
        height: 12,
        style: {
          fontSize: '11px',
          fontFamily: 'Courier New',
          color: '#ffffff',
          fontWeight: 'bold',
          textAlign: 'center',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      {
        id: 'mobile-ticket-number',
        type: 'text',
        content: '#',
        x: 110,
        y: 32,
        width: 220,
        height: 8,
        style: {
          fontSize: '9px',
          fontFamily: 'Courier New',
          color: '#ffffff',
          fontWeight: 'bold',
          textAlign: 'center',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      {
        id: 'mobile-ticket-number-value',
        type: 'dynamic',
        fieldId: 'ticketNumber',
        content: '12345678901234567',
        label: 'Ticket Number',
        x: 110,
        y: 40,
        width: 220,
        height: 8,
        style: {
          fontSize: '9px',
          fontFamily: 'Courier New',
          color: '#ffffff',
          fontWeight: 'bold',
          textAlign: 'center',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      // Draw info section
      {
        id: 'mobile-draw-info-bg',
        type: 'shape',
        shapeType: 'rectangle',
        x: 10,
        y: 55,
        width: 200,
        height: 25,
        style: {
          backgroundColor: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '4px'
        },
        zIndex: 1
      },
      {
        id: 'mobile-draw-time',
        type: 'dynamic',
        fieldId: 'drawTime',
        content: '14:00',
        label: 'Draw Time',
        x: 15,
        y: 60,
        width: 60,
        height: 10,
        style: {
          fontSize: '11px',
          fontFamily: 'Courier New',
          color: '#92400e',
          fontWeight: 'bold',
          textAlign: 'left',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      {
        id: 'mobile-draw-date',
        type: 'dynamic',
        fieldId: 'drawDate',
        content: '2025/09/16 Tue',
        label: 'Draw Date',
        x: 80,
        y: 60,
        width: 120,
        height: 10,
        style: {
          fontSize: '9px',
          fontFamily: 'Courier New',
          color: '#92400e',
          fontWeight: 'bold',
          textAlign: 'left',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      // Bet information
      {
        id: 'mobile-bet-info',
        type: 'dynamic',
        fieldId: 'allBets',
        content: 'Standard                                                                                        1    2    3\nA                                                                                                    Price: ₱10.00\n\nRambolito                                                                                        4   5   6 \nB                                                                                                     Price: ₱20.00',
        label: 'All Bets Detail',
        x: 10,
        y: 90,
        width: 200,
        height: 60,
        style: {
          fontSize: '10px',
          fontFamily: 'Courier New',
          color: '#1e293b',
          fontWeight: 'normal',
          textAlign: 'left',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '4px',
          padding: '4px',
          lineHeight: '1.2'
        },
        zIndex: 2
      },
      // Total amount
      {
        id: 'mobile-total-bg',
        type: 'shape',
        shapeType: 'rectangle',
        x: 10,
        y: 160,
        width: 200,
        height: 25,
        style: {
          backgroundColor: '#1e293b',
          border: 'none',
          borderRadius: '4px'
        },
        zIndex: 1
      },
      {
        id: 'mobile-total-label',
        type: 'text',
        content: 'TOTAL AMOUNT',
        x: 110,
        y: 165,
        width: 200,
        height: 8,
        style: {
          fontSize: '9px',
          fontFamily: 'Courier New',
          color: '#ffffff',
          fontWeight: 'bold',
          textAlign: 'center',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      {
        id: 'mobile-total-value',
        type: 'dynamic',
        fieldId: 'totalBet',
        content: '₱50.00',
        label: 'Total Bet',
        x: 110,
        y: 175,
        width: 200,
        height: 10,
        style: {
          fontSize: '14px',
          fontFamily: 'Courier New',
          color: '#ffffff',
          fontWeight: 'bold',
          textAlign: 'center',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      // Agent info
      {
        id: 'mobile-agent-bg',
        type: 'shape',
        shapeType: 'rectangle',
        x: 10,
        y: 195,
        width: 200,
        height: 20,
        style: {
          backgroundColor: '#f1f5f9',
          border: '1px solid #e2e8f0',
          borderRadius: '4px'
        },
        zIndex: 1
      },
      {
        id: 'mobile-agent-label',
        type: 'text',
        content: 'AGENT',
        x: 15,
        y: 198,
        width: 40,
        height: 6,
        style: {
          fontSize: '8px',
          fontFamily: 'Courier New',
          color: '#64748b',
          fontWeight: 'bold',
          textAlign: 'left',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      {
        id: 'mobile-agent-value',
        type: 'dynamic',
        fieldId: 'agentName',
        content: 'Juan Dela Cruz',
        label: 'Agent Name',
        x: 15,
        y: 205,
        width: 190,
        height: 8,
        style: {
          fontSize: '10px',
          fontFamily: 'Courier New',
          color: '#1e293b',
          fontWeight: 'bold',
          textAlign: 'left',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      // QR Code section
      {
        id: 'mobile-qr-bg',
        type: 'shape',
        shapeType: 'rectangle',
        x: 70,
        y: 225,
        width: 80,
        height: 80,
        style: {
          backgroundColor: '#ffffff',
          border: '2px solid #e2e8f0',
          borderRadius: '4px'
        },
        zIndex: 1
      },
      {
        id: 'mobile-qr-code',
        type: 'dynamic',
        fieldId: 'qrCode',
        content: 'https://quickchart.io/qr?text=sample',
        label: 'QR Code',
        x: 70,
        y: 225,
        width: 80,
        height: 80,
        style: {
          fontSize: '8px',
          fontFamily: 'Courier New',
          color: '#000000',
          fontWeight: 'normal',
          textAlign: 'center',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      // Footer
      {
        id: 'mobile-footer',
        type: 'text',
        content: 'GOOD LUCK! 🍀',
        x: 110,
        y: 315,
        width: 220,
        height: 10,
        style: {
          fontSize: '10px',
          fontFamily: 'Courier New',
          color: '#1e293b',
          fontWeight: 'bold',
          textAlign: 'center',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      {
        id: 'mobile-timestamp',
        type: 'dynamic',
        fieldId: 'timestamp',
        content: '2025/09/16 Tue 14:00',
        label: 'Timestamp',
        x: 110,
        y: 325,
        width: 220,
        height: 8,
        style: {
          fontSize: '8px',
          fontFamily: 'Courier New',
          color: '#666666',
          fontWeight: 'normal',
          textAlign: 'center',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      }
    ];

    setSelectedTemplate(null);
    setFormData({
      name: 'Mobile 58mm Template',
      design: {
        elements: mobileElements,
        canvasSize: { width: 220, height: 340 }, // 58mm width optimized
        backgroundColor: '#ffffff',
        templateType: 'mobile'
      }
    });
    setCanvasElements(mobileElements);
    setCanvasSize({ width: 220, height: 340 });
    setTemplateType('mobile');
    setShowDesigner(true);
    setDesignerMode('select');
    setSelectedElement(null);
  };

  const createMobilePOSTemplate = () => {
    const mobilePOSElements = [
      // Header for Mobile POS (58mm width optimized with POS branding)
      {
        id: 'pos-header-bg',
        type: 'shape',
        shapeType: 'rectangle',
        x: 0,
        y: 0,
        width: 220, // 58mm = ~220px
        height: 45,
        style: {
          backgroundColor: '#059669', // Green for POS
          border: 'none',
          borderRadius: '0px'
        },
        zIndex: 1
      },
      {
        id: 'pos-logo',
        type: 'text',
        content: '🖨️ NEWBETTING POS',
        x: 110,
        y: 8,
        width: 220,
        height: 12,
        style: {
          fontSize: '11px',
          fontFamily: 'Courier New',
          color: '#ffffff',
          fontWeight: 'bold',
          textAlign: 'center',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      {
        id: 'pos-title',
        type: 'text',
        content: '3D LOTTO POS TICKET',
        x: 110,
        y: 22,
        width: 220,
        height: 12,
        style: {
          fontSize: '10px',
          fontFamily: 'Courier New',
          color: '#ffffff',
          fontWeight: 'bold',
          textAlign: 'center',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      {
        id: 'pos-ticket-number',
        type: 'text',
        content: '#',
        x: 110,
        y: 35,
        width: 220,
        height: 8,
        style: {
          fontSize: '9px',
          fontFamily: 'Courier New',
          color: '#ffffff',
          fontWeight: 'bold',
          textAlign: 'center',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      {
        id: 'pos-ticket-number-value',
        type: 'dynamic',
        fieldId: 'ticketNumber',
        content: '12345678901234567',
        label: 'Ticket Number',
        x: 110,
        y: 43,
        width: 220,
        height: 8,
        style: {
          fontSize: '9px',
          fontFamily: 'Courier New',
          color: '#ffffff',
          fontWeight: 'bold',
          textAlign: 'center',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      // POS Draw info section with enhanced styling
      {
        id: 'pos-draw-info-bg',
        type: 'shape',
        shapeType: 'rectangle',
        x: 10,
        y: 58,
        width: 200,
        height: 30,
        style: {
          backgroundColor: '#fef3c7',
          border: '2px solid #f59e0b',
          borderRadius: '6px'
        },
        zIndex: 1
      },
      {
        id: 'pos-draw-time',
        type: 'dynamic',
        fieldId: 'drawTime',
        content: '14:00',
        label: 'Draw Time',
        x: 15,
        y: 65,
        width: 60,
        height: 12,
        style: {
          fontSize: '12px',
          fontFamily: 'Courier New',
          color: '#92400e',
          fontWeight: 'bold',
          textAlign: 'left',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      {
        id: 'pos-draw-date',
        type: 'dynamic',
        fieldId: 'drawDate',
        content: '2025/09/16 Tue',
        label: 'Draw Date',
        x: 80,
        y: 65,
        width: 120,
        height: 12,
        style: {
          fontSize: '9px',
          fontFamily: 'Courier New',
          color: '#92400e',
          fontWeight: 'bold',
          textAlign: 'left',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      // POS Bet information with enhanced formatting
      {
        id: 'pos-bet-info',
        type: 'dynamic',
        fieldId: 'allBets',
        content: 'Standard                                                                                        1    2    3\nA                                                                                                    Price: ₱10.00\n\nRambolito                                                                                        4   5   6 \nB                                                                                                     Price: ₱20.00',
        label: 'All Bets Detail',
        x: 10,
        y: 98,
        width: 200,
        height: 70,
        style: {
          fontSize: '9px',
          fontFamily: 'Courier New',
          color: '#1e293b',
          fontWeight: 'normal',
          textAlign: 'left',
          backgroundColor: '#f8fafc',
          border: '2px solid #e2e8f0',
          borderRadius: '6px',
          padding: '6px',
          lineHeight: '1.3'
        },
        zIndex: 2
      },
      // POS Total amount with enhanced styling
      {
        id: 'pos-total-bg',
        type: 'shape',
        shapeType: 'rectangle',
        x: 10,
        y: 178,
        width: 200,
        height: 30,
        style: {
          backgroundColor: '#1e293b',
          border: 'none',
          borderRadius: '6px'
        },
        zIndex: 1
      },
      {
        id: 'pos-total-label',
        type: 'text',
        content: 'POS TOTAL AMOUNT',
        x: 110,
        y: 185,
        width: 200,
        height: 8,
        style: {
          fontSize: '9px',
          fontFamily: 'Courier New',
          color: '#ffffff',
          fontWeight: 'bold',
          textAlign: 'center',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      {
        id: 'pos-total-value',
        type: 'dynamic',
        fieldId: 'totalBet',
        content: '₱50.00',
        label: 'Total Bet',
        x: 110,
        y: 195,
        width: 200,
        height: 12,
        style: {
          fontSize: '16px',
          fontFamily: 'Courier New',
          color: '#ffffff',
          fontWeight: 'bold',
          textAlign: 'center',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      // POS Agent info with enhanced styling
      {
        id: 'pos-agent-bg',
        type: 'shape',
        shapeType: 'rectangle',
        x: 10,
        y: 218,
        width: 200,
        height: 25,
        style: {
          backgroundColor: '#f1f5f9',
          border: '2px solid #e2e8f0',
          borderRadius: '6px'
        },
        zIndex: 1
      },
      {
        id: 'pos-agent-label',
        type: 'text',
        content: 'POS AGENT',
        x: 15,
        y: 223,
        width: 60,
        height: 6,
        style: {
          fontSize: '8px',
          fontFamily: 'Courier New',
          color: '#64748b',
          fontWeight: 'bold',
          textAlign: 'left',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      {
        id: 'pos-agent-value',
        type: 'dynamic',
        fieldId: 'agentName',
        content: 'Juan Dela Cruz',
        label: 'Agent Name',
        x: 15,
        y: 232,
        width: 190,
        height: 8,
        style: {
          fontSize: '10px',
          fontFamily: 'Courier New',
          color: '#1e293b',
          fontWeight: 'bold',
          textAlign: 'left',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      // POS QR Code section with enhanced styling
      {
        id: 'pos-qr-bg',
        type: 'shape',
        shapeType: 'rectangle',
        x: 70,
        y: 253,
        width: 80,
        height: 80,
        style: {
          backgroundColor: '#ffffff',
          border: '3px solid #059669',
          borderRadius: '6px'
        },
        zIndex: 1
      },
      {
        id: 'pos-qr-code',
        type: 'dynamic',
        fieldId: 'qrCode',
        content: 'https://quickchart.io/qr?text=sample',
        label: 'QR Code',
        x: 70,
        y: 253,
        width: 80,
        height: 80,
        style: {
          fontSize: '8px',
          fontFamily: 'Courier New',
          color: '#000000',
          fontWeight: 'normal',
          textAlign: 'center',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      // POS Footer with enhanced styling
      {
        id: 'pos-footer',
        type: 'text',
        content: 'POS SYSTEM - GOOD LUCK! 🍀',
        x: 110,
        y: 343,
        width: 220,
        height: 10,
        style: {
          fontSize: '10px',
          fontFamily: 'Courier New',
          color: '#059669',
          fontWeight: 'bold',
          textAlign: 'center',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      {
        id: 'pos-timestamp',
        type: 'dynamic',
        fieldId: 'timestamp',
        content: '2025/09/16 Tue 14:00',
        label: 'Timestamp',
        x: 110,
        y: 353,
        width: 220,
        height: 8,
        style: {
          fontSize: '8px',
          fontFamily: 'Courier New',
          color: '#666666',
          fontWeight: 'normal',
          textAlign: 'center',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      }
    ];

    setSelectedTemplate(null);
    setFormData({
      name: 'Mobile POS Template',
      design: {
        elements: mobilePOSElements,
        canvasSize: { width: 220, height: 400 }, // Increased height for dynamic content
        backgroundColor: '#ffffff',
        templateType: 'mobile-pos',
        dynamicHeight: true // Flag for dynamic height adjustment
      }
    });
    setCanvasElements(mobilePOSElements);
    setCanvasSize({ width: 220, height: 400 });
    setTemplateType('mobile-pos');
    setShowDesigner(true);
    setDesignerMode('select');
    setSelectedElement(null);
  };

  const createProfessionalTemplate = () => {
    const professionalElements = [
      // Header with professional gradient
      {
        id: 'header-bg',
        type: 'shape',
        shapeType: 'rectangle',
        x: 0,
        y: 0,
        width: 400,
        height: 90,
        style: {
          backgroundColor: '#0f172a',
          border: 'none',
          borderRadius: '0px'
        },
        zIndex: 1
      },
      // Decorative border
      {
        id: 'header-border',
        type: 'shape',
        shapeType: 'rectangle',
        x: 0,
        y: 85,
        width: 400,
        height: 5,
        style: {
          backgroundColor: '#3b82f6',
          border: 'none',
          borderRadius: '0px'
        },
        zIndex: 2
      },
      // Lottery title with professional styling
      {
        id: 'lottery-title',
        type: 'text',
        content: '3D LOTTO',
        x: 200,
        y: 30,
        width: 200,
        height: 35,
        style: {
          fontSize: '28px',
          fontFamily: 'Arial',
          color: '#ffffff',
          fontWeight: 'bold',
          textAlign: 'center',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px',
          letterSpacing: '2px'
        },
        zIndex: 3
      },
      // Subtitle
      {
        id: 'lottery-subtitle',
        type: 'text',
        content: 'Official Lottery Ticket',
        x: 200,
        y: 60,
        width: 200,
        height: 20,
        style: {
          fontSize: '11px',
          fontFamily: 'Arial',
          color: '#94a3b8',
          fontWeight: 'normal',
          textAlign: 'center',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px',
          letterSpacing: '1px'
        },
        zIndex: 3
      },
      // Ticket number section with enhanced styling
      {
        id: 'ticket-number-bg',
        type: 'shape',
        shapeType: 'rectangle',
        x: 20,
        y: 110,
        width: 360,
        height: 50,
        style: {
          backgroundColor: '#f8fafc',
          border: '2px solid #3b82f6',
          borderRadius: '12px'
        },
        zIndex: 1
      },
      {
        id: 'ticket-number-label',
        type: 'text',
        content: 'TICKET NUMBER',
        x: 30,
        y: 115,
        width: 100,
        height: 15,
        style: {
          fontSize: '9px',
          fontFamily: 'Arial',
          color: '#64748b',
          fontWeight: 'bold',
          textAlign: 'left',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px',
          letterSpacing: '1px'
        },
        zIndex: 2
      },
      {
        id: 'ticket-number-value',
        type: 'dynamic',
        fieldId: 'ticketNumber',
        content: '12345678901234567',
        label: 'Ticket Number',
        x: 30,
        y: 130,
        width: 340,
        height: 20,
        style: {
          fontSize: '16px',
          fontFamily: 'Courier New',
          color: '#1e293b',
          fontWeight: 'bold',
          textAlign: 'left',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px',
          letterSpacing: '1px'
        },
        zIndex: 2
      },
      // Draw information section with professional styling
      {
        id: 'draw-info-bg',
        type: 'shape',
        shapeType: 'rectangle',
        x: 20,
        y: 180,
        width: 360,
        height: 60,
        style: {
          backgroundColor: '#fef3c7',
          border: '2px solid #f59e0b',
          borderRadius: '12px'
        },
        zIndex: 1
      },
      {
        id: 'draw-time-label',
        type: 'text',
        content: 'DRAW TIME',
        x: 30,
        y: 185,
        width: 100,
        height: 15,
        style: {
          fontSize: '9px',
          fontFamily: 'Arial',
          color: '#92400e',
          fontWeight: 'bold',
          textAlign: 'left',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px',
          letterSpacing: '1px'
        },
        zIndex: 2
      },
      {
        id: 'draw-time-value',
        type: 'dynamic',
        fieldId: 'drawTime',
        content: '14:00',
        label: 'Draw Time',
        x: 30,
        y: 200,
        width: 100,
        height: 20,
        style: {
          fontSize: '18px',
          fontFamily: 'Arial',
          color: '#92400e',
          fontWeight: 'bold',
          textAlign: 'left',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      {
        id: 'draw-date-label',
        type: 'text',
        content: 'DRAW DATE',
        x: 200,
        y: 185,
        width: 100,
        height: 15,
        style: {
          fontSize: '9px',
          fontFamily: 'Arial',
          color: '#92400e',
          fontWeight: 'bold',
          textAlign: 'left',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px',
          letterSpacing: '1px'
        },
        zIndex: 2
      },
      {
        id: 'draw-date-value',
        type: 'dynamic',
        fieldId: 'drawDate',
        content: '2025/09/16 Tue 14:00',
        label: 'Draw Date',
        x: 200,
        y: 200,
        width: 180,
        height: 20,
        style: {
          fontSize: '12px',
          fontFamily: 'Arial',
          color: '#92400e',
          fontWeight: 'bold',
          textAlign: 'left',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      // Bets section header with professional styling
      {
        id: 'bets-header-bg',
        type: 'shape',
        shapeType: 'rectangle',
        x: 20,
        y: 260,
        width: 360,
        height: 30,
        style: {
          backgroundColor: '#1e293b',
          border: 'none',
          borderRadius: '8px'
        },
        zIndex: 1
      },
      {
        id: 'bets-header',
        type: 'text',
        content: 'YOUR BETS',
        x: 200,
        y: 270,
        width: 200,
        height: 20,
        style: {
          fontSize: '14px',
          fontFamily: 'Arial',
          color: '#ffffff',
          fontWeight: 'bold',
          textAlign: 'center',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px',
          letterSpacing: '2px'
        },
        zIndex: 2
      },
      // Bet count
      {
        id: 'bet-count',
        type: 'dynamic',
        fieldId: 'betCount',
        content: '3',
        label: 'Bet Count',
        x: 20,
        y: 300,
        width: 360,
        height: 20,
        style: {
          fontSize: '11px',
          fontFamily: 'Arial',
          color: '#64748b',
          fontWeight: 'normal',
          textAlign: 'center',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      // All bets detail with professional formatting
      {
        id: 'all-bets-detail',
        type: 'dynamic',
        fieldId: 'allBets',
        content: 'Standard                                                                                        1    2    3\nA                                                                                                    Price: ₱10.00\n\nRambolito                                                                                        4   5   6 \nB                                                                                                     Price: ₱20.00',
        label: 'All Bets Detail',
        x: 20,
        y: 330,
        width: 360,
        height: 90,
        style: {
          fontSize: '9px',
          fontFamily: 'Courier New',
          color: '#1e293b',
          fontWeight: 'normal',
          textAlign: 'left',
          backgroundColor: '#ffffff',
          border: '2px solid #e2e8f0',
          borderRadius: '8px',
          padding: '12px',
          lineHeight: '1.3'
        },
        zIndex: 2
      },
      // Total amount section with enhanced styling
      {
        id: 'total-bg',
        type: 'shape',
        shapeType: 'rectangle',
        x: 20,
        y: 440,
        width: 360,
        height: 60,
        style: {
          backgroundColor: '#059669',
          border: 'none',
          borderRadius: '12px'
        },
        zIndex: 1
      },
      {
        id: 'total-label',
        type: 'text',
        content: 'TOTAL AMOUNT',
        x: 200,
        y: 450,
        width: 200,
        height: 15,
        style: {
          fontSize: '11px',
          fontFamily: 'Arial',
          color: '#ffffff',
          fontWeight: 'bold',
          textAlign: 'center',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px',
          letterSpacing: '1px'
        },
        zIndex: 2
      },
      {
        id: 'total-value',
        type: 'dynamic',
        fieldId: 'totalBet',
        content: '₱50.00',
        label: 'Total Bet',
        x: 200,
        y: 465,
        width: 200,
        height: 25,
        style: {
          fontSize: '24px',
          fontFamily: 'Arial',
          color: '#ffffff',
          fontWeight: 'bold',
          textAlign: 'center',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      // Agent information with professional styling
      {
        id: 'agent-info-bg',
        type: 'shape',
        shapeType: 'rectangle',
        x: 20,
        y: 520,
        width: 360,
        height: 50,
        style: {
          backgroundColor: '#f1f5f9',
          border: '2px solid #e2e8f0',
          borderRadius: '12px'
        },
        zIndex: 1
      },
      {
        id: 'agent-label',
        type: 'text',
        content: 'AGENT',
        x: 30,
        y: 525,
        width: 100,
        height: 15,
        style: {
          fontSize: '9px',
          fontFamily: 'Arial',
          color: '#64748b',
          fontWeight: 'bold',
          textAlign: 'left',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px',
          letterSpacing: '1px'
        },
        zIndex: 2
      },
      {
        id: 'agent-value',
        type: 'dynamic',
        fieldId: 'agentName',
        content: 'Juan Dela Cruz',
        label: 'Agent Name',
        x: 30,
        y: 540,
        width: 340,
        height: 20,
        style: {
          fontSize: '16px',
          fontFamily: 'Arial',
          color: '#1e293b',
          fontWeight: 'bold',
          textAlign: 'left',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      // QR Code section with professional styling
      {
        id: 'qr-bg',
        type: 'shape',
        shapeType: 'rectangle',
        x: 150,
        y: 590,
        width: 100,
        height: 100,
        style: {
          backgroundColor: '#ffffff',
          border: '3px solid #3b82f6',
          borderRadius: '12px'
        },
        zIndex: 1
      },
      {
        id: 'qr-code',
        type: 'dynamic',
        fieldId: 'qrCode',
        content: 'https://quickchart.io/qr?text=sample',
        label: 'QR Code',
        x: 150,
        y: 590,
        width: 100,
        height: 100,
        style: {
          fontSize: '8px',
          fontFamily: 'Arial',
          color: '#000000',
          fontWeight: 'normal',
          textAlign: 'center',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px'
        },
        zIndex: 2
      },
      // Professional footer
      {
        id: 'footer-bg',
        type: 'shape',
        shapeType: 'rectangle',
        x: 0,
        y: 710,
        width: 400,
        height: 30,
        style: {
          backgroundColor: '#0f172a',
          border: 'none',
          borderRadius: '0px'
        },
        zIndex: 1
      },
      {
        id: 'footer-text',
        type: 'text',
        content: 'Keep this ticket safe • Present for prize claims • Good luck!',
        x: 200,
        y: 720,
        width: 200,
        height: 15,
        style: {
          fontSize: '9px',
          fontFamily: 'Arial',
          color: '#94a3b8',
          fontWeight: 'normal',
          textAlign: 'center',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0px',
          letterSpacing: '1px'
        },
        zIndex: 2
      }
    ];

    setSelectedTemplate(null);
    setFormData({
      name: 'Professional Multi-Bet Template',
      design: {
        elements: professionalElements,
        canvasSize: { width: 400, height: 740 },
        backgroundColor: '#ffffff'
      }
    });
    setCanvasElements(professionalElements);
    setCanvasSize({ width: 400, height: 740 });
    setShowDesigner(true);
    setDesignerMode('select');
    setSelectedElement(null);
  };

  const openDesigner = (template = null) => {
    if (template) {
      setSelectedTemplate(template);
      setFormData({
        name: template.name,
        design: template.design
      });
      setCanvasElements(template.design?.elements || []);
      setCanvasSize(template.design?.canvasSize || { width: 400, height: 600 });
      setTemplateType(template.design?.templateType || 'standard');
    } else {
      setSelectedTemplate(null);
      setFormData({
        name: '',
        design: {
          elements: [],
          canvasSize: { width: 400, height: 600 },
          backgroundColor: '#ffffff',
          templateType: 'standard'
        }
      });
      setCanvasElements([]);
      setCanvasSize({ width: 400, height: 600 });
      setTemplateType('standard');
    }
    setShowDesigner(true);
    setDesignerMode('select');
    setSelectedElement(null);
  };

  const saveTemplate = async () => {
    try {
      const templateData = {
        ...formData,
        design: {
          ...formData.design,
          elements: canvasElements,
          canvasSize,
          templateType: templateType
        }
      };

      if (selectedTemplate) {
        await api.put(`/ticket-templates/${selectedTemplate.id}`, templateData);
      } else {
        await api.post('/ticket-templates', templateData);
      }
      
      setShowDesigner(false);
      fetchTemplates();
    } catch (err) {
      setError('Failed to save template');
      console.error('Error saving template:', err);
    }
  };

  const editCurrentTemplate = () => {
    if (selectedTemplate) {
      // Load the selected template for editing
      setFormData({
        name: selectedTemplate.name,
        design: selectedTemplate.design
      });
      setCanvasElements(selectedTemplate.design.elements || []);
      setCanvasSize(selectedTemplate.design.canvasSize || { width: 400, height: 600 });
      setTemplateType(selectedTemplate.design.templateType || 'standard');
      setDesignerMode('select');
      setSelectedElement(null);
      setShowDesigner(true);
      toast.success('Template loaded for editing!');
    } else {
      toast.error('No template selected for editing');
    }
  };

  const openPreviewModal = (template) => {
    setSelectedTemplate(template);
    setShowPreviewModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ticket Templates</h1>
          <p className="text-gray-600 mt-2">Manage ticket design templates</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {user?.role === 'superadmin' && (
            <>
              <button
                onClick={() => createMobileTemplate()}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 flex items-center shadow-lg"
              >
                <Square3Stack3DIcon className="h-5 w-5 mr-2" />
                Mobile 58mm Template
              </button>
              <button
                onClick={() => createMobilePOSTemplate()}
                className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-teal-700 flex items-center shadow-lg"
              >
                <Square3Stack3DIcon className="h-5 w-5 mr-2" />
                Mobile POS Template
              </button>
              <button
                onClick={() => createProfessionalTemplate()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center shadow-lg"
              >
                <Square3Stack3DIcon className="h-5 w-5 mr-2" />
                Professional Template
              </button>
              <button
                onClick={() => createModernTemplate()}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
              >
                <Square3Stack3DIcon className="h-5 w-5 mr-2" />
                Modern Template
              </button>
              <button
                onClick={() => openDesigner()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Design New Template
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center"
              >
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Quick Create
              </button>
            </>
          )}
          {(user?.role === 'superadmin' || user?.role === 'admin') && (
            <button
              onClick={() => setShowAssignModal(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center"
            >
              <Cog6ToothIcon className="h-5 w-5 mr-2" />
              Manage Assignments
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {user?.role !== 'superadmin' && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4">
          <div className="flex items-center">
            <Cog6ToothIcon className="h-5 w-5 mr-2" />
            <div>
              <p className="font-medium">Template Management</p>
              <p className="text-sm">
                {user?.role === 'admin' 
                  ? 'You can assign templates to agents using the "Manage Assignments" button above.'
                  : 'Contact your administrator to manage ticket templates.'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {user?.role === 'superadmin' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
          <div key={template.id} className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                <p className="text-sm text-gray-500">
                  {template.isActive ? 'Active' : 'Inactive'}
                  {template.design?.templateType === 'mobile' && (
                    <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                      📱 Mobile
                    </span>
                  )}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => openPreviewModal(template)}
                  className="text-gray-400 hover:text-gray-600"
                  title="Preview"
                >
                  <EyeIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => openDesigner(template)}
                  className="text-blue-400 hover:text-blue-600"
                  title="Design Editor"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => openEditModal(template)}
                  className="text-green-400 hover:text-green-600"
                  title="Quick Edit"
                >
                  <AdjustmentsHorizontalIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => openAssignModal(template)}
                  className="text-purple-400 hover:text-purple-600"
                  title="Assign Template"
                >
                  <UserGroupIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => toggleActiveTemplate(template.id)}
                  className={`${template.isActive ? 'text-green-500 hover:text-green-700' : 'text-gray-400 hover:text-gray-600'}`}
                  title={template.isActive ? 'Set as Inactive' : 'Set as Active'}
                >
                  <TicketIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDeleteTemplate(template.id)}
                  className="text-red-400 hover:text-red-600"
                  title="Delete"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="border rounded p-3 bg-gray-50">
              <div className="text-xs text-gray-600 mb-2">Preview:</div>
              <div 
                className="text-center p-2 rounded border"
                style={{
                  backgroundColor: template.design?.backgroundColor || '#ffffff',
                  color: template.design?.textColor || '#000000',
                  fontSize: template.design?.fontSize || '12px'
                }}
              >
                <div className="font-bold">{template.design?.headerText || 'LOTTERY TICKET'}</div>
                <div className="my-2">--- TICKET CONTENT ---</div>
                <div className="text-xs">{template.design?.footerText || 'Good Luck!'}</div>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Create Template Modal */}
      {user?.role === 'superadmin' && showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Template</h3>
              <form onSubmit={handleCreateTemplate}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Header Text
                  </label>
                  <input
                    type="text"
                    value={formData.design.headerText || ''}
                    onChange={(e) => setFormData({
                      ...formData, 
                      design: {...formData.design, headerText: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Footer Text
                  </label>
                  <input
                    type="text"
                    value={formData.design.footerText || ''}
                    onChange={(e) => setFormData({
                      ...formData, 
                      design: {...formData.design, footerText: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Background Color
                    </label>
                    <input
                      type="color"
                      value={formData.design.backgroundColor || '#ffffff'}
                      onChange={(e) => setFormData({
                        ...formData, 
                        design: {...formData.design, backgroundColor: e.target.value}
                      })}
                      className="w-full h-10 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Text Color
                    </label>
                    <input
                      type="color"
                      value={formData.design.textColor || '#000000'}
                      onChange={(e) => setFormData({
                        ...formData, 
                        design: {...formData.design, textColor: e.target.value}
                      })}
                      className="w-full h-10 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-500 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Create Template
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Template Modal */}
      {user?.role === 'superadmin' && showEditModal && selectedTemplate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Template</h3>
              <form onSubmit={handleEditTemplate}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Header Text
                  </label>
                  <input
                    type="text"
                    value={formData.design.headerText || ''}
                    onChange={(e) => setFormData({
                      ...formData, 
                      design: {...formData.design, headerText: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Footer Text
                  </label>
                  <input
                    type="text"
                    value={formData.design.footerText || ''}
                    onChange={(e) => setFormData({
                      ...formData, 
                      design: {...formData.design, footerText: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Background Color
                    </label>
                    <input
                      type="color"
                      value={formData.design.backgroundColor || '#ffffff'}
                      onChange={(e) => setFormData({
                        ...formData, 
                        design: {...formData.design, backgroundColor: e.target.value}
                      })}
                      className="w-full h-10 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Text Color
                    </label>
                    <input
                      type="color"
                      value={formData.design.textColor || '#000000'}
                      onChange={(e) => setFormData({
                        ...formData, 
                        design: {...formData.design, textColor: e.target.value}
                      })}
                      className="w-full h-10 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-gray-500 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Update Template
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedTemplate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Template Preview</h3>
              <div className="border rounded p-4 mb-4">
                <div 
                  className="text-center p-4 rounded border"
                  style={{
                    backgroundColor: selectedTemplate.design?.backgroundColor || '#ffffff',
                    color: selectedTemplate.design?.textColor || '#000000',
                    fontSize: selectedTemplate.design?.fontSize || '12px'
                  }}
                >
                  <div className="font-bold text-lg mb-2">
                    {selectedTemplate.design?.headerText || 'LOTTERY TICKET'}
                  </div>
                  <div className="border-t border-b py-2 my-2">
                    <div>Ticket #: 12345678901234567</div>
                    <div>Draw: 2PM - Sept 15, 2024</div>
                    <div>Bets (3):</div>
                    <div className="text-xs ml-2 font-mono">
                      Standard                                                                                        1    2    3<br/>
                      A                                                                                                    Price: ₱10.00<br/><br/>
                      Rambolito                                                                                        4   5   6 <br/>
                      B                                                                                                     Price: ₱20.00
                    </div>
                    <div>Total Amount: ₱30.00</div>
                  </div>
                  <div className="text-xs mt-2">
                    {selectedTemplate.design?.footerText || 'Good Luck!'}
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedTemplate ? `Assign Template: ${selectedTemplate.name}` : 'Manage Template Assignments'}
                </h3>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <TrashIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Available Users */}
                <div>
                  <h4 className="text-md font-medium text-gray-800 mb-4">Available Users</h4>
                  <div className="border rounded-lg max-h-96 overflow-y-auto">
                    {users.filter(u => u.role === 'agent').map(user => (
                      <div key={user.id} className="p-3 border-b border-gray-200 flex justify-between items-center">
                        <div>
                          <div className="font-medium text-gray-900">{user.fullName}</div>
                          <div className="text-sm text-gray-500">{user.email} - {user.role}</div>
                        </div>
                        <button
                          onClick={() => handleAssignTemplate(user.id, selectedTemplate?.id)}
                          disabled={!selectedTemplate}
                          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 disabled:bg-gray-300"
                        >
                          Assign
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Current Assignments */}
                <div>
                  <h4 className="text-md font-medium text-gray-800 mb-4">Current Assignments</h4>
                  <div className="border rounded-lg max-h-96 overflow-y-auto">
                    {templateAssignments
                      .filter(assignment => !selectedTemplate || assignment.templateId === selectedTemplate.id)
                      .map(assignment => {
                        const assignedUser = users.find(u => u.id === assignment.agentId);
                        const assignedTemplate = templates.find(t => t.id === assignment.templateId);
                        return (
                          <div key={assignment.id} className="p-3 border-b border-gray-200 flex justify-between items-center">
                            <div>
                              <div className="font-medium text-gray-900">{assignedUser?.fullName}</div>
                              <div className="text-sm text-gray-500">
                                Template: {assignedTemplate?.name}
                              </div>
                            </div>
                            <button
                              onClick={() => handleUnassignTemplate(assignment.id)}
                              className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                            >
                              Remove
                            </button>
                          </div>
                        );
                      })}
                    {templateAssignments.length === 0 && (
                      <div className="p-8 text-center text-gray-500">
                        No template assignments yet
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Template Selection for Global Assignment */}
              {!selectedTemplate && (
                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-800 mb-4">Select Template to Assign</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map(template => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template)}
                        className="p-4 border rounded-lg hover:bg-gray-50 text-left"
                      >
                        <div className="font-medium text-gray-900">{template.name}</div>
                        <div className="text-sm text-gray-500">
                          {template.isActive ? 'Active' : 'Inactive'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedTemplate(null);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Designer Modal */}
      {user?.role === 'superadmin' && showDesigner && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-95 z-50 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Designer Header */}
            <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <h2 className="text-xl font-bold">
                  {selectedTemplate ? `Edit: ${selectedTemplate.name}` : 'New Template'}
                </h2>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Template Name"
                  className="bg-gray-700 text-white px-3 py-1 rounded border-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={templateType}
                  onChange={(e) => {
                    setTemplateType(e.target.value);
                    if (e.target.value === 'mobile') {
                      setCanvasSize({ width: 220, height: 340 });
                    } else {
                      setCanvasSize({ width: 400, height: 600 });
                    }
                  }}
                  className="bg-gray-700 text-white px-3 py-1 rounded border-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="standard">Standard Template</option>
                  <option value="mobile">Mobile 58mm Template</option>
                </select>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowRulers(!showRulers)}
                    className={`px-2 py-1 rounded text-sm ${showRulers ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white'}`}
                    title="Toggle Rulers"
                  >
                    Rulers
                  </button>
                  <button
                    onClick={() => setSnapToGrid(!snapToGrid)}
                    className={`px-2 py-1 rounded text-sm ${snapToGrid ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white'}`}
                    title="Toggle Snap to Grid"
                  >
                    Snap
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <MagnifyingGlassIcon className="h-4 w-4" />
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-sm">{Math.round(zoom * 100)}%</span>
                </div>
                <button
                  onClick={saveTemplate}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded mr-2"
                >
                  Save Template
                </button>
                <button
                  onClick={() => editCurrentTemplate()}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded mr-2"
                >
                  Edit Template
                </button>
                <button
                  onClick={() => setShowDesigner(false)}
                  className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Left Toolbar */}
              <div className="w-16 bg-gray-700 flex flex-col items-center py-4 space-y-2">
                <button
                  onClick={() => setDesignerMode('select')}
                  className={`p-2 rounded ${designerMode === 'select' ? 'bg-blue-600' : 'hover:bg-gray-600'} text-white`}
                  title="Select Tool"
                >
                  <CursorArrowRaysIcon className="h-6 w-6" />
                </button>
                <button
                  onClick={() => setDesignerMode('text')}
                  className={`p-2 rounded ${designerMode === 'text' ? 'bg-blue-600' : 'hover:bg-gray-600'} text-white`}
                  title="Text Tool"
                >
                  <DocumentTextIcon className="h-6 w-6" />
                </button>
                <button
                  onClick={() => setDesignerMode('image')}
                  className={`p-2 rounded ${designerMode === 'image' ? 'bg-blue-600' : 'hover:bg-gray-600'} text-white`}
                  title="Image Tool"
                >
                  <PhotoIcon className="h-6 w-6" />
                </button>
                <button
                  onClick={() => setDesignerMode('shape')}
                  className={`p-2 rounded ${designerMode === 'shape' ? 'bg-blue-600' : 'hover:bg-gray-600'} text-white`}
                  title="Shape Tool"
                >
                  <SwatchIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Left Panel - Elements & Dynamic Fields */}
              <div className="w-64 bg-gray-100 border-r overflow-y-auto">
                <div className="p-4">
                  <h3 className="font-semibold mb-3">Dynamic Fields</h3>
                  <div className="space-y-2">
                    {dynamicFields.map((field) => (
                      <div
                        key={field.id}
                        className="bg-white p-2 rounded border cursor-pointer hover:bg-blue-50 flex justify-between items-center"
                        onClick={() => addDynamicField(field.id)}
                      >
                        <div>
                          <div className="text-sm font-medium">{field.label}</div>
                          <div className="text-xs text-gray-500">{field.sample}</div>
                        </div>
                        <PlusIcon className="h-4 w-4 text-blue-600" />
                      </div>
                    ))}
                  </div>

                  <h3 className="font-semibold mb-3 mt-6">Elements</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => addTextElement()}
                      className="w-full bg-white p-2 rounded border hover:bg-blue-50 flex items-center"
                    >
                      <DocumentTextIcon className="h-4 w-4 mr-2" />
                      Add Text
                    </button>
                    <div className="space-y-1">
                      <button
                        onClick={() => addImageElement()}
                        className="w-full bg-white p-2 rounded border hover:bg-blue-50 flex items-center"
                      >
                        <PhotoIcon className="h-4 w-4 mr-2" />
                        Add Image (URL)
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full bg-white p-2 rounded border hover:bg-blue-50 flex items-center"
                      >
                        <PhotoIcon className="h-4 w-4 mr-2" />
                        Upload Image File
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                    <button
                      onClick={() => addShapeElement('rectangle')}
                      className="w-full bg-white p-2 rounded border hover:bg-blue-50 flex items-center"
                    >
                      <SwatchIcon className="h-4 w-4 mr-2" />
                      Add Rectangle
                    </button>
                    <button
                      onClick={() => addShapeElement('circle')}
                      className="w-full bg-white p-2 rounded border hover:bg-blue-50 flex items-center"
                    >
                      <SwatchIcon className="h-4 w-4 mr-2" />
                      Add Circle
                    </button>
                  </div>

                  <h3 className="font-semibold mb-3 mt-6">Layers</h3>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {canvasElements
                      .sort((a, b) => b.zIndex - a.zIndex)
                      .map((element) => (
                        <div
                          key={element.id}
                          className={`p-2 rounded border cursor-pointer flex justify-between items-center ${
                            selectedElement === element.id ? 'bg-blue-100 border-blue-300' : 'bg-white hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedElement(element.id)}
                        >
                          <div className="text-sm truncate">
                            {element.type === 'dynamic' ? element.label : 
                             element.type === 'text' ? element.content :
                             element.type.charAt(0).toUpperCase() + element.type.slice(1)}
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                duplicateElement(element.id);
                              }}
                              className="text-gray-400 hover:text-blue-600"
                              title="Duplicate"
                            >
                              <DocumentDuplicateIcon className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteElement(element.id);
                              }}
                              className="text-gray-400 hover:text-red-600"
                              title="Delete"
                            >
                              <TrashIcon className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Main Canvas Area */}
              <div className="flex-1 bg-gray-200 overflow-auto p-8">
                <div className="flex justify-center">
                  <div className="relative">
                    {/* Rulers */}
                    {showRulers && (
                      <>
                        {/* Top Ruler */}
                        <div 
                          className="absolute bg-gray-300 border-b border-gray-400 flex items-center text-xs"
                          style={{
                            width: canvasSize.width * zoom,
                            height: 20,
                            top: -20,
                            left: 0
                          }}
                        >
                          {Array.from({ length: Math.ceil(canvasSize.width / 50) }, (_, i) => (
                            <div
                              key={i}
                              className="absolute border-l border-gray-500"
                              style={{
                                left: i * 50 * zoom,
                                height: '100%',
                                paddingLeft: '2px'
                              }}
                            >
                              {i * 50}
                            </div>
                          ))}
                        </div>
                        
                        {/* Left Ruler */}
                        <div 
                          className="absolute bg-gray-300 border-r border-gray-400 flex flex-col items-center text-xs"
                          style={{
                            width: 20,
                            height: canvasSize.height * zoom,
                            top: 0,
                            left: -20
                          }}
                        >
                          {Array.from({ length: Math.ceil(canvasSize.height / 50) }, (_, i) => (
                            <div
                              key={i}
                              className="absolute border-t border-gray-500 flex items-center justify-center"
                              style={{
                                top: i * 50 * zoom,
                                width: '100%',
                                height: '20px'
                              }}
                            >
                              {i * 50}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    
                    {/* Grid Overlay */}
                    {snapToGrid && (
                      <div 
                        className="absolute pointer-events-none"
                        style={{
                          width: canvasSize.width * zoom,
                          height: canvasSize.height * zoom,
                          top: 0,
                          left: 0,
                          backgroundImage: `
                            linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                            linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                          `,
                          backgroundSize: `${gridSize * zoom}px ${gridSize * zoom}px`
                        }}
                      />
                    )}
                    
                    <div
                      ref={canvasRef}
                      className="relative bg-white shadow-lg cursor-crosshair"
                      style={{
                        width: canvasSize.width * zoom,
                        height: canvasSize.height * zoom,
                        backgroundColor: formData.design.backgroundColor || '#ffffff'
                      }}
                      onClick={handleCanvasClick}
                    >
                    {canvasElements.map((element) => (
                      <div
                        key={element.id}
                        className={`absolute border-2 ${
                          selectedElement === element.id ? 'border-blue-500' : 'border-transparent'
                        } hover:border-blue-300 cursor-move`}
                        style={{
                          left: element.x * zoom,
                          top: element.y * zoom,
                          width: element.width * zoom,
                          height: element.height * zoom,
                          zIndex: element.zIndex,
                          transform: 'scale(1)'
                        }}
                        onClick={(e) => handleElementClick(e, element.id)}
                        onMouseDown={(e) => handleElementMouseDown(e, element.id)}
                      >
                        {element.type === 'text' || element.type === 'dynamic' ? (
                          <div
                            className="w-full h-full flex items-center justify-start overflow-hidden"
                            style={{
                              ...element.style,
                              fontSize: parseInt(element.style.fontSize) * zoom + 'px'
                            }}
                          >
                            {element.content}
                          </div>
                        ) : element.type === 'image' ? (
                          <div
                            className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs"
                            style={element.style}
                          >
                            {element.src ? (
                              <img src={element.src} alt={element.alt} className="w-full h-full object-cover" />
                            ) : (
                              <PhotoIcon className="h-8 w-8" />
                            )}
                          </div>
                        ) : element.type === 'shape' ? (
                          <div
                            className="w-full h-full"
                            style={element.style}
                          />
                        ) : null}
                        
                        {selectedElement === element.id && (
                          <>
                            {/* Resize handles */}
                            <div 
                              className="resize-handle absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 cursor-se-resize border border-white" 
                              data-handle="se"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                setIsResizing(true);
                                setResizeHandle('se');
                              }}
                            />
                            <div 
                              className="resize-handle absolute -top-1 -right-1 w-3 h-3 bg-blue-500 cursor-ne-resize border border-white" 
                              data-handle="ne"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                setIsResizing(true);
                                setResizeHandle('ne');
                              }}
                            />
                            <div 
                              className="resize-handle absolute -top-1 -left-1 w-3 h-3 bg-blue-500 cursor-nw-resize border border-white" 
                              data-handle="nw"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                setIsResizing(true);
                                setResizeHandle('nw');
                              }}
                            />
                            <div 
                              className="resize-handle absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 cursor-sw-resize border border-white" 
                              data-handle="sw"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                setIsResizing(true);
                                setResizeHandle('sw');
                              }}
                            />
                          </>
                        )}
                      </div>
                    ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Properties Panel */}
              <div className="w-80 bg-gray-100 border-l overflow-y-auto">
                <div className="p-4">
                  <h3 className="font-semibold mb-4">Properties</h3>
                  
                  {selectedElement && (() => {
                    const element = canvasElements.find(el => el.id === selectedElement);
                    if (!element) return null;

                    return (
                      <div className="space-y-4">
                        {/* Position & Size */}
                        <div>
                          <h4 className="font-medium mb-2">Position & Size</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">X</label>
                              <input
                                type="number"
                                value={Math.round(element.x)}
                                onChange={(e) => updateElement(element.id, { x: parseInt(e.target.value) || 0 })}
                                className="w-full px-2 py-1 border rounded text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Y</label>
                              <input
                                type="number"
                                value={Math.round(element.y)}
                                onChange={(e) => updateElement(element.id, { y: parseInt(e.target.value) || 0 })}
                                className="w-full px-2 py-1 border rounded text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Width</label>
                              <input
                                type="number"
                                value={Math.round(element.width)}
                                onChange={(e) => updateElement(element.id, { width: parseInt(e.target.value) || 1 })}
                                className="w-full px-2 py-1 border rounded text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Height</label>
                              <input
                                type="number"
                                value={Math.round(element.height)}
                                onChange={(e) => updateElement(element.id, { height: parseInt(e.target.value) || 1 })}
                                className="w-full px-2 py-1 border rounded text-sm"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Text/Dynamic Field Properties */}
                        {(element.type === 'text' || element.type === 'dynamic') && (
                          <div>
                            <h4 className="font-medium mb-2">Text Properties</h4>
                            <div className="space-y-2">
                              {element.type === 'text' && (
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Content</label>
                                  <input
                                    type="text"
                                    value={element.content}
                                    onChange={(e) => updateElement(element.id, { content: e.target.value })}
                                    className="w-full px-2 py-1 border rounded text-sm"
                                  />
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Font Size</label>
                                  <input
                                    type="number"
                                    value={parseInt(element.style.fontSize) || 12}
                                    onChange={(e) => updateElement(element.id, { 
                                      style: { ...element.style, fontSize: (parseInt(e.target.value) || 12) + 'px' }
                                    })}
                                    className="w-full px-2 py-1 border rounded text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Color</label>
                                  <input
                                    type="color"
                                    value={element.style.color || '#000000'}
                                    onChange={(e) => updateElement(element.id, { 
                                      style: { ...element.style, color: e.target.value }
                                    })}
                                    className="w-full h-8 border rounded"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Font Family</label>
                                <select
                                  value={element.style.fontFamily || 'Arial'}
                                  onChange={(e) => updateElement(element.id, { 
                                    style: { ...element.style, fontFamily: e.target.value }
                                  })}
                                  className="w-full px-2 py-1 border rounded text-sm"
                                >
                                  <option value="Arial">Arial</option>
                                  <option value="Times New Roman">Times New Roman</option>
                                  <option value="Courier New">Courier New</option>
                                  <option value="Helvetica">Helvetica</option>
                                  <option value="Georgia">Georgia</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Text Align</label>
                                <select
                                  value={element.style.textAlign || 'left'}
                                  onChange={(e) => updateElement(element.id, { 
                                    style: { ...element.style, textAlign: e.target.value }
                                  })}
                                  className="w-full px-2 py-1 border rounded text-sm"
                                >
                                  <option value="left">Left</option>
                                  <option value="center">Center</option>
                                  <option value="right">Right</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Font Weight</label>
                                <select
                                  value={element.style.fontWeight || 'normal'}
                                  onChange={(e) => updateElement(element.id, { 
                                    style: { ...element.style, fontWeight: e.target.value }
                                  })}
                                  className="w-full px-2 py-1 border rounded text-sm"
                                >
                                  <option value="normal">Normal</option>
                                  <option value="bold">Bold</option>
                                  <option value="lighter">Lighter</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Letter Spacing</label>
                                <input
                                  type="number"
                                  value={parseInt(element.style.letterSpacing) || 0}
                                  onChange={(e) => updateElement(element.id, { 
                                    style: { ...element.style, letterSpacing: (parseInt(e.target.value) || 0) + 'px' }
                                  })}
                                  className="w-full px-2 py-1 border rounded text-sm"
                                  placeholder="0"
                                  step="1"
                                  min="-10"
                                  max="20"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Image Properties */}
                        {element.type === 'image' && (
                          <div>
                            <h4 className="font-medium mb-2">Image Properties</h4>
                            <div className="space-y-2">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Image Source</label>
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    value={element.src || ''}
                                    onChange={(e) => updateElement(element.id, { src: e.target.value })}
                                    placeholder="Enter image URL or upload file"
                                    className="w-full px-2 py-1 border rounded text-sm"
                                  />
                                  <button
                                    onClick={() => {
                                      const input = document.createElement('input');
                                      input.type = 'file';
                                      input.accept = 'image/*';
                                      input.onchange = (e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onload = (event) => {
                                            updateElement(element.id, { src: event.target.result });
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      };
                                      input.click();
                                    }}
                                    className="w-full px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                  >
                                    Choose File
                                  </button>
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Alt Text</label>
                                <input
                                  type="text"
                                  value={element.alt || ''}
                                  onChange={(e) => updateElement(element.id, { alt: e.target.value })}
                                  className="w-full px-2 py-1 border rounded text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Background & Border */}
                        <div>
                          <h4 className="font-medium mb-2">Background & Border</h4>
                          <div className="space-y-2">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Background</label>
                              <input
                                type="color"
                                value={element.style.backgroundColor === 'transparent' ? '#ffffff' : (element.style.backgroundColor || '#ffffff')}
                                onChange={(e) => updateElement(element.id, { 
                                  style: { ...element.style, backgroundColor: e.target.value }
                                })}
                                className="w-full h-8 border rounded"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Border</label>
                              <input
                                type="text"
                                value={element.style.border || 'none'}
                                onChange={(e) => updateElement(element.id, { 
                                  style: { ...element.style, border: e.target.value }
                                })}
                                placeholder="e.g., 1px solid #000"
                                className="w-full px-2 py-1 border rounded text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Border Radius</label>
                              <input
                                type="text"
                                value={element.style.borderRadius || '0px'}
                                onChange={(e) => updateElement(element.id, { 
                                  style: { ...element.style, borderRadius: e.target.value }
                                })}
                                placeholder="e.g., 5px"
                                className="w-full px-2 py-1 border rounded text-sm"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Layer Controls */}
                        <div>
                          <h4 className="font-medium mb-2">Layer</h4>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => updateElement(element.id, { zIndex: element.zIndex + 1 })}
                              className="flex-1 px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                            >
                              Bring Forward
                            </button>
                            <button
                              onClick={() => updateElement(element.id, { zIndex: Math.max(1, element.zIndex - 1) })}
                              className="flex-1 px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                            >
                              Send Back
                            </button>
                          </div>
                        </div>

                        {/* Delete Element */}
                        <div>
                          <button
                            onClick={() => deleteElement(element.id)}
                            className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
                          >
                            Delete Element
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {!selectedElement && (
                    <div className="text-gray-500 text-center py-8">
                      Select an element to edit its properties
                    </div>
                  )}

                  {/* Canvas Properties */}
                  <div className="mt-8 pt-4 border-t">
                    <h4 className="font-medium mb-2">Canvas Properties</h4>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Width</label>
                          <input
                            type="number"
                            value={canvasSize.width}
                            onChange={(e) => setCanvasSize({...canvasSize, width: parseInt(e.target.value) || 400})}
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Height</label>
                          <input
                            type="number"
                            value={canvasSize.height}
                            onChange={(e) => setCanvasSize({...canvasSize, height: parseInt(e.target.value) || 600})}
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Background Color</label>
                        <input
                          type="color"
                          value={formData.design.backgroundColor || '#ffffff'}
                          onChange={(e) => setFormData({
                            ...formData,
                            design: { ...formData.design, backgroundColor: e.target.value }
                          })}
                          className="w-full h-8 border rounded"
                        />
                      </div>
                      
                      {/* Grid Settings */}
                      <div className="pt-2 border-t">
                        <h5 className="font-medium mb-2 text-sm">Grid Settings</h5>
                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Grid Size (px)</label>
                            <input
                              type="number"
                              value={gridSize}
                              onChange={(e) => setGridSize(parseInt(e.target.value) || 10)}
                              min="5"
                              max="50"
                              className="w-full px-2 py-1 border rounded text-sm"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="snapToGrid"
                              checked={snapToGrid}
                              onChange={(e) => setSnapToGrid(e.target.checked)}
                              className="rounded"
                            />
                            <label htmlFor="snapToGrid" className="text-xs text-gray-600">
                              Snap to Grid
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="showRulers"
                              checked={showRulers}
                              onChange={(e) => setShowRulers(e.target.checked)}
                              className="rounded"
                            />
                            <label htmlFor="showRulers" className="text-xs text-gray-600">
                              Show Rulers
                            </label>
                          </div>
                        </div>
                      </div>
                      
                      {/* Keyboard Shortcuts Info */}
                      <div className="pt-2 border-t">
                        <h5 className="font-medium mb-2 text-sm">Keyboard Shortcuts</h5>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>• Arrow Keys: Move selected element (1px)</div>
                          <div>• Shift + Arrow: Move selected element (10px)</div>
                          <div>• Click element to select</div>
                          <div>• Drag to move, drag corners to resize</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketTemplates;

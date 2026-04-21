document.addEventListener('DOMContentLoaded', () => {
  // Initialize Fabric.js Canvas
  const canvasElement = document.getElementById('roomCanvas');
  if (!canvasElement) return; // Only run on design.html

  const canvas = new fabric.Canvas('roomCanvas', {
    backgroundColor: '#ffffff',
    preserveObjectStacking: true,
    selection: true
  });

  // Grid sizing
  const gridSize = 20;

  // Snap to grid functionality during object movement
  canvas.on('object:moving', function(options) { 
    options.target.set({
      left: Math.round(options.target.left / gridSize) * gridSize,
      top: Math.round(options.target.top / gridSize) * gridSize
    });
  });

  // UI Elements
  const propertiesPanel = document.getElementById('propertiesPanel');
  const noSelectionMsg = document.getElementById('noSelectionMsg');
  const propWidth = document.getElementById('propWidth');
  const propHeight = document.getElementById('propHeight');
  const propRotation = document.getElementById('propRotation');
  const propColor = document.getElementById('propColor');
  const deleteObjBtn = document.getElementById('deleteObjBtn');
  const floorColorInput = document.getElementById('floorColor');
  const clearBtn = document.getElementById('clearBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const saveLocalBtn = document.getElementById('saveLocalBtn');
  const beforeAfterToggle = document.getElementById('beforeAfterToggle');
  const themeBtns = document.querySelectorAll('.theme-btn');

  let isOriginalView = false;
  let savedDesignState = null;

  // Update properties panel when object is selected
  canvas.on('selection:created', updatePropertiesPanel);
  canvas.on('selection:updated', updatePropertiesPanel);
  canvas.on('selection:cleared', () => {
    propertiesPanel.style.display = 'none';
    noSelectionMsg.style.display = 'block';
  });
  canvas.on('object:modified', updatePropertiesPanel);

  function updatePropertiesPanel() {
    const activeObj = canvas.getActiveObject();
    if (!activeObj) return;

    propertiesPanel.style.display = 'block';
    noSelectionMsg.style.display = 'none';

    propWidth.value = Math.round(activeObj.width * activeObj.scaleX);
    propHeight.value = Math.round(activeObj.height * activeObj.scaleY);
    propRotation.value = Math.round(activeObj.angle);
    propColor.value = activeObj.fill || '#4F46E5';
  }

  // Handle properties changes
  propWidth.addEventListener('input', (e) => {
    const activeObj = canvas.getActiveObject();
    if (activeObj) {
      activeObj.set({ width: parseInt(e.target.value) / activeObj.scaleX });
      canvas.renderAll();
    }
  });

  propHeight.addEventListener('input', (e) => {
    const activeObj = canvas.getActiveObject();
    if (activeObj) {
      activeObj.set({ height: parseInt(e.target.value) / activeObj.scaleY });
      canvas.renderAll();
    }
  });

  propRotation.addEventListener('input', (e) => {
    const activeObj = canvas.getActiveObject();
    if (activeObj) {
      activeObj.set({ angle: parseInt(e.target.value) });
      canvas.renderAll();
    }
  });

  propColor.addEventListener('input', (e) => {
    const activeObj = canvas.getActiveObject();
    if (activeObj) {
      activeObj.set({ fill: e.target.value });
      canvas.renderAll();
    }
  });

  deleteObjBtn.addEventListener('click', () => {
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length) {
      canvas.discardActiveObject();
      activeObjects.forEach(function(object) {
        canvas.remove(object);
      });
    }
  });

  // Floor Color
  floorColorInput.addEventListener('input', (e) => {
    canvas.backgroundColor = e.target.value;
    canvas.renderAll();
  });

  // Drag and Drop Logic
  const items = document.querySelectorAll('.furniture-item');
  items.forEach(item => {
    item.addEventListener('dragstart', handleDragStart);
  });

  let draggedItemType = null;

  function handleDragStart(e) {
    draggedItemType = this.getAttribute('data-type');
    e.dataTransfer.effectAllowed = 'copy';
  }

  const dropzone = document.getElementById('dropzone');
  
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    
    // Get drop coordinates relative to canvas
    const rect = canvasElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    addFurnitureToCanvas(draggedItemType, x, y);
  });

  function addFurnitureToCanvas(type, left, top) {
    let width = 100;
    let height = 100;
    let color = '#4F46E5'; // Default primary color
    let labelText = '';

    // Define basic shapes for different types
    switch(type) {
      case 'bed':
        width = 120;
        height = 160;
        labelText = 'Bed';
        break;
      case 'sofa':
        width = 140;
        height = 70;
        labelText = 'Sofa';
        color = '#10B981'; // Emerald
        break;
      case 'table':
        width = 100;
        height = 100;
        labelText = 'Table';
        color = '#F59E0B'; // Amber
        break;
      case 'chair':
        width = 50;
        height = 50;
        labelText = 'Chair';
        color = '#EF4444'; // Red
        break;
      case 'wardrobe':
        width = 120;
        height = 60;
        labelText = 'Wardrobe';
        color = '#6B7280'; // Gray
        break;
      default:
        width = 80;
        height = 80;
        labelText = 'Object';
    }

    // Snap drop coordinates
    left = Math.round(left / gridSize) * gridSize;
    top = Math.round(top / gridSize) * gridSize;

    // Create a rect
    const rect = new fabric.Rect({
      left: 0,
      top: 0,
      fill: color,
      width: width,
      height: height,
      rx: 5,
      ry: 5,
      shadow: new fabric.Shadow({
        color: 'rgba(0,0,0,0.3)',
        blur: 10,
        offsetX: 2,
        offsetY: 2
      })
    });

    // Create text label
    const text = new fabric.Text(labelText, {
      fontFamily: 'Poppins',
      fontSize: 16,
      fill: '#ffffff',
      left: width / 2,
      top: height / 2,
      originX: 'center',
      originY: 'center'
    });

    // Group them
    const group = new fabric.Group([rect, text], {
      left: left,
      top: top,
      transparentCorners: false,
      cornerColor: '#4F46E5',
      cornerStrokeColor: '#ffffff',
      borderColor: '#4F46E5',
      cornerSize: 10,
      padding: 5
    });

    // Override fill property for the group to modify the rect
    Object.defineProperty(group, 'fill', {
      get: function() { return this.item(0).fill; },
      set: function(val) { this.item(0).set('fill', val); }
    });

    canvas.add(group);
    canvas.setActiveObject(group);
  }

  // Clear Canvas
  clearBtn.addEventListener('click', () => {
    if(confirm('Are you sure you want to clear the design?')) {
      canvas.clear();
      canvas.backgroundColor = floorColorInput.value;
      canvas.renderAll();
    }
  });

  // Download PNG
  downloadBtn.addEventListener('click', () => {
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1
    });
    const link = document.createElement('a');
    link.download = 'my-room-design.png';
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // Save/Load LocalStorage
  saveLocalBtn.addEventListener('click', () => {
    const json = canvas.toJSON();
    localStorage.setItem('virtualRoomDesign', JSON.stringify(json));
    alert('Design saved locally!');
  });

  const savedDesign = localStorage.getItem('virtualRoomDesign');
  if (savedDesign) {
    canvas.loadFromJSON(savedDesign, canvas.renderAll.bind(canvas));
  }

  // Before/After Toggle
  beforeAfterToggle.addEventListener('change', (e) => {
    const isDesigned = e.target.checked;
    
    if (!isDesigned) {
      // Switch to "Original" (empty room)
      savedDesignState = canvas.toJSON();
      canvas.clear();
      canvas.backgroundColor = '#ffffff'; // default empty floor
      canvas.renderAll();
    } else {
      // Switch to "Designed"
      if (savedDesignState) {
        canvas.loadFromJSON(savedDesignState, canvas.renderAll.bind(canvas));
      }
    }
  });

  // Theme Presets
  themeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Update active state
      themeBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');

      const theme = e.target.getAttribute('data-theme');
      
      let newFloorColor = '#ffffff';
      
      switch(theme) {
        case 'modern':
          newFloorColor = '#f3f4f6'; // Light Gray
          break;
        case 'minimal':
          newFloorColor = '#ffffff'; // White
          break;
        case 'classic':
          newFloorColor = '#fef3c7'; // Light amber/wood tone
          break;
      }

      floorColorInput.value = newFloorColor;
      canvas.backgroundColor = newFloorColor;
      canvas.renderAll();
    });
  });

  // Add keyboard support for deleting objects
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      // Don't delete if typing in an input
      if (e.target.tagName.toLowerCase() === 'input') return;
      
      const activeObjects = canvas.getActiveObjects();
      if (activeObjects.length) {
        canvas.discardActiveObject();
        activeObjects.forEach(function(object) {
          canvas.remove(object);
        });
      }
    }
  });
});

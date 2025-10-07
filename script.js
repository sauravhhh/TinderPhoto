document.addEventListener('DOMContentLoaded', function() {
    const photoGrid = document.getElementById('photoGrid');
    const fileInput = document.getElementById('fileInput');
    const resetBtn = document.getElementById('resetBtn');
    const previewBtn = document.getElementById('previewBtn');
    const toast = document.getElementById('toast');
    const previewModal = document.getElementById('previewModal');
    const closeModal = document.querySelector('.close-modal');
    const previewMainPhoto = document.getElementById('previewMainPhoto');
    const previewPhotoBar = document.getElementById('previewPhotoBar');
    const downloadBtn = document.getElementById('downloadBtn');
    const arrangedModeBtn = document.getElementById('arrangedModeBtn');
    const originalModeBtn = document.getElementById('originalModeBtn');
    
    let currentMainPhotoIndex = 0;
    let photoData = [];
    let currentPreviewMode = 'arranged'; // 'arranged' or 'original'
    
    // Initialize photo grid
    function initGrid() {
        photoGrid.innerHTML = '';
        photoData = [];
        for (let i = 1; i <= 9; i++) {
            const slot = document.createElement('div');
            slot.className = 'photo-slot empty-slot';
            slot.dataset.position = i;
            slot.innerHTML = `<span class="photo-number">${i}</span>`;
            photoGrid.appendChild(slot);
            
            // Add click event to slot to upload/replace photo
            slot.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent drag events from triggering
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = function(e) {
                    const file = e.target.files[0];
                    if (file && file.type.match('image.*')) {
                        const reader = new FileReader();
                        reader.onload = function(event) {
                            // Create photo object with timestamp
                            const photoObj = {
                                src: event.target.result,
                                position: i,
                                timestamp: Date.now()
                            };
                            
                            slot.classList.remove('empty-slot');
                            slot.innerHTML = `
                                <img src="${photoObj.src}" alt="Photo">
                                <span class="photo-number">${i}</span>
                            `;
                            addDragEvents(slot);
                            
                            // Update photo data
                            updatePhotoData(photoObj, i);
                        };
                        reader.readAsDataURL(file);
                    }
                };
                input.click();
            });
        }
    }
    
    initGrid();
    
    // Update photo data array
    function updatePhotoData(newPhoto, position) {
        // If we're replacing a photo, remove the old one at this position
        photoData = photoData.filter(photo => photo.position !== position);
        
        // Add the new photo
        if (newPhoto) {
            photoData.push(newPhoto);
        }
        
        // Sort by position to maintain grid order
        photoData.sort((a, b) => parseInt(a.position) - parseInt(b.position));
    }
    
    // File input change handler
    fileInput.addEventListener('change', function(e) {
        const files = e.target.files;
        if (files.length > 9) {
            showToast('You can only upload up to 9 photos');
            return;
        }
        
        // Find empty slots
        const emptySlots = Array.from(document.querySelectorAll('.photo-slot.empty-slot'));
        
        for (let i = 0; i < Math.min(files.length, emptySlots.length); i++) {
            const file = files[i];
            if (!file.type.match('image.*')) {
                showToast(`${file.name} is not an image file`);
                continue;
            }
            
            const reader = new FileReader();
            reader.onload = function(event) {
                const slot = emptySlots[i];
                const position = slot.dataset.position;
                
                // Create photo object with timestamp
                const photoObj = {
                    src: event.target.result,
                    position: position,
                    timestamp: Date.now()
                };
                
                slot.classList.remove('empty-slot');
                slot.innerHTML = `
                    <img src="${photoObj.src}" alt="Photo">
                    <span class="photo-number">${position}</span>
                `;
                addDragEvents(slot);
                
                // Update photo data
                updatePhotoData(photoObj, position);
            };
            reader.readAsDataURL(file);
        }
        
        // Reset file input
        fileInput.value = '';
    });
    
    // Add drag events to photo slots
    function addDragEvents(slot) {
        slot.draggable = true;
        
        slot.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('text/plain', slot.dataset.position);
            slot.classList.add('dragging');
        });
        
        slot.addEventListener('dragend', function() {
            slot.classList.remove('dragging');
        });
        
        slot.addEventListener('dragover', function(e) {
            e.preventDefault();
            slot.classList.add('drag-over');
        });
        
        slot.addEventListener('dragleave', function() {
            slot.classList.remove('drag-over');
        });
        
        slot.addEventListener('drop', function(e) {
            e.preventDefault();
            slot.classList.remove('drag-over');
            
            const draggedPosition = e.dataTransfer.getData('text/plain');
            const draggedSlot = document.querySelector(`[data-position="${draggedPosition}"]`);
            const targetPosition = slot.dataset.position;
            
            if (draggedSlot !== slot) {
                // Swap photos
                const draggedHTML = draggedSlot.innerHTML;
                const targetHTML = slot.innerHTML;
                
                draggedSlot.innerHTML = targetHTML;
                slot.innerHTML = draggedHTML;
                
                // Update classes
                if (draggedSlot.querySelector('img')) {
                    draggedSlot.classList.remove('empty-slot');
                    addDragEvents(draggedSlot);
                } else {
                    draggedSlot.classList.add('empty-slot');
                }
                
                if (slot.querySelector('img')) {
                    slot.classList.remove('empty-slot');
                    addDragEvents(slot);
                } else {
                    slot.classList.add('empty-slot');
                }
                
                // Update photo data - we need to update the positions in photoData
                updatePhotoDataAfterDrag(draggedPosition, targetPosition);
            }
        });
    }
    
    // Update photo data after drag and drop
    function updatePhotoDataAfterDrag(draggedPosition, targetPosition) {
        const draggedPhoto = photoData.find(photo => photo.position === draggedPosition);
        const targetPhoto = photoData.find(photo => photo.position === targetPosition);
        
        if (draggedPhoto) {
            draggedPhoto.position = targetPosition;
        }
        
        if (targetPhoto) {
            targetPhoto.position = draggedPosition;
        }
        
        // Re-sort by position
        photoData.sort((a, b) => parseInt(a.position) - parseInt(b.position));
    }
    
    // Reset button handler
    resetBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to remove all photos?')) {
            initGrid();
            showToast('All photos have been removed');
        }
    });
    
    // Preview button handler
    previewBtn.addEventListener('click', function() {
        if (photoData.length === 0) {
            showToast('Please upload at least one photo');
            return;
        }
        
        // Set initial mode to arranged
        currentPreviewMode = 'arranged';
        renderPreview(currentPreviewMode);
        
        // Show modal
        previewModal.style.display = 'block';
    });
    
    // Render preview based on mode
    function renderPreview(mode) {
        currentPreviewMode = mode;
        currentMainPhotoIndex = 0;
        
        // Clear previous preview
        previewMainPhoto.innerHTML = '';
        previewPhotoBar.innerHTML = '';
        
        // Update active mode button
        arrangedModeBtn.classList.toggle('active', mode === 'arranged');
        originalModeBtn.classList.toggle('active', mode === 'original');
        
        // Get photos in the correct order
        let orderedPhotos;
        if (mode === 'arranged') {
            // Use photoData as is (sorted by position)
            orderedPhotos = [...photoData];
        } else {
            // Sort by timestamp (original upload order)
            orderedPhotos = [...photoData].sort((a, b) => a.timestamp - b.timestamp);
        }
        
        // Set main photo (first photo in the ordered list)
        if (orderedPhotos.length > 0) {
            previewMainPhoto.innerHTML = `
                <img src="${orderedPhotos[0].src}" alt="Main Photo">
            `;
        }
        
        // Set photo bar with all photos
        orderedPhotos.forEach((photo, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.className = 'preview-thumbnail';
            if (index === 0) {
                thumbnail.classList.add('active');
            }
            thumbnail.innerHTML = `
                <img src="${photo.src}" alt="Photo">
            `;
            
            thumbnail.addEventListener('click', function() {
                // Update main photo
                previewMainPhoto.innerHTML = `
                    <img src="${photo.src}" alt="Main Photo">
                `;
                
                // Update active thumbnail
                document.querySelectorAll('.preview-thumbnail').forEach(thumb => {
                    thumb.classList.remove('active');
                });
                thumbnail.classList.add('active');
                
                currentMainPhotoIndex = index;
            });
            
            previewPhotoBar.appendChild(thumbnail);
        });
    }
    
    // Mode button handlers
    arrangedModeBtn.addEventListener('click', function() {
        renderPreview('arranged');
    });
    
    originalModeBtn.addEventListener('click', function() {
        renderPreview('original');
    });
    
    // Download button handler
    downloadBtn.addEventListener('click', function() {
        // Get the current main photo src
        const mainPhotoImg = previewMainPhoto.querySelector('img');
        if (mainPhotoImg) {
            const link = document.createElement('a');
            link.href = mainPhotoImg.src;
            link.download = `tinder-photo-${currentPreviewMode}-${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast('Photo downloaded successfully');
        }
    });
    
    // Close modal when clicking on X or outside modal
    closeModal.addEventListener('click', function() {
        previewModal.style.display = 'none';
    });
    
    window.addEventListener('click', function(e) {
        if (e.target === previewModal) {
            previewModal.style.display = 'none';
        }
    });
    
    // Show toast message
    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
});

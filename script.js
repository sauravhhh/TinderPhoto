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
    const previewCaptureArea = document.getElementById('previewCaptureArea');
    const captureMainPhoto = document.getElementById('captureMainPhoto');
    const capturePhotoBar = document.getElementById('capturePhotoBar');
    
    let currentMainPhotoIndex = 0;
    let photoData = [];
    
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
        // Update photo data to ensure it's current
        updatePhotoData();
        
        if (photoData.length === 0) {
            showToast('Please upload at least one photo');
            return;
        }
        
        // Clear previous preview
        previewMainPhoto.innerHTML = '';
        previewPhotoBar.innerHTML = '';
        captureMainPhoto.innerHTML = '';
        capturePhotoBar.innerHTML = '';
        
        // Get photos in original order (by timestamp)
        const orderedPhotos = [...photoData].sort((a, b) => a.timestamp - b.timestamp);
        
        // Set main photo (first photo in the ordered list)
        if (orderedPhotos.length > 0) {
            previewMainPhoto.innerHTML = `
                <img src="${orderedPhotos[0].src}" alt="Main Photo">
            `;
            captureMainPhoto.innerHTML = `
                <img src="${orderedPhotos[0].src}" alt="Main Photo">
            `;
        }
        
        // Set photo bar with all photos
        orderedPhotos.forEach((photo, index) => {
            // Create preview thumbnail
            const previewThumbnail = document.createElement('div');
            previewThumbnail.className = 'preview-thumbnail';
            if (index === 0) {
                previewThumbnail.classList.add('active');
            }
            previewThumbnail.innerHTML = `
                <img src="${photo.src}" alt="Photo">
            `;
            
            previewThumbnail.addEventListener('click', function() {
                // Update main photo in preview
                previewMainPhoto.innerHTML = `
                    <img src="${photo.src}" alt="Main Photo">
                `;
                
                // Update main photo in capture area
                captureMainPhoto.innerHTML = `
                    <img src="${photo.src}" alt="Main Photo">
                `;
                
                // Update active thumbnail in preview
                document.querySelectorAll('.preview-thumbnail').forEach(thumb => {
                    thumb.classList.remove('active');
                });
                previewThumbnail.classList.add('active');
                
                // Update active thumbnail in capture area
                const captureThumbnails = document.querySelectorAll('.capture-thumbnail');
                captureThumbnails.forEach(thumb => {
                    thumb.classList.remove('active');
                });
                if (captureThumbnails[index]) {
                    captureThumbnails[index].classList.add('active');
                }
                
                currentMainPhotoIndex = index;
            });
            
            previewPhotoBar.appendChild(previewThumbnail);
            
            // Create capture thumbnail
            const captureThumbnail = document.createElement('div');
            captureThumbnail.className = 'capture-thumbnail';
            if (index === 0) {
                captureThumbnail.classList.add('active');
            }
            captureThumbnail.innerHTML = `
                <img src="${photo.src}" alt="Photo">
            `;
            
            capturePhotoBar.appendChild(captureThumbnail);
        });
        
        // Show modal
        previewModal.style.display = 'block';
    });
    
    // Download button handler
    downloadBtn.addEventListener('click', function() {
        // Use html2canvas to capture the preview area
        html2canvas(previewCaptureArea, {
            backgroundColor: '#ffffff',
            scale: 2, // Higher resolution
            logging: false,
            useCORS: true
        }).then(canvas => {
            // Create download link
            const link = document.createElement('a');
            link.download = 'tinder-profile-preview.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            showToast('Preview downloaded successfully');
        }).catch(error => {
            console.error('Error capturing preview:', error);
            showToast('Error downloading preview. Please try again.');
        });
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

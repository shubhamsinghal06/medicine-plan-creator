// Add new medicine input field
function addMedicine(containerId) {
    const container = document.getElementById(containerId);
    const inputGroup = document.createElement('div');
    inputGroup.className = 'medicine-input-group';
    inputGroup.innerHTML = `
        <input type="text" placeholder="Medicine name" class="medicine-input">
        <input type="text" placeholder="Dosage (e.g., 1 tablet)" class="dosage-input">
        <button class="remove-btn" onclick="removeMedicine(this)">×</button>
    `;
    container.appendChild(inputGroup);
}

// Remove medicine input field
function removeMedicine(button) {
    const inputGroup = button.parentElement;
    const container = inputGroup.parentElement;
    
    // Keep at least one input group per meal
    if (container.children.length > 1) {
        inputGroup.remove();
    } else {
        alert('Each meal time must have at least one medicine field.');
    }
}

// Collect medicines from a meal section
function collectMedicines(containerId) {
    const container = document.getElementById(containerId);
    const medicines = [];
    const inputGroups = container.querySelectorAll('.medicine-input-group');
    
    inputGroups.forEach(group => {
        const name = group.querySelector('.medicine-input').value.trim();
        const dosage = group.querySelector('.dosage-input').value.trim();
        
        if (name) {
            medicines.push({
                name: name,
                dosage: dosage || 'As prescribed'
            });
        }
    });
    
    return medicines;
}

// Generate PDF
function generatePDF() {
    // Get jsPDF from the global scope
    const { jsPDF } = window.jspdf;
    
    // Collect all data
    const patientName = document.getElementById('patient-name').value.trim() || 'Patient';
    const planDate = document.getElementById('plan-date').value || new Date().toISOString().split('T')[0];
    const notes = document.getElementById('notes').value.trim();
    
    const breakfast = collectMedicines('breakfast-inputs');
    const lunch = collectMedicines('lunch-inputs');
    const dinner = collectMedicines('dinner-inputs');
    const bedtime = collectMedicines('bedtime-inputs');
    
    // Check if at least one medicine is added
    if (breakfast.length === 0 && lunch.length === 0 && dinner.length === 0 && bedtime.length === 0) {
        alert('Please add at least one medicine to generate the plan.');
        return;
    }
    
    // Create PDF
    const doc = new jsPDF();
    
    // Set colors
    const primaryColor = [102, 126, 234]; // #667eea
    const secondaryColor = [118, 75, 162]; // #764ba2
    const textColor = [51, 51, 51];
    const lightGray = [240, 240, 240];
    
    // Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('Daily Medicine Plan', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text('Your personalized medication schedule', 105, 30, { align: 'center' });
    
    // Patient info section
    doc.setTextColor(...textColor);
    doc.setFontSize(11);
    let yPos = 50;
    
    doc.setFont(undefined, 'bold');
    doc.text('Patient Name:', 20, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(patientName, 60, yPos);
    
    yPos += 8;
    doc.setFont(undefined, 'bold');
    doc.text('Date:', 20, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(new Date(planDate).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    }), 60, yPos);
    
    yPos += 15;
    
    // Function to add meal section
    function addMealSection(title, medicines, startY) {
        let y = startY;
        
        // Check if we need a new page
        if (y > 250) {
            doc.addPage();
            y = 20;
        }
        
        // Meal header
        doc.setFillColor(...lightGray);
        doc.rect(15, y - 5, 180, 10, 'F');
        
        doc.setTextColor(...primaryColor);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(title, 20, y + 2);
        
        y += 12;
        
        if (medicines.length === 0) {
            doc.setTextColor(150, 150, 150);
            doc.setFontSize(10);
            doc.setFont(undefined, 'italic');
            doc.text('No medicines scheduled', 25, y);
            y += 8;
        } else {
            medicines.forEach((med, index) => {
                doc.setTextColor(...textColor);
                doc.setFontSize(11);
                doc.setFont(undefined, 'bold');
                doc.text(`${index + 1}. ${med.name}`, 25, y);
                
                doc.setFont(undefined, 'normal');
                doc.setFontSize(10);
                doc.setTextColor(100, 100, 100);
                doc.text(`Dosage: ${med.dosage}`, 30, y + 5);
                
                y += 12;
                
                // Check if we need a new page
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
            });
        }
        
        y += 5;
        return y;
    }
    
    // Add all meal sections
    yPos = addMealSection('Breakfast', breakfast, yPos);
    yPos = addMealSection('Lunch', lunch, yPos);
    yPos = addMealSection('Dinner', dinner, yPos);
    yPos = addMealSection('Bedtime', bedtime, yPos);
    
    // Add notes if present
    if (notes) {
        yPos += 5;
        
        // Check if we need a new page
        if (yPos > 240) {
            doc.addPage();
            yPos = 20;
        }
        
        doc.setFillColor(...lightGray);
        doc.rect(15, yPos - 5, 180, 10, 'F');
        
        doc.setTextColor(...primaryColor);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Additional Notes', 20, yPos + 2);
        
        yPos += 12;
        
        doc.setTextColor(...textColor);
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        
        // Word wrap for notes
        const splitNotes = doc.splitTextToSize(notes, 170);
        doc.text(splitNotes, 20, yPos);
        yPos += splitNotes.length * 5;
    }
    
    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 105, 290, { align: 'center' });
        doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
    }
    
    // Save the PDF
    const fileName = `Medicine_Plan_${patientName.replace(/\s+/g, '_')}_${planDate}.pdf`;
    doc.save(fileName);
}

// Set today's date as default
window.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('plan-date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    
    // Set up PDF upload handler
    const pdfUpload = document.getElementById('pdf-upload');
    pdfUpload.addEventListener('change', handlePDFUpload);
    
    // Configure PDF.js worker
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
});

// Handle PDF file upload
async function handlePDFUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const statusDiv = document.getElementById('upload-status');
    statusDiv.className = 'upload-status loading';
    statusDiv.textContent = '🔄 Reading PDF...';
    
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        let fullText = '';
        
        // Extract text from all pages
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
        }
        
        // Parse the extracted text
        const parsedData = parseMedicinePlan(fullText);
        
        if (parsedData) {
            populateForm(parsedData);
            statusDiv.className = 'upload-status success';
            statusDiv.textContent = '✅ PDF loaded successfully! Form has been populated.';
        } else {
            throw new Error('Could not parse medicine data from PDF');
        }
        
    } catch (error) {
        console.error('Error reading PDF:', error);
        statusDiv.className = 'upload-status error';
        statusDiv.textContent = '❌ Error reading PDF. Please make sure it\'s a valid medicine plan PDF.';
    }
}

// Parse medicine plan text and extract data
function parseMedicinePlan(text) {
    const data = {
        patientName: '',
        date: '',
        notes: '',
        breakfast: [],
        lunch: [],
        dinner: [],
        bedtime: []
    };
    
    try {
        // Extract patient name
        const nameMatch = text.match(/Patient Name:\s*(.+?)(?=Date:|$)/i);
        if (nameMatch) {
            data.patientName = nameMatch[1].trim();
        }
        
        // Extract date
        const dateMatch = text.match(/Date:\s*(.+?)(?=Breakfast|$)/i);
        if (dateMatch) {
            const dateStr = dateMatch[1].trim();
            // Try to parse the date
            const parsedDate = new Date(dateStr);
            if (!isNaN(parsedDate.getTime())) {
                data.date = parsedDate.toISOString().split('T')[0];
            }
        }
        
        // Extract medicines for each meal
        data.breakfast = extractMedicinesForMeal(text, 'Breakfast', 'Lunch');
        data.lunch = extractMedicinesForMeal(text, 'Lunch', 'Dinner');
        data.dinner = extractMedicinesForMeal(text, 'Dinner', 'Bedtime');
        data.bedtime = extractMedicinesForMeal(text, 'Bedtime', 'Additional Notes');
        
        // Extract notes
        const notesMatch = text.match(/Additional Notes\s*(.+?)(?=Generated on|$)/is);
        if (notesMatch) {
            data.notes = notesMatch[1].trim();
        }
        
        return data;
    } catch (error) {
        console.error('Error parsing medicine plan:', error);
        return null;
    }
}

// Extract medicines for a specific meal from text
function extractMedicinesForMeal(text, mealName, nextMealName) {
    const medicines = [];
    
    try {
        // Find the section for this meal
        const mealRegex = new RegExp(`${mealName}\\s*(.+?)(?=${nextMealName}|$)`, 'is');
        const mealMatch = text.match(mealRegex);
        
        if (!mealMatch) return medicines;
        
        const mealSection = mealMatch[1];
        
        // Skip if "No medicines scheduled"
        if (mealSection.includes('No medicines scheduled')) {
            return medicines;
        }
        
        // Extract medicine entries (format: "1. Medicine Name Dosage: dosage info")
        const medicinePattern = /\d+\.\s*(.+?)(?:Dosage:\s*(.+?)(?=\d+\.|$))/gis;
        let match;
        
        while ((match = medicinePattern.exec(mealSection)) !== null) {
            const name = match[1].trim();
            const dosage = match[2] ? match[2].trim() : 'As prescribed';
            
            if (name) {
                medicines.push({ name, dosage });
            }
        }
    } catch (error) {
        console.error(`Error extracting medicines for ${mealName}:`, error);
    }
    
    return medicines;
}

// Clear all medicine inputs in a container
function clearMedicineInputs(containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
}

// Populate form with parsed data
function populateForm(data) {
    // Clear existing inputs
    clearMedicineInputs('breakfast-inputs');
    clearMedicineInputs('lunch-inputs');
    clearMedicineInputs('dinner-inputs');
    clearMedicineInputs('bedtime-inputs');
    
    // Populate patient info
    if (data.patientName) {
        document.getElementById('patient-name').value = data.patientName;
    }
    if (data.date) {
        document.getElementById('plan-date').value = data.date;
    }
    if (data.notes) {
        document.getElementById('notes').value = data.notes;
    }
    
    // Populate medicines for each meal
    populateMealSection('breakfast-inputs', data.breakfast);
    populateMealSection('lunch-inputs', data.lunch);
    populateMealSection('dinner-inputs', data.dinner);
    populateMealSection('bedtime-inputs', data.bedtime);
}

// Populate a specific meal section with medicines
function populateMealSection(containerId, medicines) {
    const container = document.getElementById(containerId);
    
    if (medicines.length === 0) {
        // Add one empty input if no medicines
        const inputGroup = createMedicineInputGroup('', '');
        container.appendChild(inputGroup);
    } else {
        // Add one empty input at the top for adding new medicines
        const emptyInputGroup = createMedicineInputGroup('', '');
        container.appendChild(emptyInputGroup);
        
        // Add all medicines with populated values below
        medicines.forEach(med => {
            const inputGroup = createMedicineInputGroup(med.name, med.dosage);
            container.appendChild(inputGroup);
        });
    }
}

// Create a medicine input group with values
function createMedicineInputGroup(name, dosage) {
    const inputGroup = document.createElement('div');
    inputGroup.className = 'medicine-input-group';
    inputGroup.innerHTML = `
        <input type="text" placeholder="Medicine name" class="medicine-input" value="${name}">
        <input type="text" placeholder="Dosage (e.g., 1 tablet)" class="dosage-input" value="${dosage}">
        <button class="remove-btn" onclick="removeMedicine(this)">×</button>
    `;
    return inputGroup;
}



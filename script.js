// script.js
document.addEventListener('DOMContentLoaded', function() {
    const solutionForm = document.getElementById('solutionForm');
    const solutionsList = document.getElementById('solutionsList');
    
    // Load existing solutions
    loadSolutions();
    
    // Handle form submission
    solutionForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const solution = {
            id: Date.now(), // Unique ID for each solution
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            initialCode: document.getElementById('initialCode').value,
            finalCode: document.getElementById('finalCode').value,
            tags: document.getElementById('tags').value.split(',').map(tag => tag.trim()),
            notes: document.getElementById('notes').value,
            date: new Date().toISOString()
        };
        
        // Save solution
        saveSolution(solution);
        
        // Reset form
        solutionForm.reset();
        
        // Reload solutions
        loadSolutions();
    });
    
    function saveSolution(solution) {
        // Get existing solutions
        let solutions = JSON.parse(localStorage.getItem('solutions') || '[]');
        
        // Add new solution
        solutions.push(solution);
        
        // Save back to localStorage
        localStorage.setItem('solutions', JSON.stringify(solutions));
    }
    
    function loadSolutions() {
        // Get solutions from localStorage
        const solutions = JSON.parse(localStorage.getItem('solutions') || '[]');
        
        // Clear current list
        solutionsList.innerHTML = '';
        
        // Add each solution to the page
        solutions.forEach(solution => {
            const solutionCard = createSolutionCard(solution);
            solutionsList.appendChild(solutionCard);
        });
    }
    
    function createSolutionCard(solution) {
        const card = document.createElement('div');
        card.className = 'solution-card';
        
        card.innerHTML = `
            <h3>${solution.title}</h3>
            <p>${solution.description}</p>
            
            <h4>Initial Code:</h4>
            <pre class="code-block">${solution.initialCode}</pre>
            
            <h4>Final Solution:</h4>
            <pre class="code-block">${solution.finalCode}</pre>
            
            <div class="tags">
                ${solution.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
            
            <p><strong>Notes:</strong> ${solution.notes}</p>
            <p><small>Added: ${new Date(solution.date).toLocaleDateString()}</small></p>
        `;
        
        return card;
    }
});

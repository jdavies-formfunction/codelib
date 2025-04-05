// script.js

// login
let currentUser = null;

// Check authentication state
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        document.getElementById('loginContainer').style.display = 'none';
        document.querySelector('.layout').style.display = 'flex';
    } else {
        currentUser = null;
        document.getElementById('loginContainer').style.display = 'flex';
        document.querySelector('.layout').style.display = 'none';
    }
});

// Handle login
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    firebase.auth().signInWithEmailAndPassword(email, password)
        .catch((error) => {
            alert('Login failed: ' + error.message);
        });
});

// Add logout functionality
function logout() {
    firebase.auth().signOut();
}



document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const solutionForm = document.getElementById('solutionForm');
    const solutionsList = document.getElementById('solutionsList');
    const navLinks = document.querySelectorAll('.nav-link');
    const views = document.querySelectorAll('.view');
    const tagFilter = document.getElementById('tagFilter');
    const tagList = document.getElementById('tagList');

    // Load existing solutions and setup navigation
    loadSolutions();
    setupNavigation();
    updateTagFilter();

    // Handle form submission
    solutionForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const solution = {
            id: Date.now(),
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            initialCode: document.getElementById('initialCode').value,
            finalCode: document.getElementById('finalCode').value,
            additionalScripts: document.getElementById('additionalScripts').value,
            tags: document.getElementById('tags').value.split(',').map(tag => tag.trim()),
            notes: document.getElementById('notes').value,
            date: new Date().toISOString()
        };
        
        // Save solution
        saveSolution(solution);
        
        // Reset form
        solutionForm.reset();
        
        // Reload solutions and update tag filter
        loadSolutions();
        updateTagFilter();
    });

    // Navigation setup
    function setupNavigation() {
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetView = this.dataset.view;
                
                // Update active states
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                
                // Show/hide views
                views.forEach(view => {
                    view.classList.remove('active');
                    if (view.id === targetView + 'View') {
                        view.classList.add('active');
                    }
                });
                
                // Show/hide tag filter
                tagFilter.style.display = targetView === 'view' ? 'block' : 'none';
            });
        });
    }

    // Save solution to localStorage
    function saveSolution(solution) {
        let solutions = JSON.parse(localStorage.getItem('solutions') || '[]');
        solutions.push(solution);
        localStorage.setItem('solutions', JSON.stringify(solutions));
    }

    // Load and display solutions
    function loadSolutions() {
    console.log('Loading solutions...');
    const solutions = JSON.parse(localStorage.getItem('solutions') || '[]');
    console.log('Found solutions:', solutions);
    solutionsList.innerHTML = '';
        
        solutions.forEach(solution => {
            const solutionCard = createSolutionCard(solution);
            solutionsList.appendChild(solutionCard);
        });
    }

    // Create solution card
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
        
        ${solution.additionalScripts ? `
            <h4>Additional Scripts:</h4>
            <pre class="code-block">${solution.additionalScripts}</pre>
        ` : ''}
        
        <div class="tags">
            ${solution.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
        
        <p><strong>Notes:</strong> ${solution.notes}</p>
        <p><small>Added: ${new Date(solution.date).toLocaleDateString()}</small></p>
        
        <div class="button-group">
            <button class="edit-button" onclick="editSolution(${solution.id})">Edit Solution</button>
            <button class="delete-button" onclick="deleteSolution(${solution.id})">Delete Solution</button>
        </div>
    `;
    
    return card;
}

    // Update tag filter
    function updateTagFilter() {
        const solutions = JSON.parse(localStorage.getItem('solutions') || '[]');
        const allTags = new Set();
        
        solutions.forEach(solution => {
            solution.tags.forEach(tag => allTags.add(tag));
        });
        
        tagList.innerHTML = '';
        allTags.forEach(tag => {
            const tagContainer = document.createElement('div');
            tagContainer.innerHTML = `
                <input type="checkbox" id="tag-${tag}" class="tag-checkbox">
                <label for="tag-${tag}" class="tag-label">${tag}</label>
            `;
            tagList.appendChild(tagContainer);
            
            // Add event listener for tag filtering
            const checkbox = tagContainer.querySelector('input');
            checkbox.addEventListener('change', filterSolutions);
        });
    }

    // Filter solutions by tags
    function filterSolutions() {
        const selectedTags = Array.from(document.querySelectorAll('.tag-checkbox:checked'))
            .map(checkbox => checkbox.id.replace('tag-', ''));
        
        const solutions = JSON.parse(localStorage.getItem('solutions') || '[]');
        solutionsList.innerHTML = '';
        
        solutions.forEach(solution => {
            if (selectedTags.length === 0 || 
                selectedTags.some(tag => solution.tags.includes(tag))) {
                const solutionCard = createSolutionCard(solution);
                solutionsList.appendChild(solutionCard);
            }
        });
    }

    // Edit solution
    window.editSolution = function(id) {
        const solutions = JSON.parse(localStorage.getItem('solutions') || '[]');
        const solution = solutions.find(s => s.id === id);
        
        if (solution) {
            // Populate form with solution data
            document.getElementById('title').value = solution.title;
            document.getElementById('description').value = solution.description;
            document.getElementById('initialCode').value = solution.initialCode;
            document.getElementById('finalCode').value = solution.finalCode;
            document.getElementById('additionalScripts').value = solution.additionalScripts || '';
            document.getElementById('tags').value = solution.tags.join(', ');
            document.getElementById('notes').value = solution.notes;
            
            // Remove the old solution
            const updatedSolutions = solutions.filter(s => s.id !== id);
            localStorage.setItem('solutions', JSON.stringify(updatedSolutions));
            
            // Switch to Add New view
            document.querySelector('[data-view="add"]').click();
            
            // Reload solutions and update tag filter
            loadSolutions();
            updateTagFilter();
        }
    };
});

// Delete solution function
window.deleteSolution = function(id) {
    if (confirm('Are you sure you want to delete this solution?')) {
        const solutions = JSON.parse(localStorage.getItem('solutions') || '[]');
        const updatedSolutions = solutions.filter(s => s.id !== id);
        localStorage.setItem('solutions', JSON.stringify(updatedSolutions));
        
        // Reload solutions and update tag filter
        loadSolutions();
        updateTagFilter();
    }
};

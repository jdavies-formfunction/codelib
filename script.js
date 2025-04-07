// script.js

// Firebase Auth state observer
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        document.getElementById('loginContainer').style.display = 'none';
        document.querySelector('.layout').style.display = 'flex';
        loadSolutions(); // Load saved solutions
    } else {
        document.getElementById('loginContainer').style.display = 'flex';
        document.querySelector('.layout').style.display = 'none';
    }
});

// Handle login form submission
document.getElementById('loginForm').addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    firebase.auth().signInWithEmailAndPassword(email, password)
        .catch(error => alert(error.message));
});

// Switch between views
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        const view = link.getAttribute('data-view');
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(view + 'View').classList.add('active');

        // Show tag filter only in "View All"
        document.getElementById('tagFilter').style.display = (view === 'view') ? 'block' : 'none';
    });
});

// Handle solution form submission
document.getElementById('solutionForm').addEventListener('submit', async e => {
    e.preventDefault();

    const user = firebase.auth().currentUser;
    if (!user) return;

    const solution = {
        userId: user.uid,
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        initialCode: document.getElementById('initialCode').value,
        finalCode: document.getElementById('finalCode').value,
        additionalScripts: document.getElementById('additionalScripts').value,
        tags: document.getElementById('tags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
        notes: document.getElementById('notes').value,
        createdAt: new Date().toISOString()
    };

    try {
        await firebase.firestore().collection('solutions').add(solution);
        alert('Solution saved!');
        document.getElementById('solutionForm').reset();
        loadSolutions();
    } catch (error) {
        console.error('Error saving solution:', error);
        alert('Failed to save solution.');
    }
});

// Load solutions from Firestore
async function loadSolutions() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    const snapshot = await firebase.firestore()
        .collection('solutions')
        .where('userId', '==', user.uid)
        .orderBy('createdAt', 'desc')
        .get();

    const solutionsList = document.getElementById('solutionsList');
    solutionsList.innerHTML = '';

    const tagsSet = new Set();

    snapshot.forEach(doc => {
        const solution = doc.data();
        solution.id = doc.id;
        solution.tags.forEach(tag => tagsSet.add(tag));
        solutionsList.appendChild(createSolutionCard(solution));
    });

    renderTagFilters([...tagsSet]);
}

// Create solution card DOM
function createSolutionCard(solution) {
    const card = document.createElement('div');
    card.className = 'solution-card';
    card.setAttribute('data-tags', solution.tags.join(','));

    card.innerHTML = `
        <h3>${solution.title}</h3>
        <p>${solution.description}</p>
        <div class="code-block"><strong>Initial:</strong><br>${solution.initialCode}</div>
        <div class="code-block"><strong>Final:</strong><br>${solution.finalCode}</div>
        ${solution.additionalScripts ? `<div class="code-block"><strong>Additional Scripts:</strong><br>${solution.additionalScripts}</div>` : ''}
        ${solution.notes ? `<p><strong>Notes:</strong> ${solution.notes}</p>` : ''}
        <div class="tags">${solution.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>
    `;

    return card;
}

// Render tag filters
function renderTagFilters(tags) {
    const tagList = document.getElementById('tagList');
    tagList.innerHTML = '';
    tags.forEach(tag => {
        const id = `tag-${tag}`;
        tagList.innerHTML += `
            <input type="checkbox" class="tag-checkbox" id="${id}" value="${tag}">
            <label for="${id}" class="tag-label">${tag}</label>
        `;
    });

    document.querySelectorAll('.tag-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', filterSolutionsByTags);
    });
}

// Filter displayed solutions by selected tags
function filterSolutionsByTags() {
    const selectedTags = Array.from(document.querySelectorAll('.tag-checkbox:checked'))
        .map(cb => cb.value);

    document.querySelectorAll('.solution-card').forEach(card => {
        const cardTags = card.getAttribute('data-tags').split(',');
        const isVisible = selectedTags.length === 0 || selectedTags.some(tag => cardTags.includes(tag));
        card.style.display = isVisible ? '' : 'none';
    });
}

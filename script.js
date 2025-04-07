// Firebase Auth
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        document.querySelector('.layout').style.display = 'flex';
        document.getElementById('loginContainer').style.display = 'none';
        loadSolutions();
    } else {
        document.querySelector('.layout').style.display = 'none';
        document.getElementById('loginContainer').style.display = 'flex';
    }
});

// Login form submit
document.getElementById('loginForm').addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    firebase.auth().signInWithEmailAndPassword(email, password)
        .catch(err => alert(err.message));
});

// Logout function
document.getElementById('logoutButton').addEventListener('click', () => {
    firebase.auth().signOut().then(() => {
        // Handle UI changes after logging out
        document.querySelector('.layout').style.display = 'none';
        document.getElementById('loginContainer').style.display = 'flex';
        alert('Logged out successfully!');
    }).catch(err => alert(err.message));
});

// View switcher
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        const view = link.getAttribute('data-view');
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(view + 'View').classList.add('active');

        if (view === 'view') loadSolutions();
    });
});

// Firestore reference
const db = firebase.firestore();

// Save solution
document.getElementById('solutionForm').addEventListener('submit', e => {
    e.preventDefault();

    const user = firebase.auth().currentUser;
    if (!user) return;

    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const initialCode = document.getElementById('initialCode').value;
    const finalCode = document.getElementById('finalCode').value;
    const additionalScripts = document.getElementById('additionalScripts').value;
    const tags = document.getElementById('tags').value.split(',').map(t => t.trim()).filter(Boolean);
    const notes = document.getElementById('notes').value;

    db.collection('solutions').add({
        uid: user.uid,
        title,
        description,
        initialCode,
        finalCode,
        additionalScripts,
        tags,
        notes,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        document.getElementById('solutionForm').reset();
        alert('Solution saved!');
    }).catch(err => console.error('Error saving solution:', err));
});

// Load and display solutions
function loadSolutions(selectedTags = []) {
    const user = firebase.auth().currentUser;
    if (!user) return;

    db.collection('solutions')
        .where('uid', '==', user.uid)
        .orderBy('createdAt', 'desc')
        .get()
        .then(snapshot => {
            const list = document.getElementById('solutionsList');
            list.innerHTML = '';

            const allTags = new Set();

            snapshot.forEach(doc => {
                const data = doc.data();
                const docId = doc.id;

                if (
                    selectedTags.length &&
                    !selectedTags.every(tag => data.tags?.includes(tag))
                ) {
                    return; // Skip if it doesn't match the filter
                }

                const card = document.createElement('div');
                card.className = 'solution-card';

                card.innerHTML = `
                    <h3>${data.title}</h3>
                    <p>${data.description}</p>
                    <div class="code-block"><strong>Initial:</strong><br>${data.initialCode}</div>
                    <div class="code-block"><strong>Final:</strong><br>${data.finalCode}</div>
                    ${data.additionalScripts ? `<div class="code-block"><strong>Scripts:</strong><br>${data.additionalScripts}</div>` : ''}
                    <div class="code-block"><strong>Notes:</strong><br>${data.notes || ''}</div>
                    <div class="tags">${(data.tags || []).map(tag => {
                        allTags.add(tag);
                        return `<span class="tag">${tag}</span>`;
                    }).join('')}</div>
                `;

                list.appendChild(card);
            });

            renderTagFilters(Array.from(allTags), selectedTags);
        });
}

// Render tag checkboxes
function renderTagFilters(tags, selectedTags = []) {
    const container = document.getElementById('tagList');
    const wrapper = document.getElementById('tagFilter');
    container.innerHTML = '';

    if (tags.length === 0) {
        wrapper.style.display = 'none';
        return;
    }

    wrapper.style.display = 'block';

    tags.forEach(tag => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `tag-${tag}`;
        checkbox.className = 'tag-checkbox';
        checkbox.value = tag;
        checkbox.checked = selectedTags.includes(tag);

        const label = document.createElement('label');
        label.className = 'tag-label';
        label.htmlFor = `tag-${tag}`;
        label.textContent = tag;

        checkbox.addEventListener('change', () => {
            const selected = Array.from(container.querySelectorAll('.tag-checkbox:checked')).map(cb => cb.value);
            loadSolutions(selected);
        });

        container.appendChild(checkbox);
        container.appendChild(label);
    });
}

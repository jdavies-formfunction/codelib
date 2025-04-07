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

// Logout functionality
document.getElementById('logoutButton').addEventListener('click', () => {
    firebase.auth().signOut().then(() => {
        console.log('User logged out');
        document.getElementById('loginContainer').style.display = 'flex';
        document.querySelector('.layout').style.display = 'none';
    }).catch((error) => {
        console.error('Error logging out:', error);
    });
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

function loadSolutions(selectedTags = []) {
    const user = firebase.auth().currentUser;
    if (!user) {
        console.log('No user logged in');
        return;
    }

    console.log('Loading solutions for user:', user.uid);

    db.collection('solutions')
        .where('uid', '==', user.uid)
        .orderBy('createdAt', 'desc')
        .get()
        .then(snapshot => {
            console.log('Snapshot:', snapshot);
            const list = document.getElementById('solutionsList');
            list.innerHTML = ''; // Clear previous list

            const allTags = new Set();

            snapshot.forEach(doc => {
                const data = doc.data();
                console.log('Solution data:', data);

                if (
                    selectedTags.length &&
                    !selectedTags.every(tag => data.tags?.includes(tag))
                ) {
                    return; // Skip if it doesn't match the filter
                }

                const card = document.createElement('div');
                card.className = 'solution-card';
                card.dataset.id = doc.id; // Store the solution ID on the card

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
                    <div class="button-group">
                        <button class="delete-button">Delete</button>
                    </div>
                `;

                // Add event listener for delete button
                const deleteButton = card.querySelector('.delete-button');
                deleteButton.addEventListener('click', () => {
                    const solutionId = card.dataset.id;

                    // Delete from Firestore
                    db.collection('solutions').doc(solutionId).delete()
                        .then(() => {
                            console.log('Solution deleted from Firestore');
                            card.remove(); // Remove from the DOM
                        })
                        .catch(error => {
                            console.error('Error deleting solution:', error);
                        });
                });

                list.appendChild(card);
            });

            renderTagFilters(Array.from(allTags), selectedTags);
        })
        .catch(error => {
            console.error('Error loading solutions:', error);
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
/*
// Firebase authentication state listener
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        // User is authenticated, proceed with migration
        migrateSolutions(user);
    } else {
        console.error('No user logged in! Cannot migrate solutions.');
    }
});

// Function to migrate solutions
function migrateSolutions(user) {
    // Retrieve solutions from localStorage
    const solutions = JSON.parse(localStorage.getItem('solutions'));
    
    if (solutions && solutions.length > 0) {
        console.log('Solutions found in localStorage:', solutions);

        solutions.forEach(solution => {
            console.log('Migrating solution:', solution);

            // Use the logged-in user's UID
            db.collection('solutions').add({
                uid: user.uid,  // Ensure the user UID is used
                title: solution.title,
                description: solution.description,
                initialCode: solution.initialCode,
                finalCode: solution.finalCode,
                additionalScripts: solution.additionalScripts,
                tags: solution.tags,
                notes: solution.notes,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                console.log('Solution successfully added to Firestore');
            }).catch(err => {
                console.error('Error saving solution to Firestore:', err);
            });
        });
    } else {
        console.log('No solutions found in localStorage');
    }
}
*/

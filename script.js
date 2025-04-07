function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Firebase Auth
firebase.auth().onAuthStateChanged(user => {
    console.log("User state changed:", user); // Debug log
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
        .then(() => {
            console.log('User logged in successfully');
        })
        .catch(err => {
            alert(err.message);
            console.error("Login Error:", err);
        });
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
        document.getElementById('title').focus(); // Focus on the title input after form reset
        alert('Solution saved!');
    }).catch(err => {
        console.error('Error saving solution:', err);
    });
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
            list.innerHTML = '';

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

                card.innerHTML = `
    <h3>${escapeHtml(data.title)}</h3>
    <p>${escapeHtml(data.description)}</p>
    <div class="code-block"><strong>Initial:</strong><br>${escapeHtml(data.initialCode)}</div>
    <div class="code-block"><strong>Final:</strong><br>${escapeHtml(data.finalCode)}</div>
    ${data.additionalScripts ? `<div class="code-block"><strong>Scripts:</strong><br>${escapeHtml(data.additionalScripts)}</div>` : ''}
    <div class="code-block"><strong>Notes:</strong><br>${escapeHtml(data.notes || '')}</div>
    <div class="tags">${(data.tags || []).map(tag => {
        allTags.add(tag);
        return `<span class="tag">${escapeHtml(tag)}</span>`;
    }).join('')}</div>
    <div class="button-group">
        <button class="view-button" data-id="${doc.id}">View</button>
        <button class="edit-button" data-id="${doc.id}">Edit</button>
        <button class="delete-button" data-id="${doc.id}">Delete</button>
    </div>
`;
list.appendChild(card);
});
            renderTagFilters(Array.from(allTags), selectedTags);

            // Add event listener for "View" buttons
            document.querySelectorAll('.view-button').forEach(button => {
                button.addEventListener('click', () => {
                    const id = button.getAttribute('data-id');
                    expandSolutionView(id);
                });
            });

            // Add event listener for "Delete" buttons
            document.querySelectorAll('.delete-button').forEach(button => {
                button.addEventListener('click', () => {
                    const id = button.getAttribute('data-id');
                    deleteSolution(id);
                });
            });

            // Add event listener for "Edit" buttons
            document.querySelectorAll('.edit-button').forEach(button => {
                button.addEventListener('click', () => {
                    const id = button.getAttribute('data-id');
                    editSolution(id);
                });
            });

        })
        .catch(error => {
            console.error('Error loading solutions:', error);
        });
}

// Function to delete a solution
function deleteSolution(id) {
    const user = firebase.auth().currentUser;
    if (!user) return;

    db.collection('solutions').doc(id).delete()
        .then(() => {
            console.log('Solution deleted');
            loadSolutions(); // Reload the list of solutions after deletion
        })
        .catch(error => {
            console.error('Error deleting solution:', error);
        });
}

// Function to edit a solution
function editSolution(id) {
    const user = firebase.auth().currentUser;
    if (!user) {
        console.error('No user logged in');
        alert('You must be logged in to edit solutions');
        return;
    }

    console.log('Attempting to edit solution with ID:', id);

    db.collection('solutions').doc(id).get()
        .then(doc => {
            if (!doc.exists) {
                console.error('No solution found with ID:', id);
                alert('Solution not found');
                return;
            }

            const data = doc.data();
            console.log('Retrieved solution data:', data);

            if (data) {
                // Populate the solution form with existing data
                document.getElementById('title').value = data.title || '';
                document.getElementById('description').value = data.description || '';
                document.getElementById('initialCode').value = data.initialCode || '';
                document.getElementById('finalCode').value = data.finalCode || '';
                document.getElementById('additionalScripts').value = data.additionalScripts || '';
                document.getElementById('tags').value = (data.tags || []).join(', ');
                document.getElementById('notes').value = data.notes || '';

                // Store the solution ID for the update
                document.getElementById('solutionForm').dataset.solutionId = id;

                // Change the submit handler to update the solution
                document.getElementById('solutionForm').onsubmit = function(e) {
                    e.preventDefault();
                    const solutionId = this.dataset.solutionId;
                    if (solutionId) {
                        updateSolution(solutionId);
                    }
                };

                // Switch to the add view
                document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
                document.getElementById('addView').classList.add('active');
                
                // Update navigation
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                document.querySelector('[data-view="add"]').classList.add('active');
            }
        })
        .catch(error => {
            console.error('Detailed error when fetching solution:', {
                code: error.code,
                message: error.message,
                stack: error.stack
            });
            alert('Error loading solution for editing: ' + error.message);
        });
}

// Function to update a solution
function updateSolution(id) {
    const user = firebase.auth().currentUser;
    if (!user) return;

    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const initialCode = document.getElementById('initialCode').value.trim();
    const finalCode = document.getElementById('finalCode').value.trim();
    const additionalScripts = document.getElementById('additionalScripts').value.trim();
    const tags = document.getElementById('tags').value.split(',').map(t => t.trim()).filter(Boolean);
    const notes = document.getElementById('notes').value.trim();

    // Validate required fields
    if (!title) {
        alert('Title is required');
        return;
    }

    // Show loading state
    const submitButton = document.querySelector('#solutionForm button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Saving...';
    submitButton.disabled = true;

    db.collection('solutions').doc(id).update({
        title,
        description,
        initialCode,
        finalCode,
        additionalScripts,
        tags,
        notes,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        alert('Solution updated successfully!');
        document.getElementById('solutionForm').reset();
        // Remove the stored solution ID
        document.getElementById('solutionForm').removeAttribute('data-solution-id');
        // Switch back to the solutions list view
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById('solutionsView').classList.add('active');
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.querySelector('[data-view="solutions"]').classList.add('active');
        // Reload the solutions list
        loadSolutions();
    })
    .catch(err => {
        console.error('Error updating solution:', err);
        alert('Error updating solution: ' + err.message);
    })
    .finally(() => {
        // Restore button state
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
    });
}

// Function to show expanded view of a solution
function expandSolutionView(id) {
    const user = firebase.auth().currentUser;
    if (!user) return;

    db.collection('solutions').doc(id).get()
        .then(doc => {
            const data = doc.data();
            if (data) {
                const expandedView = document.getElementById('expandedView');
                expandedView.innerHTML = `
                    <h3>${data.title}</h3>
                    <p><strong>Description:</strong> ${data.description}</p>
                    <div class="code-block"><strong>Initial Code:</strong><br>${data.initialCode}</div>
                    <div class="code-block"><strong>Final Code:</strong><br>${data.finalCode}</div>
                    ${data.additionalScripts ? `<div class="code-block"><strong>Scripts:</strong><br>${data.additionalScripts}</div>` : ''}
                    <div class="code-block"><strong>Notes:</strong><br>${data.notes || ''}</div>
                    <div class="tags">${(data.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}</div>
                    <div class="button-group">
                        <button class="delete-button" data-id="${doc.id}">Delete</button>
                        <button class="return-button">Return to List</button>
                    </div>
                `;

                // Show the expanded view and hide the list
                document.getElementById('solutionsList').style.display = 'none';
                expandedView.style.display = 'block';

                // Add event listener for "Return to List" button
                document.querySelector('.return-button').addEventListener('click', () => {
                    document.getElementById('solutionsList').style.display = 'block';
                    expandedView.style.display = 'none';
                });

                // Add event listener for delete button in expanded view
                document.querySelector('.delete-button').addEventListener('click', () => {
                    deleteSolution(id);
                });
            }
        })
        .catch(error => {
            console.error('Error fetching solution:', error);
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

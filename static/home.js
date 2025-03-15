document.addEventListener('DOMContentLoaded', function() {
    const projectList = document.getElementById('project-list');
    const createButton = document.getElementById('create-project');
    const newProjectInput = document.getElementById('new-project-id');
    
    // Function to fetch projects from the backend
    function fetchProjects() {
        fetch('/list')
        .then(response => response.json())
        .then(projects => {
            // Convert modified timestamps to numbers for proper sorting
            projects.sort((a, b) => {
                const timeA = a.modified ? new Date(a.modified).getTime() : 0;
                const timeB = b.modified ? new Date(b.modified).getTime() : 0;
                return timeB - timeA; // Sort descending (most recent first)
            });
            
            projectList.innerHTML = '';
            projects.forEach(project => {
                const li = document.createElement('li');
                const id = project.id || "Undefined";
                const modified = project.modified ? new Date(project.modified).toLocaleString() : 'N/A';
                
                li.innerHTML = `<strong>ID:</strong> ${id} <br> <strong>Modified:</strong> ${modified}`;
                
                // Edit button redirects to /doc?id=<project-id>
                const editBtn = document.createElement('button');
                editBtn.textContent = 'Edit';
                editBtn.onclick = () => {
                    window.location.href = `/doc?id=${id}`;
                };
                
                // Delete button
                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Delete';
                deleteBtn.onclick = () => {
                    if (confirm(`Are you sure you want to delete project ${id}?`)) {
                        fetch(`/delete?id=${id}`, { method: 'DELETE' })
                        .then(res => res.json())
                        .then(result => {
                            alert(result.message || result.error);
                            fetchProjects(); // Refresh the list after deletion
                        })
                        .catch(error => {
                            console.error('Error deleting project:', error);
                        });
                    }
                };
                
                li.appendChild(editBtn);
                li.appendChild(deleteBtn);
                projectList.appendChild(li);
            });
        })
        .catch(error => {
            console.error('Error fetching projects:', error);
        });
    }
    
    // Create project redirection now points to /doc?id=<new_project_id>
    createButton.addEventListener('click', () => {
        const newProjectId = newProjectInput.value.trim();
        if (newProjectId) {
            window.location.href = `/doc?id=${newProjectId}`;
        } else {
            alert('Please enter a project id');
        }
    });
    
    // Initial fetch of projects when the page loads
    fetchProjects();
});

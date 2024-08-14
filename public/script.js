document.addEventListener("DOMContentLoaded", () => {
    const patientForm = document.getElementById("patientForm");
    const patientQueue = document.getElementById("patientQueue");
    const processPatientBtn = document.getElementById("processPatientBtn");

    let queue = [];

    // Load patient queue from server
    async function loadQueue() {
        const response = await fetch('/patients');
        queue = await response.json();
        updateQueueDisplay();
    }

    // Save patient queue to server
    async function saveQueue() {
        await fetch('/patients', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(queue)
        });
    }

    // Add a patient to the queue
    patientForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const priority = document.getElementById("priority").value;

        if (name === "") return;

        const patient = {
            name: name,
            priority: priority,
            arrivalTime: new Date().getTime(),
            isPresent: false
        };

        queue.push(patient);
        sortQueue();
        updateQueueDisplay();
        await saveQueue();

        patientForm.reset();
    });

    // Sort the queue by priority and arrival time
    function sortQueue() {
        queue.sort((a, b) => {
            if (a.priority !== b.priority) {
                return a.priority === "A" ? -1 : 1;
            }
            return a.arrivalTime - b.arrivalTime;
        });
    }

    function formatDate(timestamp) {
        const date = new Date(timestamp);

        const day = String(date.getDate()).padStart(2,'0');
        const month = String(date.getMonth()+1).padStart(2,'0');
        const year = date.getFullYear();

        const hours = String(date.getHours()).padStart(2,'0');
        const minutes = String(date.getMinutes()).padStart(2,'0');
        const seconds = String(date.getSeconds()).padStart(2,'0');

        return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
    }

    // Update the queue display in the UI
    function updateQueueDisplay() {
        patientQueue.innerHTML = "";
    
        queue.forEach((patient, index) => {
            const formattedTime = formatDate(patient.arrivalTime);
    
            const listItem = document.createElement("li");
            listItem.className = `patient-item ${patient.priority === "A" ? "critical" : "routine"}`;

            listItem.innerHTML = `
            <div class="patient-details">
            <span class="patient-name">${index + 1}. ${patient.name} (${patient.priority})</span>
            <span class="arrival-time">Time: ${formattedTime}</span>
            </div>
            <input type="checkbox" class="present-checkbox" id="present-${index}" data-index="${index}" ${patient.isPresent ? 'checked' : ''}>
            <label for="present-${index}" class="checkbox-label">Present</label>
            <button class="delete-btn" data-index="${index}" title="Delete this patient">
                <i class="fas fa-trash-alt"></i> Delete
            </button>
            `;
    
            patientQueue.appendChild(listItem);
    
            // Handle delete button click
            listItem.querySelector('.delete-btn').addEventListener('click', async (e) => {
                const index = e.target.getAttribute('data-index');
                const patientName = queue[index].name;
    
                const confirmDelete = confirm(`Are you sure you want to delete patient ${patientName}?`);
                if (confirmDelete) {
                    listItem.classList.add('removing'); // Add the removing class for the animation
                    setTimeout(() => {
                        queue.splice(index, 1); // Remove the patient from the queue
                        sortQueue();  // Re-sort after deletion
                        updateQueueDisplay(); // Update the UI
                        saveQueue(); // Save the updated queue
                        //alert(`${patientName} has been deleted.`);
                    }, 500); // Match this time with the slideOut animation duration
                }
            });
        });
    
        // Add event listeners to the checkboxes
        document.querySelectorAll('.present-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', async (e) => {
                const index = e.target.getAttribute('data-index');
                queue[index].isPresent = e.target.checked;
                await saveQueue();
            });
        });
    }
    

    // Process the next patient in the queue
    processPatientBtn.addEventListener("click", async () => {
        let nextPatient;
        let allAbsent = true;

        for (let i = 0; i < queue.length; i++) {
            if (queue[i].isPresent) {
                allAbsent = false;
                break;
            }
        }

        if (allAbsent) {
            alert("No patients currently present. Please wait for the patients to arrive.");
            return;
        }

        for (let i = 0; i < queue.length; i++) {
            nextPatient = queue[i];

            if (nextPatient.isPresent) {
                queue.splice(i, 1);
                sortQueue();  // Ensure the queue is re-sorted after processing a patient
                updateQueueDisplay();
                await saveQueue();
                alert(`Processing patient: ${nextPatient.name}`);
                break;
            } else {
                alert(`${nextPatient.name} is not present. Skipping and reordering the queue.`);
                queue.push(queue.splice(i, 1)[0]);
                sortQueue();  // Re-sort after skipping a patient
                updateQueueDisplay();
                await saveQueue();
            }
        }

        // if (queue.length === 0) {
        //     alert("No patients in the queue");
        // }
    });

    // Load the queue initially
    loadQueue();
});

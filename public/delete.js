import {
  message,
  token,
  enableInput,
} from "./index.js";
import { showJobs } from "./jobs.js";

export const deleteJob = async (jobId) => {
    enableInput(false);
    console.log("Delete button clicked and deleteJob called.")
    console.log("Job ID:" , jobId)
    if (!jobId) {
        console.log("No job ID provided")
    } else {
        try {
            console.log("Trying to delete job")
            let method = "DELETE"
            let url = `/api/v1/jobs/${jobId}`

            const response = await fetch(url, 
                {
                    method: method,
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();
            if (response.status === 200) {
                message.textContent = "The job was successfully deleted"
                showJobs()
                enableInput(true)
                console.log("Job deleted successfully.")
            } else {
                // might happen if the list has been updated since last display
                message.textContent = "The jobs entry was not found";
                enableInput(true)
            }
        } catch (err) {
            console.log(err)
            message.textContent = "There was a problem deleting the job entry."
            enableInput(true)
        }
    }
}
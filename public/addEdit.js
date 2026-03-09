import {
  inputEnabled,
  setDiv,
  message,
  token,
  enableInput,
} from "./index.js";
import { showJobs } from "./jobs.js";

let addEditDiv = null;
let company = null;
let position = null;
let month = null;
let addingJob = null;
let editCancel = null;
let day = null;

export const handleAddEdit = () => {
  addEditDiv = document.getElementById("edit-job");
  company = document.getElementById("company");
  position = document.getElementById("position");
  month = document.getElementById("month");
  day = document.getElementById("day");
  addingJob = document.getElementById("adding-job");
  editCancel = document.getElementById("edit-cancel");

  const daysInMonth = {
    January: 31,
    February: 28,
    March: 31,
    April: 30,
    May: 31,
    June: 30,
    July: 31,
    August: 31,
    September: 30,
    October: 31,
    November: 30,
    December: 31,
  };

  const validateDay = () => {
    const max = daysInMonth[month.value] || 31;
    day.max = String(max);

    if (day.value === "") {
      day.setCustomValidity("Please enter a day");
      return false;
    }

    const value = Number(day.value);

    if (!Number.isInteger(value)) {
      day.setCustomValidity("Day must be a whole number");
      return false;
    }

    if (value < 1 || value > max) {
      day.setCustomValidity(`Please enter a day from 1 to ${max} for ${month.value}`);
      return false;
    }

    day.setCustomValidity("");
    return true;
  };

  month.addEventListener("change", validateDay);
  day.addEventListener("input", validateDay);
  validateDay();

  addEditDiv.addEventListener("click", async (e) => {
    if (inputEnabled && e.target.nodeName === "BUTTON") {
      if (e.target === addingJob) {
        if (!validateDay()) {
          day.reportValidity();
          return;
        }

        enableInput(false);

        let method = "POST";
        let url = "/friendsBday";

        if (addingJob.textContent === "update") {
          method = "POST";
          url = `/friendsBday/update/${addEditDiv.dataset.id}`;
        }

        if (!validateDay()) {
          enableInput(true);
          return;
        }

        try {
          const response = await fetch(url, {
            method: method,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              company: company.value,
              position: position.value,
              month: month.value,
              day: day.value,
            }),
          });

          const data = await response.json();
          if (response.status === 200 || response.status === 201) {
            if (response.status === 200) {
              // a 200 is expected for a successful update
              message.textContent = "The job entry was updated.";
            } else {
              // 201 indicates a successful create
              message.textContent = "The job entry was created.";
            }

            company.value = "";
            position.value = "";
            month.value = "January";
            day.value = "1";
            showJobs();
          } else {
            message.textContent = data.msg;
          }
        } catch (err) {
          console.log(err);
          message.textContent = "A communication error occurred.";
        }
        enableInput(true);
      } else if (e.target === editCancel) {
        message.textContent = "";
        showJobs();
      }
    }
  });
};

export const showAddEdit = async (jobId) => {
  if (!jobId) {
    company.value = "";
    position.value = "";
    month.value = "January";
    day.value = "1";
    addingJob.textContent = "add";
    message.textContent = "";

    setDiv(addEditDiv);
  } else {
    enableInput(false);

    try {
      const response = await fetch(`/friendsBday/edit/${jobId}`, 
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (response.status === 200) {
        company.value = data.job.company;
        position.value = data.job.position;
        month.value = data.job.status;
        day.value = data.job.day;
        addingJob.textContent = "update";
        message.textContent = "";
        addEditDiv.dataset.id = jobId;

        setDiv(addEditDiv);
      } else {
        // might happen if the list has been updated since last display
        message.textContent = "The jobs entry was not found";
        showJobs();
      }
    } catch (err) {
      console.log(err);
      message.textContent = "A communications error has occurred.";
      showJobs();
    }

    enableInput(true);
  }
  // setDiv(addEditDiv);
};
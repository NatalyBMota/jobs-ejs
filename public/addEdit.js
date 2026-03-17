import {
  inputEnabled,
  setDiv,
  message,
  token,
  enableInput,
} from "./index.js";
import { showFriendsBdays } from "./friendsBdays.js";

let addEditDiv = null;
let firstName = null;
let lastName = null;
let month = null;
let addingFriendBDay = null;
let editCancel = null;
let day = null;

export const handleAddEdit = () => {
  addEditDiv = document.getElementById("edit-job");
  firstName = document.getElementById("firstName");
  lastName = document.getElementById("lastName");
  month = document.getElementById("month");
  day = document.getElementById("day");
  addingFriendBDay = document.getElementById("adding-job");
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
      if (e.target === addingFriendBDay) {
        if (!validateDay()) {
          day.reportValidity();
          return;
        }

        enableInput(false);

        let method = "POST";
        let url = "/friendsBday";

        if (addingFriendBDay.textContent === "update") {
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
              firstName: firstName.value,
              lastName: lastName.value,
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

            firstName.value = "";
            lastName.value = "";
            month.value = "January";
            day.value = "1";
            showFriendsBdays();
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
        showFriendsBdays();
      }
    }
  });
};

export const showAddEdit = async (jobId) => {
  if (!jobId) {
    firstName.value = "";
    lastName.value = "";
    month.value = "January";
    day.value = "1";
    addingFriendBDay.textContent = "add";
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
        firstName.value = data.job.firstName;
        lastName.value = data.job.lastName;
        month.value = data.job.birthdayMonth;
        day.value = data.job.birthdayDay;
        addingFriendBDay.textContent = "update";
        message.textContent = "";
        addEditDiv.dataset.id = jobId;

        setDiv(addEditDiv);
      } else {
        // might happen if the list has been updated since last display
        message.textContent = "The friends' birthday entry was not found";
        showFriendsBdays();
      }
    } catch (err) {
      console.log(err);
      message.textContent = "A communications error has occurred.";
      showFriendsBdays();
    }

    enableInput(true);
  }
  // setDiv(addEditDiv);
};
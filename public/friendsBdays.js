import {
  inputEnabled,
  setDiv,
  message,
  setToken,
  token,
  enableInput,
} from "./index.js";
import { showLoginRegister } from "./loginRegister.js";
import { showAddEdit } from "./addEdit.js";
import { deleteFriendBday } from "./delete.js";

let friendsBdaysDiv = null;
let friendsBdaysTable = null;
let friendsBdaysTableHeader = null;

export const handleFriendsBdays = () => {
  friendsBdaysDiv = document.getElementById("jobs");
  const logoffButton = document.getElementById("logoff");
  const addFriendBdayButton = document.getElementById("add-job");
  friendsBdaysTable = document.getElementById("friendsBDay-table");
  friendsBdaysTableHeader = document.getElementById("friendsBDay-table-header");

  friendsBdaysDiv.addEventListener("click", async (e) => {
    if (inputEnabled && e.target.nodeName === "BUTTON") {
      if (e.target === addFriendBdayButton) {
        try {
          enableInput(false);

          const response = await fetch("/friendsBday/new", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.status === 200) {
            showAddEdit(null);
          } else {
            const data = await response.json();
            message.textContent = data.msg;
          }
        } catch (err) {
          console.log(err);
          message.textContent = "A communication error occurred.";
        }
        enableInput(true);
      } else if (e.target === logoffButton) {
        setToken(null);

        message.textContent = "You have been logged off.";

        friendsBdaysTable.replaceChildren([friendsBdaysTableHeader]);

        showLoginRegister();
      } else if (e.target.classList.contains("editButton")) {
        message.textContent = "";
        showAddEdit(e.target.dataset.id);
      } else if (e.target.classList.contains("deleteButton")) {
        deleteFriendBday(e.target.dataset.id);
      }
    }
  });
};

export const showFriendsBdays = async () => {
  try {
    enableInput(false);

    const response = await fetch("/friendsBday", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    let children = [friendsBdaysTableHeader];

    if (response.status === 200) {
      const friendBdays = data.friendBdays || data.friendsBdays || [];

      if (friendBdays.length === 0) {
        friendsBdaysTableHeader.style.display = "none";
        friendsBdaysTable.replaceChildren(...children);
      } else {
        friendsBdaysTableHeader.style.display = "";
        for (let i = 0; i < friendBdays.length; i++) {
          let rowEntry = document.createElement("tr");

          let editButton = `<td><button type="button" class="editButton" data-id=${friendBdays[i]._id}>edit</button></td>`;
          let deleteButton = `<td><button type="button" class="deleteButton" data-id=${friendBdays[i]._id}>delete</button></td>`;
          let rowHTML = `
            <td>${friendBdays[i].firstName}</td>
            <td>${friendBdays[i].lastName}</td>
            <td>${friendBdays[i].birthdayMonth}</td>
            <td>${friendBdays[i].birthdayDay}</td>
            <div>${editButton}${deleteButton}</div>`;

          rowEntry.innerHTML = rowHTML;
          children.push(rowEntry);
        }
        friendsBdaysTable.replaceChildren(...children);
      }
    } else {
      message.textContent = data.msg;
    }
  } catch (err) {
    console.log(err);
    message.textContent = "A communication error occurred.";
  }
  enableInput(true);
  setDiv(friendsBdaysDiv);
};
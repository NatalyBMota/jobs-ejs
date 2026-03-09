document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const month = document.getElementById("month");
  const day = document.getElementById("day");

  if (!form || !month || !day) {
    return;
  }

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

  form.addEventListener("submit", (e) => {
    if (!validateDay()) {
      e.preventDefault();
      day.reportValidity();
    }
  });

  validateDay();
});
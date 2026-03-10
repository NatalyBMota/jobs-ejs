document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("register-form");
  const nameInput = document.getElementById("name");

  if (!form || !nameInput) {
    return;
  }

  // Letters and spaces only.
  const validNamePattern = /^[A-Za-z ]+$/;

  const validateName = ({ trimValue = false } = {}) => {
    const raw = nameInput.value;
    const trimmed = raw.trim();

    if (trimValue) {
      nameInput.value = trimmed;
    }

    if (trimmed.length === 0) {
      nameInput.setCustomValidity("Please enter your name.");
      return false;
    }

    if (!validNamePattern.test(trimmed)) {
      nameInput.setCustomValidity(
        "Name can contain letters and spaces only."
      );
      return false;
    }

    nameInput.setCustomValidity("");
    return true;
  };

  nameInput.addEventListener("input", () => {
    validateName();
  });

  nameInput.addEventListener("blur", () => {
    validateName({ trimValue: true });
  });

  form.addEventListener("submit", (e) => {
    const isValid = validateName({ trimValue: true });

    if (!isValid) {
      e.preventDefault();
      nameInput.reportValidity();
    }
  });
});
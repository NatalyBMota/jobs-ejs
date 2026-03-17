const puppeteer = require("puppeteer");
require("../app");
const { seed_db, testUserPassword, seededFriendCount } = require("../util/seed_db");

let testUser = null;
let page = null;
let browser = null;

describe("friends-bday puppeteer test", function () {
  before(async function () {
    this.timeout(15000);
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    page = await browser.newPage();
    await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
  });

  after(async function () {
    this.timeout(5000);
    await browser.close();
  });

  describe("index page test", function () {
    this.timeout(10000);

    it("finds the index page logon link", async function () {
      this.logonLink = await page.waitForSelector(
        'a[href="/sessions/logon"]',
      );
    });

    it("gets to the logon page", async function () {
      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle0" }),
        this.logonLink.click(),
      ]);

      await page.waitForSelector('input[name="email"]');
      await page.waitForSelector('input[name="password"]');
      await page.waitForSelector("button");
    });
  });

  describe("logon page test", function () {
    this.timeout(20000);

    it("sends the logon and reaches logged-in state", async function () {
      testUser = await seed_db();

      const email = await page.waitForSelector('input[name="email"]');
      const password = await page.waitForSelector('input[name="password"]');

      await email.type(testUser.email);
      await password.type(testUserPassword);

      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle0" }),
        page.click("button"),
      ]);

      await page.waitForSelector(`p::-p-text(${testUser.name} is logged on.)`);
      await page.waitForSelector('a[href="/secretWord"]');

      const copyr = await page.waitForSelector("p::-p-text(copyright)");
      const copyrText = await copyr.evaluate((el) => el.textContent);
      console.log("copyright text:", copyrText);
    });
  });
  describe("puppeteer friends birthdays list operations", function () {
    this.timeout(20000);

    it("opens Friends and Birthdays from home and lands on the correct route", async function () {
      const { expect } = await import("chai");

      // Ensure we are on the home page and still logged in
      await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
      await page.waitForSelector(`p::-p-text(${testUser.name} is logged on.)`);

      // Click the Friends and Birthdays link from the root page
      const friendsLink = await page.waitForSelector(
        "a::-p-text(Friends and Birthdays)",
      );

      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle0" }),
        friendsLink.click(),
      ]);

      // Confirm we reached the listing route
      expect(page.url()).to.equal("http://localhost:3000/friendsBday");
      await page.waitForSelector("h2::-p-text(Friends and Birthdays List)");
      await page.waitForSelector("#friendsBDay-table");
    });

    it("shows the expected number of friend rows for this logged-on user", async function () {
      const { expect } = await import("chai");

      const html = await page.content();

      // Limit the count to rows inside the friends table only
      const tableChunks = html.split('<table id="friendsBDay-table">');
      expect(tableChunks.length).to.be.greaterThan(1);

      const tableSection = tableChunks[1].split("</table>")[0];
      const trCount = tableSection.split("<tr").length - 1;
      const dataRowCount = trCount - 1; // subtract header row

      expect(dataRowCount).to.equal(seededFriendCount);
    });
    it("opens the add friend's birthday form and verifies the expected fields", async function () {
      const { expect } = await import("chai");

      // Start from the home page and confirm the user is still logged in
      await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
      await page.waitForSelector(`p::-p-text(${testUser.name} is logged on.)`);

      // Go to the Friends and Birthdays list from the root page
      const friendsLink = await page.waitForSelector(
        "a::-p-text(Friends and Birthdays)",
      );

      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle0" }),
        friendsLink.click(),
      ]);

      expect(page.url()).to.equal("http://localhost:3000/friendsBday");
      await page.waitForSelector("h2::-p-text(Friends and Birthdays List)");
      await page.waitForSelector("#friendsBDay-table");

      // Open the add form
      const addFriendButtonLink = await page.waitForSelector(
        'a[href="/friendsBday/new"]',
      );

      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle0" }),
        addFriendButtonLink.click(),
      ]);

      // Verify the add form page and all expected form controls
      expect(page.url()).to.equal("http://localhost:3000/friendsBday/new");
      await page.waitForSelector("h2::-p-text(Create a New Entry)");
      await page.waitForSelector('form[action="/friendsBday"]');
      await page.waitForSelector("#friendsBDay-form-table");

      const firstNameField = await page.waitForSelector('input[name="firstName"]');
      const lastNameField = await page.waitForSelector('input[name="lastName"]');
      const monthField = await page.waitForSelector('select[name="month"]');
      const dayField = await page.waitForSelector('input[name="day"]');
      const addButton = await page.waitForSelector('button[type="submit"]');

      expect(firstNameField).to.not.be.null;
      expect(lastNameField).to.not.be.null;
      expect(monthField).to.not.be.null;
      expect(dayField).to.not.be.null;
      expect(addButton).to.not.be.null;
    });
  });
});
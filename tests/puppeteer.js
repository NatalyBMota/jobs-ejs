const puppeteer = require("puppeteer");
require("../app");
const { seed_db, testUserPassword } = require("../util/seed_db");

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
});
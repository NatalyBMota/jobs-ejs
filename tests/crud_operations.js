const { app } = require("../app");
const FriendsBdays = require("../models/FriendsBdays");
const { seed_db, testUserPassword } = require("../util/seed_db");
const get_chai = require("../util/get_chai");

describe("tests for CRUD operations", function () {
  before(async function () {
    const { expect, request } = await get_chai();
    this.test_user = await seed_db();

    let req = request.execute(app).get("/sessions/logon").send();
    let res = await req;

    const textNoLineEnd = res.text.replaceAll("\n", "");
    this.csrfValue = /_csrf\" value=\"(.*?)\"/.exec(textNoLineEnd)[1];

    let cookies = res.headers["set-cookie"];
    this.csrfCookie = cookies.find((element) =>
      element.startsWith("csrfToken"),
    );

    const dataToPost = {
      email: this.test_user.email,
      password: testUserPassword,
      _csrf: this.csrfValue,
    };

    req = request
      .execute(app)
      .post("/sessions/logon")
      .set("Cookie", this.csrfCookie)
      .set("content-type", "application/x-www-form-urlencoded")
      .redirects(0)
      .send(dataToPost);

    res = await req;
    cookies = res.headers["set-cookie"];
    this.sessionCookie = cookies.find((element) =>
      element.startsWith("connect.sid"),
    );

    expect(this.csrfValue).to.not.be.undefined;
    expect(this.csrfCookie).to.not.be.undefined;
    expect(this.sessionCookie).to.not.be.undefined;
  });

  it("should get the friends birthday list with 20 entries", async function () {
    const { expect, request } = await get_chai();
    const req = request
      .execute(app)
      .get("/friendsBday")
      .set("Cookie", this.csrfCookie + ";" + this.sessionCookie)
      .send();

    const res = await req;
    expect(res).to.have.status(200);
    expect(res).to.have.property("text");

    const pageParts = res.text.split("<tr>");
    expect(pageParts.length).to.equal(21);
  });

  it("should add a new friends birthday entry", async function () {
    const { expect, request } = await get_chai();

    const dataToPost = {
      firstName: "Alice",
      lastName: "Baker",
      birthdayMonth: "January",
      birthdayDay: 15,
      _csrf: this.csrfValue,
    };

    const req = request
      .execute(app)
      .post("/friendsBday")
      .set("Cookie", this.csrfCookie + ";" + this.sessionCookie)
      .set("content-type", "application/x-www-form-urlencoded")
      .redirects(0)
      .send(dataToPost);

    const res = await req;
    expect(res).to.have.status(302);
    expect(res.headers.location).to.equal("/friendsBday");

    const friends = await FriendsBdays.find({ createdBy: this.test_user._id });
    expect(friends.length).to.equal(21);
  });
});
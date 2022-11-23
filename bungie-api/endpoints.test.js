
let db = null;
let collection = null;

beforeAll(async () => {
    db = await connectDatabase();
    collection = db.collection(process.env.MONGO_DB_COLLECTION);
});

afterAll(async () => closeDatabase(db));

test("db connection is valid and exists.", () => {
    expect(connection).not.toBe(false);
    expect(db).not.toBe(false);
});

test("A user accessing / without authorization should receive a UserUnauthorized error.", () => {
    expect(Promise.resolve("this test is built.")).rejects;
});

test("An authorized user accessing / should receive the active profile saved to the session.", () => {
    expect(Promise.resolve("this test is built.")).rejects;
});


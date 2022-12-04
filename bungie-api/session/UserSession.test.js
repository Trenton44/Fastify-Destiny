import UserSession from "./UserSession.js";

test("UserSession language should default to 'en'", 
    () => expect(new UserSession().language).toEqual("en")
);

test("if no session data is passed, constructor should create session data template.", 
    () => expect(new UserSession().data).toEqual(new UserSession().data)
);

test("UserSession.newUser should be set based on if session data was passed.", () => {
        expect(new UserSession({ test: "hello" }).newUser).toEqual(false);
        expect(new UserSession().newUser).toEqual(true);
});

test("UserSession.hasProfile should return true if any profile data exists.", () => {
    expect(new UserSession().hasProfile).toEqual(false);
    let temp = new UserSession();
    temp.data._user.profiles = {
        "pseudo-profile": {
            id: 123542,
            name: "Beans"
        }
    };
    expect(temp.hasProfile).toEqual(true);
});

test("Using JSON.stringify() on instance of UserSession should return UserSession.data.", () => {
    let mocksession = new UserSession().data;
    mocksession._user.language = "jp";
    mocksession._user.membershipId = 12094923;
    expect(JSON.stringify(new UserSession(mocksession))).toEqual(JSON.stringify(mocksession));
})

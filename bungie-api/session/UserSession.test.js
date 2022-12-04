import UserSession from "./UserSession.js";
import template from "./template.js";
console.log(template());

test("UserSession language should default to 'en'", 
    () => expect(new UserSession.data.language).toEqual("en")
);

test("if no session data is passed, constructor should create session data template.", 
    () => expect(new UserSession().data).toEqual(template())
);

test("UserSession.newUser should be set based on if session data was passed.", () => {
        expect(new UserSession(template()).newUser).toEqual(false);
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
describe("Using JSON.stringify() on instance of UserSession should return UserSession.data.", () => {
    test("Empty session should match base template.", () => {
        expect(JSON.stringify(new UserSession())).toEqual(JSON.stringify(template()))
    });
    test("Session with mock data.", () => {
        let mocksession = template();
        mocksession._user.language = "jp";
        mocksession._user.membershipId = 12094923;
        expect(JSON.stringify(new UserSession(mocksession))).toEqual(JSON.stringify(mocksession));
    });
})

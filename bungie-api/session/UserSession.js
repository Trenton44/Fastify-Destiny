export default class UserSession {
    constructor(data){ 
        // Base template if this is a new user, user data if it exists.
        this.newUser = !data;
        this.data = data ? data : {
            _authdata: {},
            _user: {
                language: "en",
                membershipId: null,
                active: null,
                profiles: {}
            }
        };
    }
    toJSON(){ return this.data; }
    get language(){ return this.data._user.language; }
    set language(language){ this.data._user.language = language; }
    get isLoggedIn(){
        for(let i in this.data._authdata)
            return true; // only reaches here if authdata is not empty.
        return false;
    }
    get hasProfile(){
        for(let i in this.data._user.profiles)
            return true; // only reaches here if a profile exists
        return false;
    }
    get userID(){ return this.data._user.membershipId; }
    get activeProfile(){ return this.data._user.profiles[this.data._user.active];  }
    set activeProfile(id){ this.data._user.active = id; }
    get userProfiles(){ return this.data._user.profiles; }
    set userProfiles(value){ this.data._user.profiles = value; }
    get accessToken(){ return this.data._authdata.access_token; }
    get refreshToken() { return this.data._authdata.refresh_token; }
    get accessExpires(){ return this.data._authdata.access_expires; }
    get refreshExpires(){ return this.data._authdata.refresh_expires; }
    set authData(data){
        this.data._authdata = {
            access_token: data.access_token,
            token_type: data.token_type,
            access_expires: Date.now() + data.expires_in,
            refresh_token: data.refresh_token,
            refresh_expires: Date.now() + data.refresh_expires_in
        };
        this.data._user.membershipId = data.membership_id;
        //session.cookie.maxAge = this.data._authdata.refresh_expires;
    }
    get logout(){}
};
const template = require("./template.js");

module.exports = class UserSession {
    constructor(data){ 
        if(!data)
            console.log("User has no existing data, new user.");
        // Base template if this is a new user, user data if it exists.
        this.data = !data ? template : data; 
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
    get activeProfile(){ return this.data._user.profiles[this.data._user.active]; }
    set activeProfile(id){ this.data._user.active = id; }
    get userProfiles(){ return {
        active: this.data._user.active,
        profiles: this.data._user.profiles
    }}
    get accessToken(){ return this.data._authdata.access_token; }
    get accessExpires(){ return this.data._authdata.access_expires; }
    get refreshExpries(){ return this.data._authdata.refresh_expires; }
    set authData(data){
        this.data._authdata = {
            access_token: data.access_token,
            token_type: data.token_type,
            access_expires: Date.now() + data.expires_in,
            refresh_token: data.refresh_token,
            refresh_expires: Date.now() + data.refresh_expires_in
        }
        this.data._user.membershipId = data.membership_id;
        //session.cookie.maxAge = this.data._authdata.refresh_expires;
    }
    get logout(){
        // TODO
    }
};
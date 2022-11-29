module.exports = (store) => {
    return {
        secret: process.env.SESSION_STORE_SECRET,
        cookieName: process.env.COOKIE_NAME,
        saveUninitialized: true,
        cookie: {
            path: "/",
            maxAge: 3600000, //1 Hour in milliseconds
            httpOnly: true,
            secure: true,
            sameSite: "None",
        },
        store: store
    };
};

module.exports.template = (session) => {
    return {
        _authdata: {},
        _user: {
            language: "en",
            membershipId: false,
            active: null,
            profiles: {}
        },
        get language(){ return this._user.language; },
        set language(language){ this._user.language = language; },
        get isLoggedIn(){
            for(let i in this._authdata)
                return true; // only reaches here if authdata is not empty.
            return false;
        },
        get activeProfile(){ return this._user.profiles[this._user.active]; },
        set activeProfile(id){ this._user.active = id; },
        get userProfiles(){ return {
            active: this._user.active,
            profiles: this._user.profiles
        }},
        get accessToken(){ return this._authdata.access_token; },
        get tokenExpirations(){
            return {
                access: this._authdata.access_expires,
                refresh: this._authdata.refresh_expires
            };
        },
        set authData(data){
            this._authdata = {
                access_token: data.access_token,
                token_type: data.token_type,
                access_expires: Date.now() + data.expires_in,
                refresh_token: data.refresh_token,
                refresh_expires: Date.now() + data.refresh_expires_in
            }
            this._user.membershipId = data.membership_id;
            session.cookie.maxAge = this._authdata.refresh_expires;
        },
        get logout(){
            // TODO
        }
    }
};

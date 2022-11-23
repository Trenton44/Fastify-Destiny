class UserUnauthorized extends Error{
    constructor(type, ...params){
        super(...params);
    }
}
class BungieUnavailable extends Error{
    constructor(type, ...params){
        super(...params);
    }
}
class RefreshTokenExpired extends Error{
    constructor(type, ...params){
        super(...params);
    }
}
module.exports = { UserUnauthorized, BungieUnavailable, RefreshTokenExpired };
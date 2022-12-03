export class UserUnauthorized extends Error{
    constructor(type, ...params){
        super(...params);
    }
}
export class BungieUnavailable extends Error{
    constructor(type, ...params){
        super(...params);
    }
}
export class RefreshTokenExpired extends Error{
    constructor(type, ...params){
        super(...params);
    }
}
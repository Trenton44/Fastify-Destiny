export default {
    method: "GET",
    url: "/",
    handler: GET
};

function GET(request, reply){
    // if user doesn't receive a response, this api is down
    // if user receives a BungieUnavailable error, request failed at preHandler, because bungie is down
    // if user recieves a UserUnauthorized error, request failed at preHandler because user has not logged in
    // if user gets here, both api's are functional, return the active Profile.
    return request.session.data.activeProfile;
}
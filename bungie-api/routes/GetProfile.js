module.exports = {
    method: "GET",
    url: "/GetProfile",
    schema: {
        "$ref": "/input/GetProfile#" 
    },
    handler: GET
}

async function GET(request, reply){
    const openapiuri = "/Destiny2/{membershipType}/Profile/{destinyMembershipId}/";
    let profile = request.session.user.activeProfile;
    let response = await request.BClient(
        request.InjectURI(openapiuri,{
            membershipType: profile.membershipType,
            destinyMembershipId: profile.destinyMembershipId
        }), 
        { params: { components: request.query.components }}
    ).catch( (error) => console.log(error));
    console.log(response);
}
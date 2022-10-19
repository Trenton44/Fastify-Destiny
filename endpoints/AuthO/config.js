
let GetMembershipData = {
    "components": {
        "schemas": {
            "User.UserMembershipData": {
                "transform": function(data){
                    console.log("Made it here!");
                    return data;
                }
            }
        }
    }
};

module.exports = {GetMembershipData};
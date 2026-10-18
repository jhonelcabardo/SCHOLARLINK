const admin = require("firebase-admin");

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

async function setAdminClaim() {
    try {
        const email = "scholarlink138@gmail.com";

        const user = await admin.auth().getUserByEmail(email);

        console.log("Admin user found:");
        console.log("UID:", user.uid);
        console.log("Email:", user.email);

        const existingClaims = user.customClaims || {};

        await admin.auth().setCustomUserClaims(user.uid, {
            ...existingClaims,
            role: "authenticated",
            appRole: "admin"
        });

        console.log("");
        console.log("=================================");
        console.log("ADMIN CLAIMS SET SUCCESSFULLY");
        console.log("=================================");
        console.log("UID:", user.uid);
        console.log("role: authenticated");
        console.log("appRole: admin");
        console.log("");
        console.log("Please sign out and sign in again as admin.");

        process.exit(0);

    } catch (error) {
        console.error("ERROR:", error);
        process.exit(1);
    }
}

setAdminClaim();
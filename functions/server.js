// ============================================================
// SCHOLARLINK QR LOGIN BACKEND
// Render + Express + Firebase Admin
// ============================================================

const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");


// ============================================================
// FIREBASE ADMIN INITIALIZATION
// ============================================================

let serviceAccount;

try {

    if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        throw new Error(
            "FIREBASE_SERVICE_ACCOUNT_JSON environment variable is missing."
        );
    }

    serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    );

    // Normalize private key newlines
    if (serviceAccount.private_key) {
        serviceAccount.private_key =
            serviceAccount.private_key.replace(/\\n/g, "\n");
    }

    // Validate required Firebase service account fields
    if (
        !serviceAccount.project_id ||
        !serviceAccount.client_email ||
        !serviceAccount.private_key
    ) {
        throw new Error(
            "Firebase service account is missing project_id, client_email, or private_key."
        );
    }

    console.log(
        "Firebase service account loaded for project:",
        serviceAccount.project_id
    );

}
catch (error) {

    console.error(
        "Firebase service account configuration error:",
        error.message
    );

    process.exit(1);
}


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});


const db = admin.firestore();

const adminAuth = admin.auth();


// ============================================================
// EXPRESS APP
// ============================================================

const app =
    express();


// ============================================================
// CORS
// ============================================================

app.use(
    cors({
        origin: true,
        methods: [
            "GET",
            "POST",
            "OPTIONS"
        ],
        allowedHeaders: [
            "Content-Type"
        ]
    })
);


// ============================================================
// JSON BODY PARSER
// ============================================================

app.use(
    express.json({
        limit: "1mb"
    })
);


// ============================================================
// BASIC SERVER TEST
// ============================================================

app.get(
    "/",
    (req, res) => {

        res.status(200).json({
            success: true,
            message:
                "ScholarLink QR Backend is running."
        });

    }
);


// ============================================================
// HEALTH CHECK
// ============================================================

app.get(
    "/health",
    (req, res) => {

        res.status(200).json({
            success: true,
            service:
                "ScholarLink QR Login Backend",
            status:
                "online"
        });

    }
);


// ============================================================
// SCHOLARLINK QR LOGIN
// ============================================================

app.post(
    "/qrLogin",
    async (req, res) => {

        try {

            // ----------------------------------------------------
            // GET QR TOKEN
            // ----------------------------------------------------

            const qrToken =
                String(
                    req.body?.qrToken || ""
                ).trim();


            console.log(
                "QR Login request received:",
                qrToken
            );


            // ----------------------------------------------------
            // CHECK QR TOKEN
            // ----------------------------------------------------

            if (!qrToken) {

                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "QR token is required."
                    });

            }


            // ----------------------------------------------------
            // BASIC QR TOKEN VALIDATION
            // ----------------------------------------------------

            if (
                !qrToken.startsWith("SLK-")
            ) {

                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Invalid ScholarLink QR token."
                    });

            }


            // ----------------------------------------------------
            // FIND SCHOLAR USING QR TOKEN
            // ----------------------------------------------------

            console.log(
                "Searching scholar by QR token..."
            );


            const scholarQuery =
                await db
                    .collection("scholars")
                    .where(
                        "qrToken",
                        "==",
                        qrToken
                    )
                    .limit(1)
                    .get();


            // ----------------------------------------------------
            // QR TOKEN NOT FOUND
            // ----------------------------------------------------

            if (
                scholarQuery.empty
            ) {

                console.warn(
                    "QR token is not registered:",
                    qrToken
                );


                return res
                    .status(401)
                    .json({
                        success: false,
                        message:
                            "This QR Code is not registered."
                    });

            }


            // ----------------------------------------------------
            // GET SCHOLAR DOCUMENT
            // ----------------------------------------------------

            const scholarDocument =
                scholarQuery.docs[0];


            const scholarData =
                scholarDocument.data();


            console.log(
                "Scholar document found:",
                scholarDocument.id
            );


            // ----------------------------------------------------
            // GET UID
            // ----------------------------------------------------

            const uid =
                scholarData.uid ||
                scholarDocument.id;


            if (!uid) {

                console.error(
                    "Scholar record has no UID.",
                    {
                        documentId:
                            scholarDocument.id
                    }
                );


                return res
                    .status(500)
                    .json({
                        success: false,
                        message:
                            "Scholar account configuration is invalid."
                    });

            }


            // ----------------------------------------------------
            // CHECK SCHOLAR STATUS
            // ----------------------------------------------------

            const scholarStatus =
                String(
                    scholarData.status || ""
                )
                    .trim()
                    .toLowerCase();


            console.log(
                "Scholar status:",
                scholarStatus
            );


            if (
                scholarStatus !== "active"
            ) {

                return res
                    .status(403)
                    .json({
                        success: false,
                        message:
                            "This scholar account is not active."
                    });

            }


            // ----------------------------------------------------
            // GET USER DOCUMENT
            // ----------------------------------------------------

            const userReference =
                db
                    .collection("users")
                    .doc(uid);


            const userSnapshot =
                await userReference.get();


            if (
                !userSnapshot.exists
            ) {

                return res
                    .status(403)
                    .json({
                        success: false,
                        message:
                            "Scholar user account was not found."
                    });

            }


            const userData =
                userSnapshot.data();


            // ----------------------------------------------------
            // VERIFY SCHOLARLINK ROLE
            // ----------------------------------------------------

            const role =
                String(
                    userData.role || ""
                )
                    .trim()
                    .toLowerCase();


            console.log(
                "Scholar role:",
                role
            );


            if (
                role !== "scholar"
            ) {

                return res
                    .status(403)
                    .json({
                        success: false,
                        message:
                            "This QR Code can only be used by scholars."
                    });

            }


            // ----------------------------------------------------
            // VERIFY USER STATUS
            // ----------------------------------------------------

            const userStatus =
                String(
                    userData.status || ""
                )
                    .trim()
                    .toLowerCase();


            const scholarConfirmed =
                userData.scholarConfirmed === true;


            if (
                userStatus &&
                userStatus !== "active" &&
                !scholarConfirmed
            ) {

                return res
                    .status(403)
                    .json({
                        success: false,
                        message:
                            "Your scholar account is not active."
                    });

            }


            // ----------------------------------------------------
            // VERIFY FIREBASE AUTH ACCOUNT
            // ----------------------------------------------------

            let firebaseUser;


            try {

                firebaseUser =
                    await adminAuth.getUser(
                        uid
                    );

            }
            catch (error) {

                console.error(
                    "Firebase Auth user not found:",
                    error.message
                );


                return res
                    .status(403)
                    .json({
                        success: false,
                        message:
                            "The Firebase scholar account does not exist."
                    });

            }


            // ----------------------------------------------------
            // CHECK IF FIREBASE ACCOUNT IS DISABLED
            // ----------------------------------------------------

            if (
                firebaseUser.disabled
            ) {

                return res
                    .status(403)
                    .json({
                        success: false,
                        message:
                            "This Firebase account is disabled."
                    });

            }


            // ----------------------------------------------------
            // CREATE FIREBASE CUSTOM TOKEN
            // ----------------------------------------------------

            console.log(
                "Creating Firebase custom token..."
            );


            const customToken =
                await adminAuth
                    .createCustomToken(
                        uid,
                        {
                            role:
                                "authenticated",

                            appRole:
                                "scholar",

                            scholarId:
                                scholarData.scholarId ||
                                null
                        }
                    );


            // ----------------------------------------------------
            // SUCCESS
            // ----------------------------------------------------

            console.log(
                "Scholar QR login successful.",
                {
                    uid:
                        uid,

                    scholarId:
                        scholarData.scholarId ||
                        null
                }
            );


            return res
                .status(200)
                .json({
                    success: true,

                    customToken,

                    uid,

                    scholarId:
                        scholarData.scholarId ||
                        null
                });

        }


        // ========================================================
        // SERVER ERROR
        // ========================================================

        catch (error) {

            console.error(
                "ScholarLink QR login function error:"
            );

            console.error(
                error
            );


            return res
                .status(500)
                .json({
                    success: false,

                    message:
                        "QR login server error.",

                    // This is useful while testing.
                    // We can remove this later for production.
                    error:
                        error.message ||
                        "Unknown server error."
                });

        }

    }
);


// ============================================================
// 404 HANDLER
// ============================================================

app.use(
    (req, res) => {

        res.status(404).json({
            success: false,
            message:
                "Endpoint not found."
        });

    }
);


// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use(
    (error, req, res, next) => {

        console.error(
            "Unhandled server error:",
            error
        );


        res.status(500).json({
            success: false,
            message:
                "Internal server error."
        });

    }
);


// ============================================================
// START SERVER
// ============================================================

const PORT =
    process.env.PORT ||
    10000;


app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `ScholarLink QR Backend running on port ${PORT}`
        );

    }
);
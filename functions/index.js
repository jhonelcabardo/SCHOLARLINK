const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");

const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");

const logger = require("firebase-functions/logger");

initializeApp();

const db = getFirestore();
const adminAuth = getAuth();

// Limit concurrent containers to help control unexpected traffic.
setGlobalOptions({
  maxInstances: 10,
});

// ============================================================
// SCHOLARLINK QR LOGIN
// ============================================================
// The QR code must contain the scholar's permanent qrToken,
// for example:
//
// SLK-ABC123XYZ...
//
// The QR token is NEVER a Firebase password.
// The server verifies the token, verifies the scholar account,
// and then creates a Firebase Custom Token.
// ============================================================

exports.qrLogin = onRequest(
  {
    region: "us-central1",
    cors: true,
    maxInstances: 10,
  },

  async (request, response) => {
    // ----------------------------------------------------------
    // CORS
    // ----------------------------------------------------------

    response.set("Access-Control-Allow-Origin", "*");
    response.set(
      "Access-Control-Allow-Methods",
      "POST, OPTIONS"
    );
    response.set(
      "Access-Control-Allow-Headers",
      "Content-Type"
    );

    // Browser preflight request
    if (request.method === "OPTIONS") {
      return response.status(204).send("");
    }

    // Only POST is allowed
    if (request.method !== "POST") {
      return response.status(405).json({
        success: false,
        message: "Method not allowed.",
      });
    }

    try {
      // --------------------------------------------------------
      // GET QR TOKEN FROM REQUEST
      // --------------------------------------------------------

      const qrToken = String(
        request.body?.qrToken || ""
      ).trim();

      if (!qrToken) {
        return response.status(400).json({
          success: false,
          message: "QR token is required.",
        });
      }

      // --------------------------------------------------------
      // BASIC QR TOKEN VALIDATION
      // --------------------------------------------------------

      if (!qrToken.startsWith("SLK-")) {
        return response.status(400).json({
          success: false,
          message: "Invalid ScholarLink QR token.",
        });
      }

      // --------------------------------------------------------
      // FIND SCHOLAR USING QR TOKEN
      // --------------------------------------------------------
      // QR token is stored in:
      //
      // scholars/{uid}
      //
      // qrToken: "SLK-XXXXXXXX"
      //
      // We search by qrToken rather than trusting the UID
      // supplied by the client.
      // --------------------------------------------------------

      const scholarQuery = await db
        .collection("scholars")
        .where("qrToken", "==", qrToken)
        .limit(1)
        .get();

      if (scholarQuery.empty) {
        return response.status(401).json({
          success: false,
          message: "This QR Code is not registered.",
        });
      }

      const scholarDocument = scholarQuery.docs[0];
      const scholarData = scholarDocument.data();

      // The document ID should normally be the Firebase Auth UID.
      const uid =
        scholarData.uid || scholarDocument.id;

      if (!uid) {
        logger.error(
          "Scholar record has no UID.",
          {
            documentId: scholarDocument.id,
          }
        );

        return response.status(500).json({
          success: false,
          message:
            "Scholar account configuration is invalid.",
        });
      }

      // --------------------------------------------------------
      // CHECK SCHOLAR STATUS
      // --------------------------------------------------------

      const scholarStatus = String(
        scholarData.status || ""
      )
        .trim()
        .toLowerCase();

      if (scholarStatus !== "active") {
        return response.status(403).json({
          success: false,
          message:
            "This scholar account is not active.",
        });
      }

      // --------------------------------------------------------
      // GET USER DOCUMENT
      // --------------------------------------------------------

      const userReference = db
        .collection("users")
        .doc(uid);

      const userSnapshot = await userReference.get();

      if (!userSnapshot.exists) {
        return response.status(403).json({
          success: false,
          message:
            "Scholar user account was not found.",
        });
      }

      const userData = userSnapshot.data();

      // --------------------------------------------------------
      // VERIFY ROLE
      // --------------------------------------------------------

      const role = String(
        userData.role || ""
      )
        .trim()
        .toLowerCase();

      if (role !== "scholar") {
        return response.status(403).json({
          success: false,
          message:
            "This QR Code can only be used by scholars.",
        });
      }

      // --------------------------------------------------------
      // VERIFY USER STATUS
      // --------------------------------------------------------

      const userStatus = String(
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
        return response.status(403).json({
          success: false,
          message:
            "Your scholar account is not active.",
        });
      }

      // --------------------------------------------------------
      // VERIFY FIREBASE AUTH ACCOUNT
      // --------------------------------------------------------

      let firebaseUser;

      try {
        firebaseUser = await adminAuth.getUser(uid);
      } catch (error) {
        logger.error(
          "Firebase Auth user not found.",
          {
            uid,
            error: error.message,
          }
        );

        return response.status(403).json({
          success: false,
          message:
            "The Firebase scholar account does not exist.",
        });
      }

      // --------------------------------------------------------
      // CHECK IF FIREBASE ACCOUNT IS DISABLED
      // --------------------------------------------------------

      if (firebaseUser.disabled) {
        return response.status(403).json({
          success: false,
          message:
            "This Firebase account is disabled.",
        });
      }

      // --------------------------------------------------------
      // CREATE FIREBASE CUSTOM TOKEN
      // --------------------------------------------------------

      const customToken =
        await adminAuth.createCustomToken(
          uid,
          {
            role: "scholar",
            scholarId:
              scholarData.scholarId || null,
          }
        );

      // --------------------------------------------------------
      // SUCCESS
      // --------------------------------------------------------

      logger.info("Scholar QR login successful.", {
        uid,
        scholarId:
          scholarData.scholarId || null,
      });

      return response.status(200).json({
        success: true,
        customToken,
        uid,
        scholarId:
          scholarData.scholarId || null,
      });

    } catch (error) {
      // --------------------------------------------------------
      // SERVER ERROR
      // --------------------------------------------------------

      logger.error(
        "ScholarLink QR login function error.",
        error
      );

      return response.status(500).json({
        success: false,
        message: "QR login server error.",
      });
    }
  }
);
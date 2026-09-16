// =========================================================
// SCHOLARLINK LOGIN JAVASCRIPT
// Firebase Authentication + Firestore Role Authorization
// =========================================================

import {
    auth,
    db
} from "../firebase.js";

import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signOut,
    signInWithCustomToken
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
    addDoc,
    collection,
    doc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


// =========================================================
// SECURITY LOGGING
// =========================================================

async function logSecurityEvent(
    action,
    details = ""
) {

    const user =
        auth.currentUser;

    try {

        await addDoc(
            collection(
                db,
                "security_logs"
            ),
            {

                userId:
                    user
                        ? user.uid
                        : null,

                email:
                    user
                        ? user.email
                        : null,

                role:
                    localStorage.getItem(
                        "scholarLinkRole"
                    ) || "unknown",

                action:
                    action,

                details:
                    details,

                timestamp:
                    serverTimestamp()

            }
        );

        console.log(
            "Security log recorded:",
            action
        );

    }

    catch (error) {

        console.error(
            "Security log error:",
            error
        );

    }

}


// =========================================================
// PASSWORD SHOW / HIDE
// =========================================================

const password =
    document.getElementById(
        "password"
    );

const togglePassword =
    document.getElementById(
        "togglePassword"
    );

const eyeIcon =
    document.getElementById(
        "eyeIcon"
    );

if (
    togglePassword &&
    password &&
    eyeIcon
) {

    // INITIAL STATE: PASSWORD HIDDEN
    password.type = "password";

    eyeIcon.classList.remove(
        "fa-eye"
    );

    eyeIcon.classList.add(
        "fa-eye-slash"
    );

    togglePassword.setAttribute(
        "aria-label",
        "Show password"
    );


    togglePassword.addEventListener(
        "click",
        function () {

            if (
                password.type ===
                "password"
            ) {

                // SHOW PASSWORD
                password.type =
                    "text";

                eyeIcon.classList.remove(
                    "fa-eye-slash"
                );

                eyeIcon.classList.add(
                    "fa-eye"
                );

                togglePassword.setAttribute(
                    "aria-label",
                    "Hide password"
                );

            }

            else {

                // HIDE PASSWORD
                password.type =
                    "password";

                eyeIcon.classList.remove(
                    "fa-eye"
                );

                eyeIcon.classList.add(
                    "fa-eye-slash"
                );

                togglePassword.setAttribute(
                    "aria-label",
                    "Show password"
                );

            }

        }
    );

}


// =========================================================
// FORGOT PASSWORD
// =========================================================

const forgotPasswordLink =
    document.getElementById(
        "forgotPasswordLink"
    );

const forgotModal =
    document.getElementById(
        "forgotModal"
    );

const closeForgotModal =
    document.getElementById(
        "closeForgotModal"
    );

const resetEmail =
    document.getElementById(
        "resetEmail"
    );

const resetPasswordBtn =
    document.getElementById(
        "resetPasswordBtn"
    );

const forgotForm =
    document.getElementById(
        "forgotForm"
    );

const successMessage =
    document.getElementById(
        "successMessage"
    );

const backToLogin =
    document.getElementById(
        "backToLogin"
    );

const backToLoginFromSuccess =
    document.getElementById(
        "backToLoginFromSuccess"
    );


// =========================================================
// OPEN FORGOT PASSWORD
// =========================================================

if (
    forgotPasswordLink &&
    forgotModal
) {

    forgotPasswordLink.addEventListener(
        "click",
        function (e) {

            e.preventDefault();

            forgotModal.classList.add(
                "active"
            );

            if (forgotForm) {

                forgotForm.style.display =
                    "block";

            }

            if (successMessage) {

                successMessage.classList.remove(
                    "show"
                );

            }

            if (resetEmail) {

                resetEmail.value =
                    "";

            }

            if (resetPasswordBtn) {

                resetPasswordBtn.disabled =
                    false;

                const span =
                    resetPasswordBtn.querySelector(
                        "span"
                    );

                const icon =
                    resetPasswordBtn.querySelector(
                        "i"
                    );

                if (span) {

                    span.textContent =
                        "Send Reset Link";

                }

                if (icon) {

                    icon.className =
                        "fa-solid fa-paper-plane";

                }

            }

        }
    );

}


// =========================================================
// CLOSE FORGOT PASSWORD
// =========================================================

function closeForgotModalFunction() {

    if (forgotModal) {

        forgotModal.classList.remove(
            "active"
        );

    }

    if (forgotForm) {

        forgotForm.style.display =
            "block";

    }

    if (successMessage) {

        successMessage.classList.remove(
            "show"
        );

    }

    if (resetEmail) {

        resetEmail.value =
            "";

    }

    if (resetPasswordBtn) {

        resetPasswordBtn.disabled =
            false;

        const span =
            resetPasswordBtn.querySelector(
                "span"
            );

        const icon =
            resetPasswordBtn.querySelector(
                "i"
            );

        if (span) {

            span.textContent =
                "Send Reset Link";

        }

        if (icon) {

            icon.className =
                "fa-solid fa-paper-plane";

        }

    }

}


// =========================================================
// FORGOT PASSWORD CLOSE BUTTONS
// =========================================================

if (closeForgotModal) {

    closeForgotModal.addEventListener(
        "click",
        closeForgotModalFunction
    );

}

if (backToLogin) {

    backToLogin.addEventListener(
        "click",
        closeForgotModalFunction
    );

}

if (backToLoginFromSuccess) {

    backToLoginFromSuccess.addEventListener(
        "click",
        closeForgotModalFunction
    );

}


// =========================================================
// CLOSE MODAL WHEN CLICKING OUTSIDE
// =========================================================

if (forgotModal) {

    forgotModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                forgotModal
            ) {

                closeForgotModalFunction();

            }

        }
    );

}


// =========================================================
// ESCAPE KEY FOR FORGOT PASSWORD
// =========================================================

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape" &&
            forgotModal &&
            forgotModal.classList.contains(
                "active"
            )
        ) {

            closeForgotModalFunction();

        }

    }
);


// =========================================================
// SEND PASSWORD RESET EMAIL
// =========================================================

if (
    resetPasswordBtn
) {

    resetPasswordBtn.addEventListener(
        "click",
        async function () {

            const emailValue =
                resetEmail
                    ? resetEmail.value.trim()
                    : "";

            if (
                emailValue === ""
            ) {

                alert(
                    "Please enter your email address."
                );

                if (resetEmail) {

                    resetEmail.focus();

                }

                return;

            }

            const emailRegex =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (
                !emailRegex.test(
                    emailValue
                )
            ) {

                alert(
                    "Please enter a valid email address."
                );

                if (resetEmail) {

                    resetEmail.focus();

                }

                return;

            }

            resetPasswordBtn.disabled =
                true;

            const span =
                resetPasswordBtn.querySelector(
                    "span"
                );

            const icon =
                resetPasswordBtn.querySelector(
                    "i"
                );

            if (span) {

                span.textContent =
                    "Sending...";

            }

            if (icon) {

                icon.className =
                    "fa-solid fa-spinner fa-spin";

            }

            try {

                await sendPasswordResetEmail(
                    auth,
                    emailValue
                );

                if (forgotForm) {

                    forgotForm.style.display =
                        "none";

                }

                if (successMessage) {

                    successMessage.classList.add(
                        "show"
                    );

                }

            }

            catch (error) {

                console.error(
                    "Password reset error:",
                    error
                );

                let message =
                    "Unable to send password reset email.";

                switch (
                    error.code
                ) {

                    case "auth/invalid-email":

                        message =
                            "Please enter a valid email address.";

                        break;

                    case "auth/user-not-found":

                        message =
                            "No account was found with that email address.";

                        break;

                    case "auth/too-many-requests":

                        message =
                            "Too many requests. Please try again later.";

                        break;

                    case "auth/network-request-failed":

                        message =
                            "Network error. Please check your internet connection.";

                        break;

                    default:

                        message =
                            error.message ||
                            message;

                        break;

                }

                alert(
                    message
                );

            }

            finally {

                resetPasswordBtn.disabled =
                    false;

                if (span) {

                    span.textContent =
                        "Send Reset Link";

                }

                if (icon) {

                    icon.className =
                        "fa-solid fa-paper-plane";

                }

            }

        }
    );

}


// =========================================================
// ENTER KEY - FORGOT PASSWORD
// =========================================================

if (
    resetEmail
) {

    resetEmail.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter" &&
                resetPasswordBtn
            ) {

                resetPasswordBtn.click();

            }

        }
    );

}


// =========================================================
// LOGIN ELEMENTS
// =========================================================

const loginButton =
    document.getElementById(
        "loginButton"
    );

const email =
    document.getElementById(
        "email"
    );

const loginButtonText =
    loginButton
        ? loginButton.querySelector(
            "span"
        )
        : null;

const loginIcon =
    loginButton
        ? loginButton.querySelector(
            "i"
        )
        : null;


// =========================================================
// LOGIN LOADING STATE
// =========================================================

function setLoading(
    isLoading
) {

    if (
        !loginButton
    ) {

        return;

    }

    if (isLoading) {

        loginButton.disabled =
            true;

        if (loginButtonText) {

            loginButtonText.textContent =
                "Logging in...";

        }

        if (loginIcon) {

            loginIcon.className =
                "fa-solid fa-spinner fa-spin";

        }

    }

    else {

        loginButton.disabled =
            false;

        if (loginButtonText) {

            loginButtonText.textContent =
                "Log In";

        }

        if (loginIcon) {

            loginIcon.className =
                "fa-regular fa-user";

        }

    }

}


// =========================================================
// LOGIN FUNCTION
// =========================================================

if (
    loginButton &&
    email &&
    password
) {

    loginButton.addEventListener(
        "click",
        async function () {

            const emailValue =
                email.value.trim();

            const passwordValue =
                password.value.trim();


            // VALIDATION

            if (
                emailValue === ""
            ) {

                alert(
                    "Please enter your email address."
                );

                email.focus();

                return;

            }


            if (
                passwordValue === ""
            ) {

                alert(
                    "Please enter your password."
                );

                password.focus();

                return;

            }


            // START LOADING

            setLoading(
                true
            );


            try {

                // FIREBASE AUTHENTICATION

                const userCredential =
                    await signInWithEmailAndPassword(
                        auth,
                        emailValue,
                        passwordValue
                    );


                const user =
                    userCredential.user;


                const uid =
                    user.uid;


                console.log(
                    "================================="
                );

                console.log(
                    "USER SUCCESSFULLY AUTHENTICATED"
                );

                console.log(
                    "User UID:",
                    uid
                );

                console.log(
                    "User Email:",
                    user.email
                );


                // GET FIRESTORE USER PROFILE

                const userRef =
                    doc(
                        db,
                        "users",
                        uid
                    );


                const userSnapshot =
                    await getDoc(
                        userRef
                    );


                // PROFILE DOES NOT EXIST

                if (
                    !userSnapshot.exists()
                ) {

                    console.error(
                        "User profile does not exist."
                    );

                    await signOut(
                        auth
                    );

                    alert(
                        "Your account profile was not found. Please contact support."
                    );

                    setLoading(
                        false
                    );

                    return;

                }


                // USER DATA

                const userData =
                    userSnapshot.data();


                console.log(
                    "Firestore User Data:",
                    userData
                );


                // ROLE

                const role =
                    String(
                        userData.role || ""
                    )
                    .trim()
                    .toLowerCase();


                const applicationStatus =
                    String(
                        userData.applicationStatus ||
                        ""
                    )
                    .trim()
                    .toLowerCase();


                const scholarStatus =
                    String(
                        userData.scholarStatus ||
                        ""
                    )
                    .trim()
                    .toLowerCase();


                const scholarConfirmed =
                    userData.scholarConfirmed ===
                    true;


                console.log(
                    "ROLE:",
                    role
                );

                console.log(
                    "APPLICATION STATUS:",
                    applicationStatus
                );

                console.log(
                    "SCHOLAR STATUS:",
                    scholarStatus
                );

                console.log(
                    "SCHOLAR CONFIRMED:",
                    scholarConfirmed
                );


// =========================================
// ADMIN LOGIN
// =========================================

if (
    role === "admin"
) {

    console.log(
        "ADMIN LOGIN AUTHORIZED"
    );


    localStorage.setItem(
        "scholarLinkRole",
        "admin"
    );


    localStorage.setItem(
        "scholarLinkLoggedIn",
        "true"
    );


    localStorage.setItem(
        "scholarLinkUID",
        uid
    );


    localStorage.setItem(
        "scholarLinkEmail",
        user.email || ""
    );


    await logSecurityEvent(
        "LOGIN",
        "Administrator successfully logged in."
    );


    window.location.href =
        "../components/admin-dashboard.html";


    return;

}


// =========================================
// SCHOLAR LOGIN
// =========================================

if (
    role === "scholar" &&
    (
        applicationStatus ===
            "active" ||

        scholarStatus ===
            "active" ||

        scholarConfirmed ===
            true
    )
) {

    console.log(
        "SCHOLAR LOGIN AUTHORIZED"
    );


    localStorage.setItem(
        "scholarLinkRole",
        "scholar"
    );


    localStorage.setItem(
        "scholarLinkLoggedIn",
        "true"
    );


    localStorage.setItem(
        "scholarLinkUID",
        uid
    );


    localStorage.setItem(
        "scholarLinkEmail",
        user.email || ""
    );


    await logSecurityEvent(
        "LOGIN",
        "Scholar successfully logged in."
    );


    // IMPORTANT:
    // Actual file is Home.html with capital H

    window.location.href =
        "../scholarcomponents/Home.html";


    return;

}


// =========================================
// APPLICANT LOGIN
// =========================================

if (
    role === "applicant"
) {

    console.log(
        "APPLICANT LOGIN AUTHORIZED"
    );


    localStorage.setItem(
        "scholarLinkRole",
        "applicant"
    );


    localStorage.setItem(
        "scholarLinkLoggedIn",
        "true"
    );


    localStorage.setItem(
        "scholarLinkUID",
        uid
    );


    localStorage.setItem(
        "scholarLinkEmail",
        user.email || ""
    );


    await logSecurityEvent(
        "LOGIN",
        "Applicant successfully logged in."
    );


    // Applicant goes directly to Application Status

    window.location.href =
        "../applicant/application-status.html";


    return;

}

                // =========================================
                // UNAUTHORIZED ACCOUNT
                // =========================================

                console.warn(
                    "ACCOUNT NOT AUTHORIZED:",
                    {
                        uid:
                            uid,

                        role:
                            role,

                        applicationStatus:
                            applicationStatus,

                        scholarStatus:
                            scholarStatus,

                        scholarConfirmed:
                            scholarConfirmed
                    }
                );


                await logSecurityEvent(
                    "LOGIN_DENIED",
                    "Authenticated account is not authorized for this portal."
                );


                await signOut(
                    auth
                );


                alert(
                    "Your account is not authorized for this portal. Please contact support."
                );


                setLoading(
                    false
                );

            }

            catch (error) {

                console.error(
                    "Login error:",
                    error
                );


                const errorCode =
                    error.code;


                const errorMessage =
                    error.message;


                console.error(
                    "Login error details:",
                    errorCode,
                    errorMessage
                );


                let userMessage =
                    "Login failed. Please try again.";


                switch (
                    errorCode
                ) {

                    case "auth/invalid-credential":

                    case "auth/user-not-found":

                    case "auth/wrong-password":

                        userMessage =
                            "Invalid email or password. Please try again.";

                        break;


                    case "auth/invalid-email":

                        userMessage =
                            "Invalid email format. Please enter a valid email.";

                        break;


                    case "auth/user-disabled":

                        userMessage =
                            "This account has been disabled. Please contact support.";

                        break;


                    case "auth/too-many-requests":

                        userMessage =
                            "Too many failed login attempts. Please try again later.";

                        break;


                    case "auth/network-request-failed":

                        userMessage =
                            "Network error. Please check your internet connection.";

                        break;


                    case "permission-denied":

                        userMessage =
                            "Your account profile cannot be accessed. Please contact support.";

                        break;


                    default:

                        userMessage =
                            errorMessage ||
                            userMessage;

                        break;

                }


                alert(
                    userMessage
                );


                setLoading(
                    false
                );

            }

        }
    );

}


// =========================================================
// CHECK AUTH STATE ON PAGE LOAD
// =========================================================

onAuthStateChanged(
    auth,
    async function (user) {

        // =====================================================
        // NO FIREBASE USER
        // =====================================================

        if (!user) {

            localStorage.removeItem(
                "scholarLinkLoggedIn"
            );

            localStorage.removeItem(
                "scholarLinkRole"
            );

            localStorage.removeItem(
                "scholarLinkUID"
            );

            localStorage.removeItem(
                "scholarLinkEmail"
            );

            return;
        }


        // =====================================================
        // CURRENT PAGE
        // =====================================================

        const currentPath =
            window.location.pathname;


        const isLoginPage =
            currentPath.includes(
                "index.html"
            ) ||
            currentPath.endsWith(
                "/"
            );


        // =====================================================
        // CHECK SCHOLARLINK SESSION
        // =====================================================

        const isLoggedIn =
            localStorage.getItem(
                "scholarLinkLoggedIn"
            ) === "true";


        // =====================================================
        // IMPORTANT:
        // DO NOT AUTO-REDIRECT FROM THE LOGIN PAGE.
        //
        // Firebase can restore an old authenticated session when
        // index.html is opened again. The actual Login button is
        // responsible for deciding where the user goes after a
        // successful login.
        // =====================================================

        if (
            isLoginPage
        ) {

            console.log(
                "Login page opened. Waiting for user to log in."
            );

            return;
        }


        // =====================================================
        // ONLY PROCESS AUTHENTICATED USERS ON OTHER PAGES
        // =====================================================

        if (
            !isLoggedIn
        ) {

            return;

        }


        // =====================================================
        // GET USER UID
        // =====================================================

        const uid =
            user.uid;


        try {

            // =================================================
            // GET FIRESTORE USER PROFILE
            // =================================================

            const userRef =
                doc(
                    db,
                    "users",
                    uid
                );


            const userSnapshot =
                await getDoc(
                    userRef
                );


            // =================================================
            // USER PROFILE DOES NOT EXIST
            // =================================================

            if (
                !userSnapshot.exists()
            ) {

                console.warn(
                    "User profile does not exist."
                );


                await signOut(
                    auth
                );


                localStorage.removeItem(
                    "scholarLinkLoggedIn"
                );

                localStorage.removeItem(
                    "scholarLinkRole"
                );

                localStorage.removeItem(
                    "scholarLinkUID"
                );

                localStorage.removeItem(
                    "scholarLinkEmail"
                );


                return;
            }


            // =================================================
            // USER DATA
            // =================================================

            const userData =
                userSnapshot.data();


            // =================================================
            // ROLE
            // =================================================

            const role =
                String(
                    userData.role || ""
                )
                .trim()
                .toLowerCase();


            // =================================================
            // APPLICATION STATUS
            // =================================================

            const applicationStatus =
                String(
                    userData.applicationStatus ||
                    ""
                )
                .trim()
                .toLowerCase();


            // =================================================
            // SCHOLAR STATUS
            // =================================================

            const scholarStatus =
                String(
                    userData.scholarStatus ||
                    ""
                )
                .trim()
                .toLowerCase();


            // =================================================
            // SCHOLAR CONFIRMED
            // =================================================

            const scholarConfirmed =
                userData.scholarConfirmed ===
                true;


            console.log(
                "AUTH STATE CHECK"
            );

            console.log(
                "UID:",
                uid
            );

            console.log(
                "ROLE:",
                role
            );

            console.log(
                "APPLICATION STATUS:",
                applicationStatus
            );

            console.log(
                "SCHOLAR STATUS:",
                scholarStatus
            );

            console.log(
                "SCHOLAR CONFIRMED:",
                scholarConfirmed
            );


            // =================================================
            // ADMIN
            // =================================================

            if (
                role === "admin"
            ) {

                localStorage.setItem(
                    "scholarLinkRole",
                    "admin"
                );


                localStorage.setItem(
                    "scholarLinkLoggedIn",
                    "true"
                );


                localStorage.setItem(
                    "scholarLinkUID",
                    uid
                );


                localStorage.setItem(
                    "scholarLinkEmail",
                    user.email || ""
                );


                // Do not redirect if already inside admin area

                if (
                    !currentPath.includes(
                        "admin-dashboard.html"
                    )
                ) {

                    window.location.href =
                        "../components/admin-dashboard.html";

                }


                return;
            }


            // =================================================
            // SCHOLAR
            // =================================================

            if (
                role === "scholar" &&
                (
                    applicationStatus ===
                        "active" ||

                    scholarStatus ===
                        "active" ||

                    scholarConfirmed ===
                        true
                )
            ) {

                localStorage.setItem(
                    "scholarLinkRole",
                    "scholar"
                );


                localStorage.setItem(
                    "scholarLinkLoggedIn",
                    "true"
                );


                localStorage.setItem(
                    "scholarLinkUID",
                    uid
                );


                localStorage.setItem(
                    "scholarLinkEmail",
                    user.email || ""
                );


                // IMPORTANT:
                // Actual Scholar file is Home.html
                // Capital H

                if (
                    !currentPath.includes(
                        "scholarcomponents"
                    )
                ) {

                    window.location.href =
                        "../scholarcomponents/Home.html";

                }


                return;
            }


            // =================================================
            // APPLICANT
            // =================================================

            if (
                role === "applicant"
            ) {

                localStorage.setItem(
                    "scholarLinkRole",
                    "applicant"
                );


                localStorage.setItem(
                    "scholarLinkLoggedIn",
                    "true"
                );


                localStorage.setItem(
                    "scholarLinkUID",
                    uid
                );


                localStorage.setItem(
                    "scholarLinkEmail",
                    user.email || ""
                );


                // IMPORTANT:
                // Actual Applicant folder is "applicant"
                // Applicant goes to Application Status

                if (
                    !currentPath.includes(
                        "application-status.html"
                    )
                ) {

                    window.location.href =
                        "../applicant/application-status.html";

                }


                return;
            }


            // =================================================
            // INVALID / UNAUTHORIZED ROLE
            // =================================================

            console.warn(
                "INVALID OR UNAUTHORIZED ROLE:",
                role
            );


            await signOut(
                auth
            );


            localStorage.removeItem(
                "scholarLinkLoggedIn"
            );

            localStorage.removeItem(
                "scholarLinkRole"
            );

            localStorage.removeItem(
                "scholarLinkUID"
            );

            localStorage.removeItem(
                "scholarLinkEmail"
            );


        }

        catch (error) {

            console.error(
                "Auth state profile error:",
                error
            );

        }

    }
);


// =========================================================
// ENTER KEY - PASSWORD
// =========================================================

if (
    password &&
    loginButton
) {

    password.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter"
            ) {

                loginButton.click();

            }

        }
    );

}


// =========================================================
// SCHOLARLINK QR LOGIN
// CAMERA SCAN + IMAGE UPLOAD
// =========================================================

const qrButton =
    document.getElementById(
        "qrButton"
    );


const qrModal =
    document.getElementById(
        "qrModal"
    );


const closeQr =
    document.getElementById(
        "closeQr"
    );


const closeQrBottom =
    document.getElementById(
        "closeQrBottom"
    );


const qrReader =
    document.getElementById(
        "qr-reader"
    );


const qrReaderStatus =
    document.getElementById(
        "qr-reader-status"
    );


const qrFileInput =
    document.getElementById(
        "qr-file-input"
    );


// =========================================================
// QR LOGIN BACKEND URL
// =========================================================
//
// IMPORTANT:
//
// Replace this with your deployed Firebase
// Cloud Function URL.
//
// Example:
//
// https://us-central1-YOUR-PROJECT.cloudfunctions.net/qrLogin
//
// =========================================================

const QR_LOGIN_FUNCTION_URL =
    "https://scholarlink-qr-backend.onrender.com/qrLogin";

let qrScanner =
    null;


let qrScannerRunning =
    false;


let qrLoginProcessing =
    false;


// =========================================================
// UPDATE QR STATUS
// =========================================================

function updateQRStatus(
    message,
    type = "normal"
) {

    if (
        !qrReaderStatus
    ) {

        return;

    }


    qrReaderStatus.textContent =
        message;


    if (
        type === "success"
    ) {

        qrReaderStatus.style.color =
            "#16a34a";

    }

    else if (
        type === "error"
    ) {

        qrReaderStatus.style.color =
            "#dc2626";

    }

    else if (
        type === "loading"
    ) {

        qrReaderStatus.style.color =
            "#7c3aed";

    }

    else {

        qrReaderStatus.style.color =
            "#64748b";

    }

}


// =========================================================
// VALIDATE QR TOKEN
// =========================================================

function validateQRToken(
    qrToken
) {

    const token =
        String(
            qrToken || ""
        ).trim();


    return (
        token.startsWith(
            "SLK-"
        ) &&
        token.length >= 8
    );

}


// =========================================================
// PROCESS QR LOGIN
// =========================================================

async function processQRLogin(
    qrToken
) {

    if (
        qrLoginProcessing
    ) {

        return;

    }


    qrLoginProcessing =
        true;


    updateQRStatus(
        "Verifying your ScholarLink QR Code...",
        "loading"
    );


    try {

        qrToken =
            String(
                qrToken || ""
            ).trim();


        if (
            !validateQRToken(
                qrToken
            )
        ) {

            throw new Error(
                "Invalid ScholarLink QR Code."
            );

        }


        if (
            !QR_LOGIN_FUNCTION_URL ||
            QR_LOGIN_FUNCTION_URL ===
                "YOUR_QR_LOGIN_FUNCTION_URL"
        ) {

            throw new Error(
                "QR Login backend is not connected yet. Please configure the Firebase Cloud Function URL."
            );

        }


        // =====================================================
        // SEND QR TOKEN TO BACKEND
        // =====================================================

        const response =
            await fetch(
                QR_LOGIN_FUNCTION_URL,
                {

                    method:
                        "POST",

                    headers:
                        {
                            "Content-Type":
                                "application/json"
                        },

                    body:
                        JSON.stringify(
                            {
                                qrToken:
                                    qrToken
                            }
                        )

                }
            );


        let data =
            null;


        try {

            data =
                await response.json();

        }

        catch {

            data =
                null;

        }


        if (
            !response.ok
        ) {

            throw new Error(
                data &&
                data.message
                    ? data.message
                    : "QR verification failed."
            );

        }


        const customToken =
            data &&
            data.customToken
                ? data.customToken
                : null;


        if (
            !customToken
        ) {

            throw new Error(
                "The QR server did not return a valid Firebase login token."
            );

        }


        updateQRStatus(
            "QR verified. Signing you in...",
            "loading"
        );


        // =====================================================
        // FIREBASE CUSTOM TOKEN LOGIN
        // =====================================================

        const userCredential =
            await signInWithCustomToken(
                auth,
                customToken
            );


        const user =
            userCredential.user;


        const uid =
            user.uid;


        console.log(
            "QR LOGIN SUCCESS"
        );


        console.log(
            "Scholar UID:",
            uid
        );


        // =====================================================
        // GET FIRESTORE USER
        // =====================================================

        const userSnapshot =
            await getDoc(
                doc(
                    db,
                    "users",
                    uid
                )
            );


        if (
            !userSnapshot.exists()
        ) {

            await signOut(
                auth
            );


            throw new Error(
                "Your ScholarLink account profile was not found."
            );

        }


        const userData =
            userSnapshot.data();


        const role =
            String(
                userData.role || ""
            )
            .trim()
            .toLowerCase();


        const applicationStatus =
            String(
                userData.applicationStatus ||
                    ""
            )
            .trim()
            .toLowerCase();


        const scholarStatus =
            String(
                userData.scholarStatus ||
                    ""
            )
            .trim()
            .toLowerCase();


        const scholarConfirmed =
            userData.scholarConfirmed ===
            true;


        // =====================================================
        // QR LOGIN = SCHOLAR ONLY
        // =====================================================

        if (
            role !==
            "scholar"
        ) {

            await signOut(
                auth
            );


            throw new Error(
                "This QR Code is not registered to a scholar account."
            );

        }


        // =====================================================
        // SCHOLAR MUST BE ACTIVE
        // =====================================================

        if (
            applicationStatus !==
                "active" &&

            scholarStatus !==
                "active" &&

            scholarConfirmed !==
                true
        ) {

            await signOut(
                auth
            );


            throw new Error(
                "Your scholar account is not active yet."
            );

        }


        // =====================================================
        // SAVE SCHOLAR SESSION
        // =====================================================

        localStorage.setItem(
            "scholarLinkRole",
            "scholar"
        );


        localStorage.setItem(
            "scholarLinkLoggedIn",
            "true"
        );


        localStorage.setItem(
            "scholarLinkUID",
            uid
        );


        localStorage.setItem(
            "scholarLinkEmail",
            user.email || ""
        );


        // =====================================================
        // SECURITY LOG
        // =====================================================

        await logSecurityEvent(
            "QR_LOGIN",
            "Scholar successfully logged in using QR Code."
        );


        updateQRStatus(
            "QR login successful. Redirecting...",
            "success"
        );


        await stopQRScanner();


        // =====================================================
        // REDIRECT
        // =====================================================

        setTimeout(
            function () {

                window.location.href =
                    "../scholarcomponents/Home.html";

            },
            500
        );

    }

    catch (error) {

        console.error(
            "QR Login Error:",
            error
        );


        try {

            if (
                auth.currentUser
            ) {

                await signOut(
                    auth
                );

            }

        }

        catch (signOutError) {

            console.error(
                "QR sign out error:",
                signOutError
            );

        }


        updateQRStatus(
            error.message ||
                "QR login failed. Please try again.",
            "error"
        );


        alert(
            error.message ||
                "QR login failed. Please try again."
        );

    }

    finally {

        qrLoginProcessing =
            false;

    }

}


// =========================================================
// START CAMERA QR SCANNER
// =========================================================

async function startQRScanner() {

    if (
        !qrReader
    ) {

        return;

    }


    if (
        typeof Html5Qrcode ===
        "undefined"
    ) {

        updateQRStatus(
            "QR scanner library failed to load.",
            "error"
        );

        return;

    }


    try {

        if (
            qrScannerRunning
        ) {

            await stopQRScanner();

        }


        qrReader.innerHTML =
            "";


        qrScanner =
            new Html5Qrcode(
                "qr-reader"
            );


        updateQRStatus(
            "Starting camera...",
            "loading"
        );


        await qrScanner.start(

            {
                facingMode:
                    "environment"
            },

            {
                fps:
                    10,

                qrbox:
                    {
                        width:
                            250,

                        height:
                            250
                    },

                aspectRatio:
                    1.0
            },

            async function (
                decodedText
            ) {

                if (
                    !qrLoginProcessing
                ) {

                    await processQRLogin(
                        decodedText
                    );

                }

            },

            function () {

                // Scanner continues searching.

            }

        );


        qrScannerRunning =
            true;


        updateQRStatus(
            "Camera ready. Point it at your ScholarLink QR Code."
        );


        console.log(
            "QR camera scanner started."
        );

    }

    catch (error) {

        console.error(
            "Camera start error:",
            error
        );


        qrScannerRunning =
            false;


        updateQRStatus(
            "Camera could not start. Please allow camera access or upload your QR image below.",
            "error"
        );

    }

}


// =========================================================
// STOP CAMERA QR SCANNER
// =========================================================

async function stopQRScanner() {

    if (
        !qrScanner
    ) {

        qrScannerRunning =
            false;

        return;

    }


    try {

        if (
            qrScannerRunning
        ) {

            await qrScanner.stop();

        }

    }

    catch (error) {

        console.warn(
            "QR scanner stop warning:",
            error
        );

    }


    try {

        await qrScanner.clear();

    }

    catch (error) {

        console.warn(
            "QR scanner clear warning:",
            error
        );

    }


    qrScanner =
        null;


    qrScannerRunning =
        false;

}


// =========================================================
// OPEN QR LOGIN
// =========================================================

if (
    qrButton &&
    qrModal
) {

    qrButton.addEventListener(
        "click",
        function () {

            qrModal.classList.add(
                "active"
            );


            qrLoginProcessing =
                false;


            updateQRStatus(
                "Preparing camera scanner..."
            );


            setTimeout(
                function () {

                    startQRScanner();

                },
                250
            );

        }
    );

}


// =========================================================
// CLOSE QR MODAL
// =========================================================

async function closeQRModal() {

    await stopQRScanner();


    if (
        qrModal
    ) {

        qrModal.classList.remove(
            "active"
        );

    }


    qrLoginProcessing =
        false;


    if (
        qrFileInput
    ) {

        qrFileInput.value =
            "";

    }


    if (
        qrReader
    ) {

        qrReader.innerHTML =
            "";

    }

}


// =========================================================
// CLOSE QR X BUTTON
// =========================================================

if (
    closeQr
) {

    closeQr.addEventListener(
        "click",
        function () {

            closeQRModal();

        }
    );

}


// =========================================================
// CLOSE QR BOTTOM BUTTON
// =========================================================

if (
    closeQrBottom
) {

    closeQrBottom.addEventListener(
        "click",
        function () {

            closeQRModal();

        }
    );

}


// =========================================================
// CLICK OUTSIDE QR MODAL
// =========================================================

if (
    qrModal
) {

    qrModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                qrModal
            ) {

                closeQRModal();

            }

        }
    );

}


// =========================================================
// ESCAPE KEY - QR MODAL
// =========================================================

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key ===
                "Escape" &&

            qrModal &&

            qrModal.classList.contains(
                "active"
            )
        ) {

            closeQRModal();

        }

    }
);


// =========================================================
// UPLOAD QR IMAGE
// =========================================================

if (
    qrFileInput
) {

    qrFileInput.addEventListener(
        "change",
        async function (event) {

            const file =
                event.target.files &&
                event.target.files[0];


            if (
                !file
            ) {

                return;

            }


            // =================================================
            // VALIDATE FILE
            // =================================================

            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {

                alert(
                    "Please select a valid QR Code image."
                );


                qrFileInput.value =
                    "";


                return;

            }


            if (
                typeof Html5Qrcode ===
                "undefined"
            ) {

                alert(
                    "QR scanner library is not loaded."
                );


                return;

            }


            try {

                qrLoginProcessing =
                    false;


                updateQRStatus(
                    "Reading QR Code image...",
                    "loading"
                );


                // =================================================
                // STOP CAMERA
                // =================================================

                await stopQRScanner();


                // =================================================
                // CREATE TEMPORARY FILE SCANNER
                // =================================================

                const fileScanner =
                    new Html5Qrcode(
                        "qr-reader"
                    );


                // =================================================
                // READ QR IMAGE
                // =================================================

                const decodedText =
                    await fileScanner.scanFile(
                        file,
                        true
                    );


                console.log(
                    "QR IMAGE DETECTED:",
                    decodedText
                );


                // =================================================
                // CLEAN TEMP SCANNER
                // =================================================

                try {

                    await fileScanner.clear();

                }

                catch (clearError) {

                    console.warn(
                        "File scanner clear warning:",
                        clearError
                    );

                }


                updateQRStatus(
                    "QR Code detected. Verifying...",
                    "loading"
                );


                // =================================================
                // PROCESS LOGIN
                // =================================================

                await processQRLogin(
                    decodedText
                );

            }

            catch (error) {

                console.error(
                    "QR image scan error:",
                    error
                );


                updateQRStatus(
                    "Unable to read this QR Code image.",
                    "error"
                );


                alert(
                    "Unable to read the QR Code image. Please upload a clear ScholarLink QR Code."
                );

            }

            finally {

                if (
                    qrFileInput
                ) {

                    qrFileInput.value =
                        "";

                }

            }

        }
    );

}


console.log(
    "ScholarLink QR Login module loaded successfully."
);
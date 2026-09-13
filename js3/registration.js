// =====================================================
// SCHOLARLINK - APPLICANT REGISTRATION
// =====================================================

// registration.js is inside /js3/
// firebase.js is in the project root


// =====================================================
// FIREBASE
// =====================================================

import {
    auth,
    db
} from "../firebase.js";


import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";


import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


// =====================================================
// PAGE SETTINGS
// =====================================================

const APPLICATION_PAGE = "application.html";

const STATUS_PAGE = "application-status.html";


// =====================================================
// ELEMENTS
// =====================================================

const form =
    document.getElementById(
        "registrationForm"
    );


const firstNameInput =
    document.getElementById(
        "firstName"
    );


const middleNameInput =
    document.getElementById(
        "middleName"
    );


const lastNameInput =
    document.getElementById(
        "lastName"
    );


const emailInput =
    document.getElementById(
        "email"
    );


const passwordInput =
    document.getElementById(
        "password"
    );


const confirmPasswordInput =
    document.getElementById(
        "confirmPassword"
    );


const termsInput =
    document.getElementById(
        "terms"
    );


const message =
    document.getElementById(
        "message"
    );


const registerBtn =
    document.getElementById(
        "registerBtn"
    );


const buttonText =
    document.getElementById(
        "buttonText"
    );


const buttonIcon =
    document.getElementById(
        "buttonIcon"
    );


const togglePassword =
    document.getElementById(
        "togglePassword"
    );


const toggleConfirmPassword =
    document.getElementById(
        "toggleConfirmPassword"
    );


// =====================================================
// CHECK ELEMENTS
// =====================================================

if (!form) {

    console.error(
        "ERROR: registrationForm was not found."
    );
}


if (!message) {

    console.error(
        "ERROR: message element was not found."
    );
}


// =====================================================
// SHOW MESSAGE
// =====================================================

function showMessage(
    text,
    type = "info"
) {

    if (!message) {

        alert(text);

        return;
    }


    message.textContent =
        text;


    message.className =
        "message " + type;
}


// =====================================================
// HIDE MESSAGE
// =====================================================

function hideMessage() {

    if (!message) {
        return;
    }


    message.textContent =
        "";


    message.className =
        "message";
}


// =====================================================
// LOADING STATE
// =====================================================

function setLoading(
    loading,
    text = "Submit"
) {

    if (registerBtn) {

        registerBtn.disabled =
            loading;
    }


    if (loading) {

        if (buttonText) {

            buttonText.textContent =
                text;
        }


        if (buttonIcon) {

            buttonIcon.className =
                "fa-solid fa-spinner fa-spin";
        }

    } else {

        if (buttonText) {

            buttonText.textContent =
                "Submit";
        }


        if (buttonIcon) {

            buttonIcon.className =
                "fa-solid fa-arrow-right";
        }
    }
}


// =====================================================
// PASSWORD VALIDATION
// =====================================================
//
// REQUIREMENTS:
//
// 1. At least 8 characters
// 2. At least one uppercase letter A-Z
// 3. At least one lowercase letter a-z
// 4. At least one number 0-9
// 5. At least one special character:
//    @ # $ % ! & *
//
// =====================================================

function validatePassword(password) {

    // Check minimum length
    if (password.length < 8) {

        return "Password must be at least 8 characters long.";
    }


    // Check uppercase letter
    if (!/[A-Z]/.test(password)) {

        return "Password must contain at least one uppercase letter (A-Z).";
    }


    // Check lowercase letter
    if (!/[a-z]/.test(password)) {

        return "Password must contain at least one lowercase letter (a-z).";
    }


    // Check number
    if (!/[0-9]/.test(password)) {

        return "Password must contain at least one number (0-9).";
    }


    // Check special character
    if (!/[@#$%!&*]/.test(password)) {

        return "Password must contain at least one special character (@ # $ % ! & *).";
    }


    // Password passed all requirements
    return null;
}


// =====================================================
// PASSWORD TOGGLE
// =====================================================

if (togglePassword) {

    togglePassword.addEventListener(
        "click",
        () => {

            const isPassword =
                passwordInput.type === "password";


            passwordInput.type =
                isPassword
                    ? "text"
                    : "password";


            togglePassword.innerHTML =
                isPassword
                    ? '<i class="fa-solid fa-eye-slash"></i>'
                    : '<i class="fa-solid fa-eye"></i>';
        }
    );
}


// =====================================================
// CONFIRM PASSWORD TOGGLE
// =====================================================

if (toggleConfirmPassword) {

    toggleConfirmPassword.addEventListener(
        "click",
        () => {

            const isPassword =
                confirmPasswordInput.type === "password";


            confirmPasswordInput.type =
                isPassword
                    ? "text"
                    : "password";


            toggleConfirmPassword.innerHTML =
                isPassword
                    ? '<i class="fa-solid fa-eye-slash"></i>'
                    : '<i class="fa-solid fa-eye"></i>';
        }
    );
}


// =====================================================
// FIREBASE ERROR
// =====================================================

function getFirebaseError(error) {

    console.error(
        "Firebase Error:",
        error
    );


    switch (error.code) {

        case "auth/email-already-in-use":

            return "This email is already registered. We will continue to your existing application.";


        case "auth/invalid-email":

            return "Please enter a valid email address.";


        case "auth/weak-password":

            return "Password does not meet the required security policy. Use at least 8 characters with uppercase, lowercase, number, and special character.";


        case "auth/wrong-password":

            return "Incorrect password. Please try again.";


        case "auth/invalid-credential":

            return "The email or password is incorrect.";


        case "auth/user-not-found":

            return "Applicant account was not found.";


        case "auth/network-request-failed":

            return "Network error. Please check your internet connection.";


        case "auth/operation-not-allowed":

            return "Email/password authentication is not enabled in Firebase.";


        case "permission-denied":

            return "Firebase Firestore permission denied. Please check your Firestore rules.";


        default:

            return error.message ||
                "Something went wrong. Please try again.";
    }
}


// =====================================================
// GET APPLICANT DESTINATION
// =====================================================

async function getApplicantDestination(
    uid
) {

    try {

        const applicationRef =
            doc(
                db,
                "applications",
                uid
            );


        const applicationSnapshot =
            await getDoc(
                applicationRef
            );


        // ---------------------------------------------
        // NO APPLICATION YET
        // ---------------------------------------------

        if (
            !applicationSnapshot.exists()
        ) {

            return APPLICATION_PAGE;
        }


        const applicationData =
            applicationSnapshot.data();


        const applicationStatus =
            applicationData.status ||
            "draft";


        // ---------------------------------------------
        // APPLICATION NOT FINISHED
        // ---------------------------------------------

        if (
            applicationStatus ===
                "not_started" ||

            applicationStatus ===
                "draft"
        ) {

            return APPLICATION_PAGE;
        }


        // ---------------------------------------------
        // APPLICATION ALREADY SUBMITTED
        // ---------------------------------------------

        return STATUS_PAGE;


    } catch (error) {

        console.error(
            "Checking application status failed:",
            error
        );


        // If checking fails,
        // safely return to application form.

        return APPLICATION_PAGE;
    }
}


// =====================================================
// REGISTRATION / EXISTING APPLICANT LOGIN
// =====================================================

if (form) {

    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            hideMessage();


            // =================================================
            // GET VALUES
            // =================================================

            const firstName =
                firstNameInput.value.trim();


            const middleName =
                middleNameInput.value.trim();


            const lastName =
                lastNameInput.value.trim();


            const email =
                emailInput.value
                    .trim()
                    .toLowerCase();


            const password =
                passwordInput.value;


            const confirmPassword =
                confirmPasswordInput.value;


            // =================================================
            // BASIC VALIDATION
            // =================================================

            if (!firstName || !lastName) {

                showMessage(
                    "Please enter your complete name.",
                    "error"
                );

                return;
            }


            if (!email) {

                showMessage(
                    "Please enter your email address.",
                    "error"
                );

                return;
            }


            // =================================================
            // PASSWORD SECURITY VALIDATION
            // =================================================

            const passwordError =
                validatePassword(password);


            if (passwordError) {

                showMessage(
                    passwordError,
                    "error"
                );

                return;
            }


            // =================================================
            // CONFIRM PASSWORD
            // =================================================

            if (password !== confirmPassword) {

                showMessage(
                    "Passwords do not match.",
                    "error"
                );

                return;
            }


            // =================================================
            // TERMS AND CONDITIONS
            // =================================================

            if (!termsInput.checked) {

                showMessage(
                    "Please agree to the Terms and Conditions.",
                    "error"
                );

                return;
            }


            // =================================================
            // START LOADING
            // =================================================

            setLoading(
                true,
                "Checking account..."
            );


            try {

                // =================================================
                // FIRST: TRY TO CREATE A NEW ACCOUNT
                // =================================================

                console.log(
                    "Checking applicant account..."
                );


                try {

                    const userCredential =
                        await createUserWithEmailAndPassword(
                            auth,
                            email,
                            password
                        );


                    const user =
                        userCredential.user;


                    console.log(
                        "New Firebase account created:",
                        user.uid
                    );


                    // =================================================
                    // UPDATE FIREBASE PROFILE
                    // =================================================

                    await updateProfile(
                        user,
                        {
                            displayName:
                                `${firstName} ${lastName}`
                        }
                    );


                    // =================================================
                    // CREATE FIRESTORE USER
                    // =================================================

                    await setDoc(

                        doc(
                            db,
                            "users",
                            user.uid
                        ),

                        {

                            uid:
                                user.uid,

                            firstName:
                                firstName,

                            middleName:
                                middleName,

                            lastName:
                                lastName,

                            email:
                                email,

                            role:
                                "applicant",

                            status:
                                "pending",

                            accountStatus:
                                "pending",

                            applicationStatus:
                                "not_started",

                            createdAt:
                                serverTimestamp(),

                            updatedAt:
                                serverTimestamp()
                        }
                    );


                    // =================================================
                    // SAVE APPLICANT UID
                    // =================================================

                    sessionStorage.setItem(
                        "applicantUID",
                        user.uid
                    );


                    // =================================================
                    // NEW APPLICANT → APPLICATION FORM
                    // =================================================

                    showMessage(
                        "Registration successful! Opening your scholarship application...",
                        "success"
                    );


                    setTimeout(
                        () => {

                            window.location.href =
                                APPLICATION_PAGE;

                        },
                        1000
                    );


                    return;


                } catch (createError) {

                    // =================================================
                    // EXISTING EMAIL
                    // =================================================

                    if (
                        createError.code !==
                        "auth/email-already-in-use"
                    ) {

                        throw createError;
                    }


                    console.log(
                        "Existing applicant account detected."
                    );


                    // =================================================
                    // SIGN IN EXISTING APPLICANT
                    // =================================================

                    setLoading(
                        true,
                        "Signing in..."
                    );


                    const loginCredential =
                        await signInWithEmailAndPassword(
                            auth,
                            email,
                            password
                        );


                    const user =
                        loginCredential.user;


                    console.log(
                        "Existing applicant signed in:",
                        user.uid
                    );


                    // =================================================
                    // GET USER DOCUMENT
                    // =================================================

                    const userRef =
                        doc(
                            db,
                            "users",
                            user.uid
                        );


                    const userSnapshot =
                        await getDoc(
                            userRef
                        );


                    // =================================================
                    // USER DOCUMENT NOT FOUND
                    // =================================================

                    if (
                        !userSnapshot.exists()
                    ) {

                        showMessage(
                            "Your account exists, but your applicant information could not be found.",
                            "error"
                        );

                        return;
                    }


                    const userData =
                        userSnapshot.data();


                    // =================================================
                    // CHECK ROLE
                    // =================================================

                    if (
                        userData.role !==
                        "applicant"
                    ) {

                        showMessage(
                            "This account is not registered as an applicant.",
                            "error"
                        );

                        return;
                    }


                    // =================================================
                    // SAVE APPLICANT UID
                    // =================================================

                    sessionStorage.setItem(
                        "applicantUID",
                        user.uid
                    );


                    // =================================================
                    // CHECK APPLICATION STATUS
                    // =================================================

                    const destination =
                        await getApplicantDestination(
                            user.uid
                        );


                    // =================================================
                    // REDIRECT MESSAGE
                    // =================================================

                    if (
                        destination ===
                        APPLICATION_PAGE
                    ) {

                        showMessage(
                            "Welcome back! Opening your scholarship application...",
                            "success"
                        );

                    } else {

                        showMessage(
                            "Welcome back! Opening your application status...",
                            "success"
                        );
                    }


                    // =================================================
                    // REDIRECT
                    // =================================================

                    setTimeout(
                        () => {

                            window.location.href =
                                destination;

                        },
                        1000
                    );
                }


            } catch (error) {

                console.error(
                    "Registration/Login Error:",
                    error
                );


                showMessage(
                    getFirebaseError(error),
                    "error"
                );


            } finally {

                setLoading(
                    false
                );
            }
        }
    );
}
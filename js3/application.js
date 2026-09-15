// =========================================================
// SCHOLARLINK - SCHOLARSHIP APPLICATION
// application.js
// =========================================================

// =========================================================
// FIREBASE
// =========================================================

import {
    auth,
    db
} from "../firebase.js";

// =========================================================
// SUPABASE
// =========================================================

import {
    supabase
} from "../supabase.js";

// =========================================================
// FIREBASE AUTH
// =========================================================

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// =========================================================
// FIREBASE FIRESTORE
// =========================================================

import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp,
    runTransaction
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// =========================================================
// ELEMENTS
// =========================================================

const form =
    document.getElementById("applicationForm");

const applicationForm = form;

const message =
    document.getElementById("formMessage");

const saveDraftBtn =
    document.getElementById("saveDraftBtn");

const submitApplicationBtn =
    document.getElementById("submitBtn");

const submitBtn =
    submitApplicationBtn;

const submitButtonText =
    document.getElementById("submitText");

const submitText =
    submitButtonText;

const submitButtonIcon =
    document.getElementById("submitIcon");

// =========================================================
// APPLICANT PHOTO ELEMENTS
// =========================================================

const applicantPhotoInput =
    document.getElementById("applicantPhoto");

const photoPreview =
    document.getElementById("photoPreview");

const photoPlaceholder =
    document.getElementById("photoPlaceholder");

const photoUploadLabel =
    document.querySelector(".photo-upload-btn");

// =========================================================
// APPLICANT ID ELEMENT
// =========================================================

const applicantIdInput =
    document.getElementById("applicantId");

// =========================================================
// CURRENT USER
// =========================================================

let currentUser = null;

// =========================================================
// ADDRESS CASCADING DROPDOWNS
// =========================================================

const PSGC_API =
    "https://psgc.cloud/api/v2";

const provinceSelect =
    document.getElementById("province");

const citySelect =
    document.getElementById("city");

const barangaySelect =
    document.getElementById("barangay");

const addressDetailsInput =
    document.getElementById("addressDetails");

const completeAddressInput =
    document.getElementById("completeAddress");


// =========================================================
// LOAD ALL PHILIPPINE PROVINCES
// =========================================================

async function loadProvinces() {

    if (!provinceSelect) {
        return;
    }

    provinceSelect.innerHTML =
        `<option value="">Select Province</option>`;

    provinceSelect.disabled = true;

    try {

        const response =
            await fetch(
                `${PSGC_API}/provinces`
            );

        if (!response.ok) {
            throw new Error(
                "Failed to load provinces."
            );
        }
const provincesResponse =
    await response.json();

const provinces =
    Array.isArray(provincesResponse)
        ? provincesResponse
        : Array.isArray(provincesResponse.data)
            ? provincesResponse.data
            : Array.isArray(provincesResponse.results)
                ? provincesResponse.results
                : [];

if (provinces.length === 0) {
    throw new Error(
        "No provinces were returned by the PSGC API."
    );
}

provinces.sort(
    (a, b) =>
        a.name.localeCompare(
            b.name,
            undefined,
            {
                sensitivity: "base"
            }
        )
);

        provinces.forEach(
            province => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    province.code;

                option.textContent =
                    province.name;

                provinceSelect.appendChild(
                    option
                );
            }
        );

        provinceSelect.disabled =
            false;

    } catch (error) {

        console.error(
            "Failed to load provinces:",
            error
        );

        provinceSelect.innerHTML =
            `<option value="">
                Unable to load provinces
            </option>`;
    }
}


// =========================================================
// LOAD CITIES / MUNICIPALITIES
// BASED ON SELECTED PROVINCE
// =========================================================

async function loadCities(
    provinceCode
) {

    if (!citySelect) {
        return;
    }

    citySelect.innerHTML =
        `<option value="">
            Select Municipality / City
        </option>`;

    citySelect.disabled = true;

    if (barangaySelect) {

        barangaySelect.innerHTML =
            `<option value="">
                Select Barangay
            </option>`;

        barangaySelect.disabled = true;
    }

    if (!provinceCode) {

        updateCompleteAddress();

        return;
    }

    try {

        const response =
            await fetch(
                `${PSGC_API}/provinces/${provinceCode}/cities-municipalities`
            );

        if (!response.ok) {

            throw new Error(
                "Failed to load cities and municipalities."
            );
        }
const citiesResponse =
    await response.json();

const cities =
    Array.isArray(citiesResponse)
        ? citiesResponse
        : Array.isArray(citiesResponse.data)
            ? citiesResponse.data
            : Array.isArray(citiesResponse.results)
                ? citiesResponse.results
                : [];

if (cities.length === 0) {
    throw new Error(
        "No cities or municipalities were returned by the PSGC API."
    );
}

cities.sort(
    (a, b) =>
        a.name.localeCompare(
            b.name,
            undefined,
            {
                sensitivity: "base"
            }
        )
);

cities.forEach(
    city => {

        const option =
            document.createElement("option");

        option.value =
            city.code;

        option.textContent =
            city.name;

        citySelect.appendChild(option);
    }
);

        citySelect.disabled =
            false;

    } catch (error) {

        console.error(
            "Failed to load cities/municipalities:",
            error
        );

        citySelect.innerHTML =
            `<option value="">
                Unable to load cities
            </option>`;
    }

    updateCompleteAddress();
}


// =========================================================
// LOAD BARANGAYS
// BASED ON SELECTED CITY / MUNICIPALITY
// =========================================================

async function loadBarangays(
    cityCode
) {

    if (!barangaySelect) {
        return;
    }

    barangaySelect.innerHTML =
        `<option value="">
            Select Barangay
        </option>`;

    barangaySelect.disabled = true;

    if (!cityCode) {

        updateCompleteAddress();

        return;
    }

    try {

        const response =
            await fetch(
                `${PSGC_API}/cities-municipalities/${cityCode}/barangays`
            );

        if (!response.ok) {

            throw new Error(
                "Failed to load barangays."
            );
        }

       const barangaysResponse =
    await response.json();

const barangays =
    Array.isArray(barangaysResponse)
        ? barangaysResponse
        : Array.isArray(barangaysResponse.data)
            ? barangaysResponse.data
            : Array.isArray(barangaysResponse.results)
                ? barangaysResponse.results
                : [];

if (barangays.length === 0) {
    throw new Error(
        "No barangays were returned by the PSGC API."
    );
}

barangays.sort(
    (a, b) =>
        a.name.localeCompare(
            b.name,
            undefined,
            {
                sensitivity: "base"
            }
        )
);
        barangays.forEach(
            barangay => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    barangay.code;

                option.textContent =
                    barangay.name;

                barangaySelect.appendChild(
                    option
                );
            }
        );

        barangaySelect.disabled =
            false;

    } catch (error) {

        console.error(
            "Failed to load barangays:",
            error
        );

        barangaySelect.innerHTML =
            `<option value="">
                Unable to load barangays
            </option>`;
    }

    updateCompleteAddress();
}


// =========================================================
// GET SELECTED TEXT
// =========================================================

function getSelectedText(
    selectElement
) {

    if (!selectElement) {
        return "";
    }

    const selectedOption =
        selectElement.options[
            selectElement.selectedIndex
        ];

    if (!selectedOption) {
        return "";
    }

    const text =
        selectedOption.textContent.trim();

    if (
        !text ||
        text === "Select Province" ||
        text === "Select Municipality / City" ||
        text === "Select Barangay" ||
        text.startsWith("Unable to load")
    ) {

        return "";
    }

    return text;
}


// =========================================================
// AUTOMATIC COMPLETE ADDRESS
// =========================================================

function updateCompleteAddress() {

    if (!completeAddressInput) {
        return;
    }

    const addressDetails =
        addressDetailsInput?.value.trim() || "";

    const barangay =
        getSelectedText(
            barangaySelect
        );

    const city =
        getSelectedText(
            citySelect
        );

    const province =
        getSelectedText(
            provinceSelect
        );

    const parts = [];

    if (addressDetails) {
        parts.push(addressDetails);
    }

    if (barangay) {
        parts.push(barangay);
    }

    if (city) {
        parts.push(city);
    }

    if (province) {
        parts.push(province);
    }

    if (parts.length > 0) {
        parts.push("Philippines");
    }

    completeAddressInput.value =
        parts.join(", ");
}


// =========================================================
// PROVINCE CHANGE
// =========================================================

if (provinceSelect) {

    provinceSelect.addEventListener(
        "change",
        async function () {

            try {

                await loadCities(
                    provinceSelect.value
                );

            } catch (error) {

                console.error(
                    "Province change error:",
                    error
                );
            }

            updateCompleteAddress();
        }
    );
}


// =========================================================
// CITY / MUNICIPALITY CHANGE
// =========================================================

if (citySelect) {

    citySelect.addEventListener(
        "change",
        async function () {

            try {

                await loadBarangays(
                    citySelect.value
                );

            } catch (error) {

                console.error(
                    "City/Municipality change error:",
                    error
                );
            }

            updateCompleteAddress();
        }
    );
}


// =========================================================
// BARANGAY CHANGE
// =========================================================

if (barangaySelect) {

    barangaySelect.addEventListener(
        "change",
        updateCompleteAddress
    );
}


// =========================================================
// HOUSE / STREET / PUROK CHANGE
// =========================================================

if (addressDetailsInput) {

    addressDetailsInput.addEventListener(
        "input",
        updateCompleteAddress
    );
}


// =========================================================
// INITIALIZE ADDRESS
// =========================================================

const addressReadyPromise =
    loadProvinces().catch(
        error => {

            console.error(
                "Address initialization error:",
                error
            );

            throw error;
        }
    );

// =========================================================
// MESSAGE
// =========================================================

function showMessage(text, type = "info") {

    if (!message) {
        console.error(
            "Message element not found:",
            text
        );

        return;
    }

    message.textContent = text;

    message.className =
        "form-message " + type;

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// =========================================================
// HIDE MESSAGE
// =========================================================

function hideMessage() {

    if (!message) {
        return;
    }

    message.textContent = "";

    message.className =
        "form-message";
}


// =========================================================
// LOADING
// =========================================================

function setLoading(
    loading,
    text = "Submit Application"
) {

    if (submitApplicationBtn) {

        submitApplicationBtn.disabled =
            loading;
    }

    if (saveDraftBtn) {

        saveDraftBtn.disabled =
            loading;
    }


    if (loading) {

        if (submitButtonText) {

            submitButtonText.textContent =
                text;
        }

        if (submitButtonIcon) {

            submitButtonIcon.className =
                "fa-solid fa-spinner fa-spin";
        }

    } else {

        if (submitButtonText) {

            submitButtonText.textContent =
                "Submit Application";
        }

        if (submitButtonIcon) {

            submitButtonIcon.className =
                "fa-solid fa-paper-plane";
        }
    }
}


// =========================================================
// AUTOMATIC APPLICANT ID
// =========================================================

function generateApplicantId(
    sequenceNumber
) {

    const year =
        new Date().getFullYear();

    return `APP-${year}-${String(sequenceNumber).padStart(4, "0")}`;
}


// =========================================================
// GET OR CREATE APPLICANT ID
// =========================================================

async function getOrCreateApplicantId(uid) {

    if (!uid) {

        throw new Error(
            "Applicant account is not available."
        );
    }


    const applicationRef =
        doc(
            db,
            "applications",
            uid
        );


    const applicationSnap =
        await getDoc(
            applicationRef
        );


    // -----------------------------------------------------
    // EXISTING APPLICANT ID
    // -----------------------------------------------------

    if (applicationSnap.exists()) {

        const existingId =
            applicationSnap.data()?.applicantId;

        if (existingId) {

            return existingId;
        }
    }


    // -----------------------------------------------------
    // CREATE NEW APPLICANT ID
    // -----------------------------------------------------

    const year =
        new Date().getFullYear();

    const counterRef =
        doc(
            db,
            "systemCounters",
            `applicantId_${year}`
        );


    const applicantId =
        await runTransaction(
            db,
            async (transaction) => {

                const counterSnap =
                    await transaction.get(
                        counterRef
                    );


                const nextNumber =
                    counterSnap.exists()
                        ? Number(
                            counterSnap.data()
                                ?.lastNumber || 0
                        ) + 1
                        : 1;


                const newApplicantId =
                    generateApplicantId(
                        nextNumber
                    );


                // -------------------------------------------------
                // SAVE COUNTER
                // -------------------------------------------------

                transaction.set(
                    counterRef,
                    {
                        lastNumber:
                            nextNumber,

                        year:
                            year,

                        updatedAt:
                            serverTimestamp()
                    },
                    {
                        merge: true
                    }
                );


                // -------------------------------------------------
                // SAVE APPLICANT ID
                // -------------------------------------------------

                transaction.set(
                    applicationRef,
                    {
                        applicantId:
                            newApplicantId,

                        updatedAt:
                            serverTimestamp()
                    },
                    {
                        merge: true
                    }
                );


                return newApplicantId;
            }
        );


    return applicantId;
}


// =========================================================
// DISPLAY APPLICANT ID
// =========================================================

function displayApplicantId(
    applicantId
) {

    if (!applicantId) {
        return;
    }


    const element =
        document.getElementById(
            "applicantId"
        );


    if (!element) {

        console.warn(
            "Applicant ID element not found. Add id=\"applicantId\" to application.html."
        );

        return;
    }


    // INPUT / TEXT FIELD
    if (
        "value" in element
    ) {

        element.value =
            applicantId;

    } else {

        // DIV / SPAN / P
        element.textContent =
            applicantId;
    }
}


// =========================================================
// FIREBASE AUTHENTICATION
// =========================================================

onAuthStateChanged(
    auth,
    async (user) => {

        // -------------------------------------------------
        // NO USER
        // -------------------------------------------------

        if (!user) {

            showMessage(
                "Your applicant session has expired. Please register again.",
                "error"
            );


            setTimeout(
                () => {

                    window.location.href =
                        "registration.html";

                },
                2000
            );


            return;
        }


        // -------------------------------------------------
        // CURRENT USER
        // -------------------------------------------------

        currentUser =
            user;


        try {

            // -------------------------------------------------
            // GET USER DOCUMENT
            // -------------------------------------------------

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


            if (
                !userSnapshot.exists()
            ) {

                showMessage(
                    "Applicant account information could not be found.",
                    "error"
                );

                return;
            }


            const userData =
                userSnapshot.data();


            // -------------------------------------------------
            // CHECK ROLE
            // -------------------------------------------------

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


            // -------------------------------------------------
            // AUTO-FILL REGISTRATION INFORMATION
            // -------------------------------------------------

            setValue(
                "firstName",
                userData.firstName
            );


            setValue(
                "middleName",
                userData.middleName
            );


            setValue(
                "lastName",
                userData.lastName
            );


            setValue(
                "email",
                user.email ||
                userData.email
            );


            // -------------------------------------------------
            // GET / CREATE APPLICANT ID
            // -------------------------------------------------

            const applicantId =
                await getOrCreateApplicantId(
                    user.uid
                );


            displayApplicantId(
                applicantId
            );


            // -------------------------------------------------
            // LOAD EXISTING APPLICATION
            // -------------------------------------------------

            await loadExistingApplication(
                user.uid
            );


        } catch (error) {

            console.error(
                "Authentication/Application Error:",
                error
            );


            showMessage(
                "Unable to load your application. Please try again.",
                "error"
            );
        }
    }
);


// =========================================================
// LOAD EXISTING APPLICATION
// =========================================================

async function loadExistingApplication(
    uid
) {

    if (!uid) {
        return;
    }


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


        if (
            !applicationSnapshot.exists()
        ) {

            return;
        }


        const data =
            applicationSnapshot.data();


        // =================================================
        // APPLICANT ID
        // =================================================

        if (
            data.applicantId
        ) {

            displayApplicantId(
                data.applicantId
            );
        }


        // =================================================
        // PERSONAL INFORMATION
        // =================================================

        const personal =
            data.personalInformation ||
            {};


        setValue(
            "firstName",
            personal.firstName
        );


        setValue(
            "middleName",
            personal.middleName
        );


        setValue(
            "lastName",
            personal.lastName
        );


        setValue(
            "suffix",
            personal.suffix
        );


        setValue(
            "dateOfBirth",
            personal.dateOfBirth
        );


        setValue(
            "age",
            personal.age
        );


        setValue(
            "sex",
            personal.sex
        );


        setValue(
            "civilStatus",
            personal.civilStatus
        );


        setValue(
            "citizenship",
            personal.citizenship
        );


        setValue(
            "birthplace",
            personal.birthplace
        );

        // =================================================
        // ADDRESS INFORMATION
        // =================================================

            await addressReadyPromise;

            if (personal.province && provinceSelect) {

                const provinceOption =
                    Array.from(provinceSelect.options).find(
                        option =>
                            option.textContent.trim().toLowerCase() ===
                            String(personal.province)
                                .trim()
                                .toLowerCase()
                    );

                if (provinceOption) {

                    provinceSelect.value =
                        provinceOption.value;

                    await loadCities(
                        provinceOption.value
                    );
                }
            }


            if (personal.city && citySelect) {

                const cityOption =
                    Array.from(citySelect.options).find(
                        option =>
                            option.textContent.trim().toLowerCase() ===
                            String(personal.city)
                                .trim()
                                .toLowerCase()
                    );

                if (cityOption) {

                    citySelect.value =
                        cityOption.value;

                    await loadBarangays(
                        cityOption.value
                    );
                }
            }


            if (personal.barangay && barangaySelect) {

                const barangayOption =
                    Array.from(barangaySelect.options).find(
                        option =>
                            option.textContent.trim().toLowerCase() ===
                            String(personal.barangay)
                                .trim()
                                .toLowerCase()
                    );

                if (barangayOption) {

                    barangaySelect.value =
                        barangayOption.value;
                }
            }


            setValue(
                "addressDetails",
                personal.addressDetails || ""
            );


            setValue(
                "zipCode",
                personal.zipCode || ""
            );


            if (personal.completeAddress) {

                setValue(
                    "completeAddress",
                    personal.completeAddress
                );

            } else {

                updateCompleteAddress();
            }


        setValue(
            "contactNumber",
            personal.contactNumber
        );


        setValue(
            "email",
            personal.email
        );


        // =================================================
        // ACADEMIC INFORMATION
        // =================================================

        const academic =
            data.academicInformation ||
            {};


        setValue(
            "schoolName",
            academic.schoolName
        );


        setValue(
            "schoolAddress",
            academic.schoolAddress
        );


        setValue(
            "studentId",
            academic.studentId
        );


        setValue(
            "generalAverage",
            academic.generalAverage
        );


        setValue(
            "graduationYear",
            academic.graduationYear
        );


        // =================================================
        // FAMILY INFORMATION
        // =================================================

        const family =
            data.familyInformation ||
            {};


        const father =
            family.father ||
            {};


        const mother =
            family.mother ||
            {};


        const guardian =
            family.guardian ||
            {};


        // -------------------------------------------------
        // FATHER
        // -------------------------------------------------

        setValue(
            "fatherName",
            father.name
        );


        setValue(
            "fatherOccupation",
            father.occupation
        );


        setValue(
            "fatherEmployer",
            father.employer
        );


        setValue(
            "fatherIncome",
            father.monthlyIncome
        );


        setValue(
            "fatherContact",
            father.contactNumber
        );


        // -------------------------------------------------
        // MOTHER
        // -------------------------------------------------

        setValue(
            "motherName",
            mother.name
        );


        setValue(
            "motherOccupation",
            mother.occupation
        );


        setValue(
            "motherEmployer",
            mother.employer
        );


        setValue(
            "motherIncome",
            mother.monthlyIncome
        );


        setValue(
            "motherContact",
            mother.contactNumber
        );


        // -------------------------------------------------
        // GUARDIAN
        // -------------------------------------------------

        setValue(
            "guardianName",
            guardian.name
        );


        setValue(
            "guardianRelationship",
            guardian.relationship
        );


        setValue(
            "guardianOccupation",
            guardian.occupation
        );


        setValue(
            "guardianIncome",
            guardian.monthlyIncome
        );


        setValue(
            "guardianContact",
            guardian.contactNumber
        );


        // =================================================
        // HOUSEHOLD INFORMATION
        // =================================================

        const household =
            data.householdInformation ||
            {};


        setValue(
            "familyMembers",
            household.familyMembers
        );


        setValue(
            "siblings",
            household.siblings
        );


        setValue(
            "siblingsStudying",
            household.siblingsStudying
        );


        setValue(
            "householdIncome",
            household.totalMonthlyIncome
        );


        setValue(
            "housingStatus",
            household.housingStatus
        );


        setValue(
            "incomeSource",
            household.incomeSource
        );


        // =================================================
        // REASON FOR APPLYING
        // =================================================

        setValue(
            "reason",
            data.reasonForApplying
        );


    } catch (error) {

        console.error(
            "Load Existing Application Error:",
            error
        );


        showMessage(
            "Unable to load your saved application.",
            "error"
        );
    }
}


// =========================================================
// GET VALUE
// =========================================================

function getValue(id) {

    const element =
        document.getElementById(id);


    if (!element) {

        return "";
    }


    return element.value.trim();
}


// =========================================================
// SET VALUE
// =========================================================

function setValue(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (!element) {

        return;
    }


    if (
        value !== undefined &&
        value !== null
    ) {

        element.value =
            value;
    }
}


// =========================================================
// APPLICANT PHOTO PREVIEW
// =========================================================

if (applicantPhotoInput) {

    applicantPhotoInput.addEventListener(
        "change",
        function () {

            const file =
                this.files?.[0];


            if (!file) {

                return;
            }


            // -------------------------------------------------
            // FILE TYPE
            // -------------------------------------------------

            const allowedTypes = [
                "image/jpeg",
                "image/png"
            ];


            if (
                !allowedTypes.includes(
                    file.type
                )
            ) {

                showMessage(
                    "Please upload a JPG, JPEG, or PNG image.",
                    "error"
                );


                this.value = "";

                return;
            }


            // -------------------------------------------------
            // FILE SIZE
            // -------------------------------------------------

            if (
                file.size >
                5 * 1024 * 1024
            ) {

                showMessage(
                    "Applicant photo must not exceed 5 MB.",
                    "error"
                );


                this.value = "";

                return;
            }


            // -------------------------------------------------
            // PREVIEW
            // -------------------------------------------------

            const reader =
                new FileReader();


            reader.onload =
                function (event) {

                    if (photoPreview) {

                        photoPreview.src =
                            event.target.result;


                        photoPreview.style.display =
                            "block";
                    }


                    if (photoPlaceholder) {

                        photoPlaceholder.style.display =
                            "none";
                    }
                };


            reader.readAsDataURL(
                file
            );
        }
    );
}


// =========================================================
// SUPABASE CHECK
// =========================================================

function checkSupabase() {

    if (!supabase) {

        throw new Error(
            "Supabase is not initialized. Check supabase.js and make sure the Supabase CDN is loaded."
        );
    }


    return true;
}


// =========================================================
// UPLOAD APPLICANT PHOTO
// =========================================================

async function uploadApplicantPhoto(
    file,
    uid
) {

    checkSupabase();


    if (!file) {

        return null;
    }


    // -----------------------------------------------------
    // FILE TYPE
    // -----------------------------------------------------

    const allowedTypes = [
        "image/jpeg",
        "image/png"
    ];


    if (
        !allowedTypes.includes(
            file.type
        )
    ) {

        throw new Error(
            "Applicant photo must be JPG, JPEG, or PNG."
        );
    }


    // -----------------------------------------------------
    // FILE SIZE
    // -----------------------------------------------------

    if (
        file.size >
        10 * 1024 * 1024
    ) {

        throw new Error(
            "Applicant photo must not exceed 10 MB."
        );
    }


    // -----------------------------------------------------
    // EXTENSION
    // -----------------------------------------------------

    let extension =
        file.name
            .split(".")
            .pop()
            .toLowerCase();


    if (
        extension === "jpeg"
    ) {

        extension = "jpg";
    }


    // -----------------------------------------------------
    // STORAGE PATH
    // -----------------------------------------------------

    const storagePath =
        `${uid}/profile.${extension}`;


    console.log(
        "Uploading applicant photo:",
        storagePath
    );


    // -----------------------------------------------------
    // UPLOAD
    // -----------------------------------------------------

    const {
        data,
        error
    } =
        await supabase.storage
            .from(
                "applicant-photos"
            )
            .upload(
                storagePath,
                file,
                {
                    contentType:
                        file.type,

                    upsert:
                        false
                }
            );


    if (error) {

        console.error(
            "Applicant photo upload error:",
            error
        );


        throw new Error(
            `Applicant photo upload failed: ${error.message}`
        );
    }


    console.log(
        "Applicant photo uploaded:",
        data
    );


    // -----------------------------------------------------
    // PRIVATE BUCKET
    // -----------------------------------------------------
    // DO NOT USE getPublicUrl()
    // because applicant-photos is private.
    // -----------------------------------------------------

    return {

        fileName:
            file.name,

        storagePath:
            data?.path ||
            storagePath,

        uploadedAt:
            new Date().toISOString()
    };
}


// =========================================================
// UPLOAD REQUIREMENT
// =========================================================

async function uploadRequirement(
    file,
    uid,
    documentType
) {

    checkSupabase();


    if (!file) {

        return null;
    }


    // -----------------------------------------------------
    // ALLOWED FILE TYPES
    // -----------------------------------------------------

    const allowedTypes = [
        "image/jpeg",
        "image/png"
    ];


    if (
        !allowedTypes.includes(
            file.type
        )
    ) {

        throw new Error(
            `${documentType} must be JPG, JPEG, or PNG.`
        );
    }


    // -----------------------------------------------------
    // FILE SIZE
    // -----------------------------------------------------

    if (
        file.size >
        10 * 1024 * 1024
    ) {

        throw new Error(
            `${documentType} must not exceed 10 MB.`
        );
    }


    // -----------------------------------------------------
    // EXTENSION
    // -----------------------------------------------------

    let extension =
        file.name
            .split(".")
            .pop()
            .toLowerCase();


    if (
        extension === "jpeg"
    ) {

        extension = "jpg";
    }


    // -----------------------------------------------------
    // SAFE DOCUMENT NAME
    // -----------------------------------------------------

    const safeDocumentType =
        documentType
            .toLowerCase()
            .replace(
                /[^a-z0-9_-]/g,
                "_"
            );


    // -----------------------------------------------------
    // STORAGE PATH
    // -----------------------------------------------------

    const storagePath =
        `${uid}/${safeDocumentType}.${extension}`;


    console.log(
        `Uploading ${documentType}:`,
        storagePath
    );


    // -----------------------------------------------------
    // UPLOAD
    // -----------------------------------------------------

    const {
        data,
        error
    } =
        await supabase.storage
            .from(
                "requirements"
            )
            .upload(
                storagePath,
                file,
                {
                    contentType:
                        file.type,

                    upsert:
                        false
                }
            );


    if (error) {

        console.error(
            `${documentType} upload error:`,
            error
        );


        throw new Error(
            `${documentType} upload failed: ${error.message}`
        );
    }


    console.log(
        `${documentType} uploaded successfully`
    );


    // -----------------------------------------------------
    // PRIVATE BUCKET
    // -----------------------------------------------------
    // DO NOT USE getPublicUrl()
    // -----------------------------------------------------

    return {

        fileName:
            file.name,

        storagePath:
            data?.path ||
            storagePath,

        uploadedAt:
            new Date().toISOString()
    };
}


// =========================================================
// FILE INPUTS
// =========================================================

const birthCertificateInput =
    document.getElementById(
        "birthCertificate"
    );


const registrationCertificateInput =
    document.getElementById(
        "registrationCertificate"
    );


const otherRequirementInput =
    document.getElementById(
        "otherRequirement"
    );


// =========================================================
// FILE VALIDATION
// =========================================================

function validateRequirementFile(
    input,
    required = false
) {

    if (!input) {

        return true;
    }


    const file =
        input.files?.[0];


    // -----------------------------------------------------
    // REQUIRED
    // -----------------------------------------------------

    if (!file) {

        if (required) {

            showMessage(
                `Please upload ${input.id}.`,
                "error"
            );


            return false;
        }


        return true;
    }


    // -----------------------------------------------------
    // TYPE
    // -----------------------------------------------------

    const allowedTypes = [
        "image/jpeg",
        "image/png"
    ];


    if (
        !allowedTypes.includes(
            file.type
        )
    ) {

        showMessage(
            `${file.name} is not a supported file type. Please upload JPG, JPEG, or PNG only.`,
            "error"
        );


        return false;
    }


    // -----------------------------------------------------
    // SIZE
    // -----------------------------------------------------

    if (
        file.size >
        10 * 1024 * 1024
    ) {

        showMessage(
            `${file.name} is larger than 10 MB.`,
            "error"
        );


        return false;
    }


    return true;
}


// =========================================================
// REQUIREMENT FILE CHANGE EVENTS
// =========================================================

if (
    birthCertificateInput
) {

    birthCertificateInput.addEventListener(
        "change",
        () => {

            validateRequirementFile(
                birthCertificateInput,
                true
            );
        }
    );
}


if (
    registrationCertificateInput
) {

    registrationCertificateInput.addEventListener(
        "change",
        () => {

            validateRequirementFile(
                registrationCertificateInput,
                true
            );
        }
    );
}


if (
    otherRequirementInput
) {

    otherRequirementInput.addEventListener(
        "change",
        () => {

            validateRequirementFile(
                otherRequirementInput,
                false
            );
        }
    );
}


// =========================================================
// VALIDATE ALL FILES
// =========================================================

function validateAllFiles() {

    // -----------------------------------------------------
    // APPLICANT PHOTO
    // -----------------------------------------------------

    if (applicantPhotoInput) {

        const photo =
            applicantPhotoInput.files?.[0];


        if (!photo) {

            showMessage(
                "Please upload your applicant photo.",
                "error"
            );


            return false;
        }


        if (
            ![
                "image/jpeg",
                "image/png"
            ].includes(
                photo.type
            )
        ) {

            showMessage(
                "Applicant photo must be JPG, JPEG, or PNG.",
                "error"
            );


            return false;
        }


        if (
            photo.size >
            10 * 1024 * 1024
        ) {

            showMessage(
                "Applicant photo must not exceed 10 MB.",
                "error"
            );


            return false;
        }
    }


    // -----------------------------------------------------
    // BIRTH CERTIFICATE
    // -----------------------------------------------------

    if (
        !validateRequirementFile(
            birthCertificateInput,
            true
        )
    ) {

        return false;
    }


    // -----------------------------------------------------
    // REGISTRATION CERTIFICATE
    // -----------------------------------------------------

    if (
        !validateRequirementFile(
            registrationCertificateInput,
            true
        )
    ) {

        return false;
    }


    // -----------------------------------------------------
    // OTHER REQUIREMENT
    // -----------------------------------------------------

    if (
        !validateRequirementFile(
            otherRequirementInput,
            false
        )
    ) {

        return false;
    }


    return true;
}


// =========================================================
// GET FORM DATA
// =========================================================

function getApplicationData() {

    // -----------------------------------------------------
    // GET APPLICANT ID
    // -----------------------------------------------------

    let applicantId = "";


    if (applicantIdInput) {

        if (
            "value" in applicantIdInput
        ) {

            applicantId =
                applicantIdInput.value.trim();

        } else {

            applicantId =
                applicantIdInput.textContent.trim();
        }
    }


    // -----------------------------------------------------
    // APPLICATION DATA
    // -----------------------------------------------------

    return {

        applicantId:


            applicantId,


        // =================================================
        // PERSONAL INFORMATION
        // =================================================

        personalInformation: {

            firstName:
                getValue(
                    "firstName"
                ),

            middleName:
                getValue(
                    "middleName"
                ),

            lastName:
                getValue(
                    "lastName"
                ),

            suffix:
                getValue(
                    "suffix"
                ),

            dateOfBirth:
                getValue(
                    "dateOfBirth"
                ),

            age:
                getValue(
                    "age"
                ),

            sex:
                getValue(
                    "sex"
                ),

            civilStatus:
                getValue(
                    "civilStatus"
                ),

            citizenship:
                getValue(
                    "citizenship"
                ),

            birthplace:
                getValue(
                    "birthplace"
                ),

            completeAddress:
                getValue(
                    "completeAddress"
                ),

            barangay:
                getValue(
                    "barangay"
                ),

            city:
                getValue(
                    "city"
                ),

            province:
                getValue(
                    "province"
                ),

            zipCode:
                getValue(
                    "zipCode"
                ),

            contactNumber:
                getValue(
                    "contactNumber"
                ),

            email:
                getValue(
                    "email"
                )
        },


        // =================================================
        // ACADEMIC INFORMATION
        // =================================================

        academicInformation: {

            schoolName:
                getValue(
                    "schoolName"
                ),

            schoolAddress:
                getValue(
                    "schoolAddress"
                ),

            studentId:
                getValue(
                    "studentId"
                ),

            generalAverage:
                getValue(
                    "generalAverage"
                ),

            graduationYear:
                getValue(
                    "graduationYear"
                )
        },


        // =================================================
        // FAMILY INFORMATION
        // =================================================

        familyInformation: {

            father: {

                name:
                    getValue(
                        "fatherName"
                    ),

                occupation:
                    getValue(
                        "fatherOccupation"
                    ),

                employer:
                    getValue(
                        "fatherEmployer"
                    ),

                monthlyIncome:
                    getValue(
                        "fatherIncome"
                    ),

                contactNumber:
                    getValue(
                        "fatherContact"
                    )
            },


            mother: {

                name:
                    getValue(
                        "motherName"
                    ),

                occupation:
                    getValue(
                        "motherOccupation"
                    ),

                employer:
                    getValue(
                        "motherEmployer"
                    ),

                monthlyIncome:
                    getValue(
                        "motherIncome"
                    ),

                contactNumber:
                    getValue(
                        "motherContact"
                    )
            },


            guardian: {

                name:
                    getValue(
                        "guardianName"
                    ),

                relationship:
                    getValue(
                        "guardianRelationship"
                    ),

                occupation:
                    getValue(
                        "guardianOccupation"
                    ),

                monthlyIncome:
                    getValue(
                        "guardianIncome"
                    ),

                contactNumber:
                    getValue(
                        "guardianContact"
                    )
            }
        },


        // =================================================
        // HOUSEHOLD INFORMATION
        // =================================================

        householdInformation: {

            familyMembers:
                getValue(
                    "familyMembers"
                ),

            siblings:
                getValue(
                    "siblings"
                ),

            siblingsStudying:
                getValue(
                    "siblingsStudying"
                ),

            totalMonthlyIncome:
                getValue(
                    "householdIncome"
                ),

            housingStatus:
                getValue(
                    "housingStatus"
                ),

            incomeSource:
                getValue(
                    "incomeSource"
                )
        },


        // =================================================
        // REASON
        // =================================================

        reasonForApplying:
            getValue(
                "reason"
            )
    };
}


// =========================================================
// SAVE APPLICATION DATA
// =========================================================

async function saveApplicationData(
    applicationData,
    status
) {

    if (!currentUser) {

        throw new Error(
            "Please login first."
        );
    }


    // -----------------------------------------------------
    // ENSURE APPLICANT ID EXISTS
    // -----------------------------------------------------

    if (
        !applicationData.applicantId
    ) {

        applicationData.applicantId =
            await getOrCreateApplicantId(
                currentUser.uid
            );


        displayApplicantId(
            applicationData.applicantId
        );
    }


    // -----------------------------------------------------
    // APPLICATION REFERENCE
    // -----------------------------------------------------

    const applicationRef =
        doc(
            db,
            "applications",
            currentUser.uid
        );


    // -----------------------------------------------------
    // SAVE APPLICATION
    // -----------------------------------------------------

    await setDoc(
        applicationRef,
        {

            applicantId:
                applicationData.applicantId,

            ...applicationData,

            status:
                status,

            updatedAt:
                serverTimestamp()
        },

        {
            merge:
                true
        }
    );


    console.log(
        "Application saved:",
        status
    );
}


// =========================================================
// UPLOAD SELECTED PHOTO
// =========================================================

async function uploadSelectedPhoto(
    uid
) {

    if (!applicantPhotoInput) {

        return null;
    }


    const file =
        applicantPhotoInput.files?.[0];


    if (!file) {

        return null;
    }


    return await uploadApplicantPhoto(
        file,
        uid
    );
}


// =========================================================
// UPLOAD ALL REQUIREMENTS
// =========================================================

async function uploadAllRequirements(
    uid
) {

    const files = {};


    // -----------------------------------------------------
    // BIRTH CERTIFICATE
    // -----------------------------------------------------

    if (
        birthCertificateInput &&
        birthCertificateInput.files?.[0]
    ) {

        files.birthCertificate =
            await uploadRequirement(
                birthCertificateInput.files[0],
                uid,
                "birth_certificate"
            );
    }


    // -----------------------------------------------------
    // REGISTRATION CERTIFICATE
    // -----------------------------------------------------

    if (
        registrationCertificateInput &&
        registrationCertificateInput.files?.[0]
    ) {

        files.registrationCertificate =
            await uploadRequirement(
                registrationCertificateInput.files[0],
                uid,
                "registration_certificate"
            );
    }


    // -----------------------------------------------------
    // OTHER REQUIREMENT
    // -----------------------------------------------------

    if (
        otherRequirementInput &&
        otherRequirementInput.files?.[0]
    ) {

        files.otherRequirement =
            await uploadRequirement(
                otherRequirementInput.files[0],
                uid,
                "other_requirement"
            );
    }


    return files;
}


// =========================================================
// BUILD FILE INFORMATION
// =========================================================

function buildFileInformation(
    photoData,
    requirementData
) {

    return {

        applicantPhoto:
            photoData || null,

        requirements:
            requirementData || {},

        updatedAt:
            new Date().toISOString()
    };
}


// =========================================================
// SAVE DRAFT
// =========================================================

async function saveDraft() {

    if (!currentUser) {

        showMessage(
            "Please login first.",
            "error"
        );

        return;
    }


    try {

        setLoading(
            true,
            "Saving..."
        );


        hideMessage();


        // -------------------------------------------------
        // GET FORM DATA
        // -------------------------------------------------

        const applicationData =
            getApplicationData();


        // -------------------------------------------------
        // ENSURE APPLICANT ID
        // -------------------------------------------------

        if (
            !applicationData.applicantId
        ) {

            applicationData.applicantId =
                await getOrCreateApplicantId(
                    currentUser.uid
                );


            displayApplicantId(
                applicationData.applicantId
            );
        }


        // -------------------------------------------------
        // SAVE FORM DATA FIRST
        // -------------------------------------------------

        await saveApplicationData(
            applicationData,
            "draft"
        );


        // -------------------------------------------------
        // UPLOAD PHOTO
        // -------------------------------------------------

        const photoData =
            await uploadSelectedPhoto(
                currentUser.uid
            );


        // -------------------------------------------------
        // UPLOAD REQUIREMENTS
        // -------------------------------------------------

        const requirementData =
            await uploadAllRequirements(
                currentUser.uid
            );


        // -------------------------------------------------
        // FILE INFORMATION
        // -------------------------------------------------

        const fileInformation =
            buildFileInformation(
                photoData,
                requirementData
            );


        // -------------------------------------------------
        // SAVE FILE INFORMATION
        // -------------------------------------------------

        await saveApplicationData(
            {

                ...applicationData,

                files:
                    fileInformation

            },

            "draft"
        );


        // -------------------------------------------------
        // SUCCESS
        // -------------------------------------------------

        showMessage(
            "Application draft saved successfully!",
            "success"
        );


    } catch (error) {

        console.error(
            "Save draft error:",
            error
        );


        showMessage(
            error.message ||
            "Failed to save application draft.",
            "error"
        );

    } finally {

        setLoading(
            false
        );
    }
}


// =========================================================
// SUBMIT APPLICATION
// =========================================================

async function submitApplication() {

    if (!currentUser) {

        showMessage(
            "Please login first.",
            "error"
        );

        return;
    }


    // -----------------------------------------------------
    // VALIDATE FILES
    // -----------------------------------------------------

    if (
        !validateAllFiles()
    ) {

        return;
    }


    try {

        setLoading(
            true,
            "Submitting..."
        );


        hideMessage();


        // -------------------------------------------------
        // GET FORM DATA
        // -------------------------------------------------

        const applicationData =
            getApplicationData();


        // -------------------------------------------------
        // ENSURE APPLICANT ID
        // -------------------------------------------------

        if (
            !applicationData.applicantId
        ) {

            applicationData.applicantId =
                await getOrCreateApplicantId(
                    currentUser.uid
                );


            displayApplicantId(
                applicationData.applicantId
            );
        }


        // -------------------------------------------------
        // SAVE FORM DATA AS DRAFT FIRST
        // -------------------------------------------------

        await saveApplicationData(
            applicationData,
            "draft"
        );


        // -------------------------------------------------
        // UPLOAD APPLICANT PHOTO
        // -------------------------------------------------

        const photoData =
            await uploadSelectedPhoto(
                currentUser.uid
            );


        // -------------------------------------------------
        // UPLOAD REQUIREMENTS
        // -------------------------------------------------

        const requirementData =
            await uploadAllRequirements(
                currentUser.uid
            );


        // -------------------------------------------------
        // FILE INFORMATION
        // -------------------------------------------------

        const fileInformation =
            buildFileInformation(
                photoData,
                requirementData
            );


        // -------------------------------------------------
        // FINAL APPLICATION DATA
        // -------------------------------------------------

        const finalApplicationData = {

            ...applicationData,

            files:
                fileInformation,

            submittedAt:
                serverTimestamp()
        };


        // -------------------------------------------------
        // UPDATE APPLICATION TO SUBMITTED
        // -------------------------------------------------

        await saveApplicationData(
            finalApplicationData,
            "submitted"
        );


        // -------------------------------------------------
        // UPDATE USER STATUS
        // -------------------------------------------------

        await setDoc(
            doc(
                db,
                "users",
                currentUser.uid
            ),

            {

                applicationStatus:
                    "submitted",

                updatedAt:
                    serverTimestamp()

            },

            {
                merge:
                    true
            }
        );


        // -------------------------------------------------
        // SUCCESS
        // -------------------------------------------------

        showMessage(
            "Application submitted successfully!",
            "success"
        );


        // -------------------------------------------------
        // REDIRECT
        // -------------------------------------------------

        setTimeout(
            () => {

                window.location.href =
                    "application-status.html";

            },
            1500
        );


    } catch (error) {

        console.error(
            "Submit application error:",
            error
        );


        showMessage(
            error.message ||
            "Failed to submit application.",
            "error"
        );


    } finally {

        setLoading(
            false
        );
    }
}


// =========================================================
// AUTO-CALCULATE AGE
// =========================================================

const dateOfBirthInput =
    document.getElementById(
        "dateOfBirth"
    );


const ageInput =
    document.getElementById(
        "age"
    );


if (
    dateOfBirthInput
) {

    dateOfBirthInput.addEventListener(
        "change",
        () => {

            const birthDate =
                new Date(
                    dateOfBirthInput.value
                );


            if (
                isNaN(
                    birthDate.getTime()
                )
            ) {

                return;
            }


            const today =
                new Date();


            let age =
                today.getFullYear() -
                birthDate.getFullYear();


            const monthDifference =
                today.getMonth() -
                birthDate.getMonth();


            if (
                monthDifference < 0 ||
                (
                    monthDifference === 0 &&
                    today.getDate() <
                    birthDate.getDate()
                )
            ) {

                age--;
            }


            if (
                ageInput
            ) {

                ageInput.value =
                    age;
            }
        }
    );
}


// =========================================================
// PHOTO LABEL
// =========================================================

if (
    photoUploadLabel &&
    applicantPhotoInput
) {

    photoUploadLabel.addEventListener(
        "click",
        (event) => {

            event.preventDefault();

            applicantPhotoInput.click();
        }
    );
}


// =========================================================
// SAVE DRAFT BUTTON
// =========================================================

if (
    saveDraftBtn
) {

    saveDraftBtn.addEventListener(
        "click",
        async (event) => {

            event.preventDefault();


            if (
                saveDraftBtn.disabled
            ) {

                return;
            }


            if (!currentUser) {

                showMessage(
                    "Please login first.",
                    "error"
                );

                return;
            }


            await saveDraft();
        }
    );
}


// =========================================================
// SUBMIT BUTTON
// =========================================================

if (
    submitApplicationBtn
) {

    submitApplicationBtn.addEventListener(
        "click",
        async (event) => {

            event.preventDefault();


            if (
                submitApplicationBtn.disabled
            ) {

                return;
            }


            await submitApplication();
        }
    );
}


// =========================================================
// FORM SUBMIT PROTECTION
// =========================================================

if (
    form
) {

    form.addEventListener(
        "submit",
        (event) => {

            event.preventDefault();

            console.log(
                "Form submission intercepted."
            );
        }
    );
}


// =========================================================
// PREVENT ENTER KEY
// =========================================================

if (
    form
) {

    form.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Enter" &&
                event.target.tagName !==
                "TEXTAREA"
            ) {

                event.preventDefault();
            }
        }
    );
}


// =========================================================
// CHECK SUPABASE
// =========================================================

try {

    checkSupabase();

    console.log(
        "Supabase connection ready."
    );

} catch (error) {

    console.error(
        "Supabase initialization error:",
        error
    );
}


// =========================================================
// INITIALIZE APPLICATION PAGE
// =========================================================

console.log(
    "ScholarLink Application Page initialized."
);


console.log(
    "ScholarLink application system is ready."
);

/* =========================================================
   SCHOLARLINK APPLICATION PROGRESS
   LIVE COMPLETION TRACKER
========================================================= */

function setupApplicationProgress() {

    const progressContainer =
        document.querySelector(".progress-container");

    if (!progressContainer) {
        console.warn("Progress container not found.");
        return;
    }

    const steps =
        progressContainer.querySelectorAll(".progress-step");

    const lines =
        progressContainer.querySelectorAll(".progress-line");

    if (steps.length < 5) {
        console.warn("Expected 5 progress steps.");
        return;
    }


    /* =====================================================
       GET FORM
    ===================================================== */

    const form =
        document.getElementById("applicationForm");

    if (!form) {
        console.warn("Application form not found.");
        return;
    }


    /* =====================================================
       REQUIRED FIELDS
    ===================================================== */

    function isFieldCompleted(field) {

        if (!field) {
            return false;
        }


        /* FILE INPUT */

        if (field.type === "file") {

            return (
                field.files &&
                field.files.length > 0
            );

        }


        /* CHECKBOX */

        if (field.type === "checkbox") {

            return field.checked;

        }


        /* RADIO */

        if (field.type === "radio") {

            const radios =
                form.querySelectorAll(
                    `input[name="${CSS.escape(field.name)}"]`
                );

            return Array.from(radios)
                .some(radio => radio.checked);

        }


        /* SELECT */

        if (field.tagName === "SELECT") {

            return (
                field.value &&
                field.value.trim() !== ""
            );

        }


        /* NORMAL INPUT / TEXTAREA */

        return (
            field.value &&
            field.value.trim() !== ""
        );

    }


    /* =====================================================
       GET FIELDS FROM SECTION
    ===================================================== */

    function getSectionFields(section) {

        if (!section) {
            return [];
        }


        return Array.from(
            section.querySelectorAll(
                "input, select, textarea"
            )
        ).filter(field => {

            /*
             * Ignore hidden technical fields
             */

            if (
                field.type === "hidden"
            ) {
                return false;
            }


            /*
             * Only required fields count
             */

            return field.required;

        });

    }


    /* =====================================================
       SECTION COMPLETE
    ===================================================== */

    function isSectionComplete(section) {

        const fields =
            getSectionFields(section);


        /*
         * If no required fields were detected,
         * don't automatically mark the section complete.
         */

        if (!fields.length) {
            return false;
        }


        return fields.every(
            field => isFieldCompleted(field)
        );

    }


    /* =====================================================
       FIND FORM SECTIONS
    ===================================================== */

    const formCards =
        Array.from(
            form.querySelectorAll(
                ".form-card"
            )
        );


    /*
     * Your form contains:
     *
     * 0 = Personal
     * 1 = Academic
     * 2 = Family
     * 3 = Household
     * 4 = Requirements
     *
     * Progress has:
     *
     * 1 = Personal
     * 2 = Academic
     * 3 = Family
     * 4 = Requirements
     * 5 = Review
     */


    function getPersonalSection() {

        return formCards.find(
            section =>
                section.innerText
                    .toLowerCase()
                    .includes(
                        "personal information"
                    )
        );

    }


    function getAcademicSection() {

        return formCards.find(
            section =>
                section.innerText
                    .toLowerCase()
                    .includes(
                        "academic information"
                    )
        );

    }


    function getFamilySection() {

        return formCards.find(
            section =>
                section.innerText
                    .toLowerCase()
                    .includes(
                        "family information"
                    )
        );

    }


    function getRequirementsSection() {

        return formCards.find(
            section =>
                section.innerText
                    .toLowerCase()
                    .includes(
                        "scholarship requirements"
                    ) ||
                section.innerText
                    .toLowerCase()
                    .includes(
                        "requirements"
                    )
        );

    }


    function getHouseholdSection() {

        return formCards.find(
            section =>
                section.innerText
                    .toLowerCase()
                    .includes(
                        "household information"
                    )
        );

    }


    /* =====================================================
       MARK STEP
    ===================================================== */

    function setStepComplete(
        step,
        completed
    ) {

        if (!step) {
            return;
        }


        step.classList.remove(
            "active"
        );


        if (completed) {

            step.classList.add(
                "completed"
            );

        } else {

            step.classList.remove(
                "completed"
            );

        }

    }


    /* =====================================================
       UPDATE PROGRESS
    ===================================================== */

    function updateApplicationProgress() {

        const personal =
            getPersonalSection();

        const academic =
            getAcademicSection();

        const family =
            getFamilySection();

        const household =
            getHouseholdSection();

        const requirements =
            getRequirementsSection();


        const personalComplete =
            isSectionComplete(
                personal
            );


        const academicComplete =
            isSectionComplete(
                academic
            );


        const familyComplete =
            isSectionComplete(
                family
            );


        const householdComplete =
            isSectionComplete(
                household
            );


        const requirementsComplete =
            isSectionComplete(
                requirements
            );


        /*
         * STEP 1
         */

        setStepComplete(
            steps[0],
            personalComplete
        );


        /*
         * STEP 2
         */

        setStepComplete(
            steps[1],
            academicComplete
        );


        /*
         * STEP 3
         */

        setStepComplete(
            steps[2],
            familyComplete
        );


        /*
         * STEP 4
         *
         * Requirements + Household
         *
         * must both be complete.
         */

        const step4Complete =
            requirementsComplete &&
            householdComplete;


        setStepComplete(
            steps[3],
            step4Complete
        );


        /*
         * STEP 5 REVIEW
         *
         * ONLY blue when EVERYTHING
         * is complete.
         */

        const everythingComplete =
            personalComplete &&
            academicComplete &&
            familyComplete &&
            householdComplete &&
            requirementsComplete;


        setStepComplete(
            steps[4],
            everythingComplete
        );


        /* =================================================
           PROGRESS LINES
        ================================================= */

        if (lines[0]) {

            lines[0].classList.toggle(
                "completed",
                personalComplete
            );

        }


        if (lines[1]) {

            lines[1].classList.toggle(
                "completed",
                academicComplete
            );

        }


        if (lines[2]) {

            lines[2].classList.toggle(
                "completed",
                familyComplete
            );

        }


        if (lines[3]) {

            lines[3].classList.toggle(
                "completed",
                step4Complete
            );

        }


        console.log(
            "Application Progress:",
            {
                personalComplete,
                academicComplete,
                familyComplete,
                householdComplete,
                requirementsComplete,
                everythingComplete
            }
        );

    }


    /* =====================================================
       LIVE UPDATE
    ===================================================== */

    form.addEventListener(
        "input",
        updateApplicationProgress
    );


    form.addEventListener(
        "change",
        updateApplicationProgress
    );


    form.addEventListener(
        "keyup",
        updateApplicationProgress
    );


    /* =====================================================
       FILE UPLOAD UPDATE
    ===================================================== */

    form.querySelectorAll(
        'input[type="file"]'
    ).forEach(
        input => {

            input.addEventListener(
                "change",
                updateApplicationProgress
            );

        }
    );


    /* =====================================================
       INITIAL CHECK
    ===================================================== */

    setTimeout(
        updateApplicationProgress,
        300
    );

}


/* =========================================================
   START PROGRESS SYSTEM
========================================================= */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        setupApplicationProgress
    );

} else {

    setupApplicationProgress();

}
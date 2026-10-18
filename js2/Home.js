/* =========================================================
   SCHOLARLINK
   HOME PAGE + SCHOLAR COMMUNITY
   FIREBASE AUTH + FIRESTORE + SUPABASE
   ========================================================= */

import { auth, db } from "../firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { supabase } from "../supabase.js";


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let currentUser = null;
let currentUserData = {};
let currentApplication = {};
let currentScholar = {};

let communityPosts = [];
let realtimeChannel = null;

let currentSearch = "";

let isPublishing = false;


/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    console.log("ScholarLink Home / Community Ready");

    setupSidebar();
    setupMobileCommunity();
    setupLogout();

    setupCommunityComposer();
    setupCommunitySearch();

});


/* =========================================================
   AUTHENTICATION
   ========================================================= */

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        console.log("No authenticated user.");

        window.location.href = "../login/index.html";

        return;
    }


    currentUser = user;

    console.log(
        "Logged-in Scholar UID:",
        user.uid
    );


    try {

        await loadCurrentUser();

        await loadCommunity();

        setupRealtimeCommunity();

    } catch (error) {

        console.error(
            "Home loading error:",
            error
        );

        showCommunityError(
            "Unable to load the ScholarLink Community."
        );

    }

});


/* =========================================================
   LOAD CURRENT USER
   ========================================================= */

async function loadCurrentUser() {

    if (!currentUser) {
        return;
    }


    /* -----------------------------------------------------
       FIRESTORE USER
       ----------------------------------------------------- */

    const userSnap = await getDoc(
        doc(
            db,
            "users",
            currentUser.uid
        )
    );


    if (!userSnap.exists()) {

        console.error(
            "User document not found."
        );

        await signOut(auth);

        window.location.href =
            "../login/index.html";

        return;
    }


    currentUserData =
        userSnap.data();


    /* -----------------------------------------------------
       APPLICATION
       ----------------------------------------------------- */

    const applicationSnap =
        await getDoc(
            doc(
                db,
                "applications",
                currentUser.uid
            )
        );


    if (applicationSnap.exists()) {

        currentApplication =
            applicationSnap.data();

    } else {

        currentApplication = {};

    }


    /* -----------------------------------------------------
       SCHOLAR
       ----------------------------------------------------- */

    const scholarSnap =
        await getDoc(
            doc(
                db,
                "scholars",
                currentUser.uid
            )
        );


    if (scholarSnap.exists()) {

        currentScholar =
            scholarSnap.data();

    } else {

        currentScholar = {};

    }


    updateScholarHeader();

    await loadApplicantPhoto();

}


/* =========================================================
   USER INFORMATION
   ========================================================= */

function getFullName() {

    const personal =
        currentApplication.personalInformation ||
        currentApplication.personal_info ||
        {};


    const first =
        personal.firstName ||
        personal.firstname ||
        currentUserData.firstName ||
        "";


    const middle =
        personal.middleName ||
        personal.middlename ||
        currentUserData.middleName ||
        "";


    const last =
        personal.lastName ||
        personal.lastname ||
        currentUserData.lastName ||
        "";


    const suffix =
        personal.suffix ||
        currentUserData.suffix ||
        "";


    const assembled = [
        first,
        middle,
        last,
        suffix
    ]
        .filter(Boolean)
        .join(" ")
        .trim();


    return (
        currentScholar.fullName ||
        currentScholar.name ||
        currentUserData.fullName ||
        currentUserData.name ||
        assembled ||
        currentUser?.displayName ||
        currentUser?.email ||
        "Scholar"
    );

}


/* =========================================================
   SCHOLAR ID
   ========================================================= */

function getScholarId() {

    return (
        currentScholar.scholarId ||
        currentScholar.scholarID ||
        currentApplication.scholarId ||
        currentApplication.scholarID ||
        currentUserData.scholarId ||
        currentUserData.scholarID ||
        "Not assigned"
    );

}


/* =========================================================
   PROGRAM
   ========================================================= */

function getScholarshipProgram() {

    const scholarship =
        currentApplication.scholarshipInformation ||
        currentApplication.scholarship_info ||
        {};


    return (
        currentScholar.scholarshipProgram ||
        currentScholar.program ||
        currentApplication.scholarshipProgram ||
        scholarship.scholarshipProgram ||
        scholarship.program ||
        currentUserData.program ||
        "Scholar"
    );

}


/* =========================================================
   ROLE
   ========================================================= */

function getUserRole() {

    return (
        currentScholar.role ||
        currentUserData.role ||
        "scholar"
    );

}


/* =========================================================
   UPDATE HEADER
   ========================================================= */

function updateScholarHeader() {

    const scholarId =
        document.getElementById(
            "headerScholarId"
        );


    if (scholarId) {

        scholarId.textContent =
            getScholarId();

    }


    const program =
        document.getElementById(
            "headerProgram"
        );


    if (program) {

        program.textContent =
            getScholarshipProgram();

    }


    const profileAvatar =
        document.getElementById(
            "profileAvatar"
        );


    const composerAvatar =
        document.getElementById(
            "composerAvatar"
        );


    const photo =
        currentUserData.photo ||
        currentUserData.photoURL ||
        currentScholar.photo ||
        currentScholar.photoURL ||
        currentUser?.photoURL;


    if (photo) {

        if (profileAvatar) {
            profileAvatar.src = photo;
        }

        if (composerAvatar) {
            composerAvatar.src = photo;
        }

    }

}


/* =========================================================
   APPLICANT PHOTO FROM SUPABASE
   ========================================================= */

async function loadApplicantPhoto() {

    const photo =
        currentApplication.files?.applicantPhoto ||
        currentApplication.applicantPhoto ||
        currentScholar.applicantPhoto ||
        currentUserData.photo ||
        null;


    if (!photo) {
        return;
    }


    let path =
        photo.storagePath ||
        photo.storage_path ||
        photo.path ||
        photo.filePath ||
        photo.file_path ||
        "";


    if (!path) {
        return;
    }


    path =
        normalizeStoragePath(path);


    try {

        const {
            data,
            error
        } =
            await supabase.storage
                .from("applicant-photos")
                .createSignedUrl(
                    path,
                    3600
                );


        if (error) {

            console.error(
                "Applicant photo error:",
                error
            );

            return;
        }


        if (!data?.signedUrl) {
            return;
        }


        const images =
            document.querySelectorAll(
                "#profileAvatar, #composerAvatar"
            );


        images.forEach(
            image => {

                image.src =
                    data.signedUrl;

            }
        );


    } catch (error) {

        console.error(
            "Photo loading error:",
            error
        );

    }

}


/* =========================================================
   STORAGE PATH NORMALIZER
   ========================================================= */

function normalizeStoragePath(path) {

    if (!path) {
        return "";
    }


    path =
        String(path)
            .trim()
            .replace(/^\/+/, "");


    path =
        path.replace(
            /^applicant-photos\//,
            ""
        );


    if (
        path.includes(
            "/storage/v1/object/"
        )
    ) {

        try {

            const url =
                new URL(path);


            const marker =
                "/storage/v1/object/";


            const index =
                url.pathname.indexOf(
                    marker
                );


            if (index !== -1) {

                let remaining =
                    url.pathname.substring(
                        index +
                        marker.length
                    );


                remaining =
                    remaining.replace(
                        /^sign\/?/,
                        ""
                    );


                remaining =
                    remaining.replace(
                        /^public\/?/,
                        ""
                    );


                const parts =
                    remaining.split("/");


                if (
                    parts[0] ===
                    "applicant-photos"
                ) {

                    parts.shift();

                }


                path =
                    parts.join("/");

            }

        } catch (error) {

            console.warn(
                "Could not parse storage URL.",
                error
            );

        }

    }


    return path;

}


/* =========================================================
   COMMUNITY INITIALIZATION
   ========================================================= */

async function loadCommunity() {

    const feed =
        document.getElementById(
            "communityFeed"
        );


    if (!feed) {
        return;
    }


    feed.innerHTML = `
        <div class="community-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Loading community...</span>
        </div>
    `;


    await loadCommunityPosts();

}


/* =========================================================
   LOAD POSTS
   ========================================================= */

async function loadCommunityPosts() {

    try {

        const {
            data,
            error
        } =
            await supabase
                .from("community_posts")
                .select("*")
                .eq("is_deleted", false)
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (error) {

            console.error(
                "Community posts error:",
                error
            );

            throw error;

        }


        communityPosts =
            Array.isArray(data)
                ? data
                : [];


        renderCommunityPosts();


        await loadPinnedPosts();


    } catch (error) {

        console.error(
            "Unable to load community posts:",
            error
        );


        showCommunityError(
            "Community posts could not be loaded."
        );

    }

}


/* =========================================================
   RENDER COMMUNITY POSTS
   ========================================================= */

async function renderCommunityPosts() {

    const feed =
        document.getElementById(
            "communityFeed"
        );


    const empty =
        document.getElementById(
            "communityEmpty"
        );


    if (!feed) {
        return;
    }


    let posts =
        [...communityPosts];


    if (currentSearch.trim()) {

        const search =
            currentSearch
                .trim()
                .toLowerCase();


        posts =
            posts.filter(
                post => {

                    const message =
                        String(
                            post.message ||
                            ""
                        ).toLowerCase();


                    const author =
                        String(
                            post.author_name ||
                            ""
                        ).toLowerCase();


                    return (
                        message.includes(search) ||
                        author.includes(search)
                    );

                }
            );

    }


    if (!posts.length) {

        feed.innerHTML = "";


        if (empty) {

            empty.classList.remove(
                "hidden"
            );

            empty.innerHTML = `
                <div class="empty-icon">
                    <i class="fas fa-comments"></i>
                </div>

                <h3>
                    ${
                        currentSearch
                            ? "No matching posts"
                            : "No community posts yet"
                    }
                </h3>

                <p>
                    ${
                        currentSearch
                            ? "Try another search."
                            : "Be the first scholar to share something with the community."
                    }
                </p>
            `;

        }

        return;

    }


    if (empty) {

        empty.classList.add(
            "hidden"
        );

    }


    feed.innerHTML = "";


    for (
        const post of posts
    ) {

        const postElement =
            await createPostElement(
                post
            );


        feed.appendChild(
            postElement
        );

    }

}


/* =========================================================
   CREATE POST ELEMENT
   ========================================================= */

async function createPostElement(post) {

    const article =
        document.createElement(
            "article"
        );


    article.className =
        "community-post";


    article.dataset.postId =
        post.id;


    const authorName =
        post.author_name ||
        "Scholar";


    const role =
        formatRole(
            post.role ||
            "scholar"
        );


    const message =
        post.message ||
        "";


    const time =
        formatRelativeTime(
            post.created_at
        );


    const isOwner =
        currentUser &&
        post.firebase_uid ===
        currentUser.uid;


    const isPinned =
        post.is_pinned === true;


    const avatar =
        post.author_photo ||
        "../images/user.png";


    article.innerHTML = `

        <div class="post-header">

            <div class="post-author">

                <img
                    src="${escapeAttribute(avatar)}"
                    alt="Profile"
                    class="post-avatar"
                >

                <div class="post-author-info">

                    <strong>
                        ${escapeHtml(authorName)}
                    </strong>

                    <span class="post-role">
                        ${escapeHtml(role)}
                    </span>

                    <small>
                        ${escapeHtml(time)}
                    </small>

                </div>

            </div>


            <div class="post-header-actions">

                ${
                    isPinned
                        ? `
                            <span
                                class="pinned-badge"
                                title="Pinned post"
                            >
                                <i class="fas fa-thumbtack"></i>
                                Pinned
                            </span>
                        `
                        : ""
                }


                ${
                    isOwner
                        ? `
                            <button
                                class="post-menu-btn"
                                type="button"
                                data-action="delete"
                                title="Delete post"
                            >
                                <i class="fas fa-ellipsis"></i>
                            </button>
                        `
                        : ""
                }

            </div>

        </div>


        <div class="post-body">

            <p>
                ${escapeHtml(message)}
            </p>

        </div>


        <div
            class="post-actions"
            data-actions="${post.id}"
        >

            <button
                type="button"
                class="post-action like-post-btn"
                data-action="like"
                data-post-id="${escapeAttribute(post.id)}"
            >
                <i class="far fa-heart"></i>
                <span>Like</span>
                <b class="like-count">0</b>
            </button>


            <button
                type="button"
                class="post-action comment-post-btn"
                data-action="comment"
                data-post-id="${escapeAttribute(post.id)}"
            >
                <i class="far fa-comment"></i>
                <span>Comment</span>
                <b class="comment-count">0</b>
            </button>

        </div>


        <div
            class="post-comments"
            data-comments="${escapeAttribute(post.id)}"
            hidden
        >

            <div class="comments-list"></div>


            <form class="comment-form">

                <input
                    type="text"
                    class="comment-input"
                    maxlength="500"
                    placeholder="Write a comment..."
                    autocomplete="off"
                >

                <button
                    type="submit"
                    title="Send comment"
                >
                    <i class="fas fa-paper-plane"></i>
                </button>

            </form>

        </div>

    `;


    setupPostActions(
        article,
        post
    );


    await updatePostCounters(
        article,
        post.id
    );


    return article;

}


/* =========================================================
   POST ACTIONS
   ========================================================= */

function setupPostActions(
    article,
    post
) {

    const likeButton =
        article.querySelector(
            ".like-post-btn"
        );


    const commentButton =
        article.querySelector(
            ".comment-post-btn"
        );


    const deleteButton =
        article.querySelector(
            '[data-action="delete"]'
        );


    if (likeButton) {

        likeButton.addEventListener(
            "click",
            async () => {

                await toggleReaction(
                    post.id,
                    likeButton
                );

            }
        );

    }


    if (commentButton) {

        commentButton.addEventListener(
            "click",
            async () => {

                const commentsBox =
                    article.querySelector(
                        ".post-comments"
                    );


                if (!commentsBox) {
                    return;
                }


                const isHidden =
                    commentsBox.hidden;


                commentsBox.hidden =
                    !isHidden;


                if (isHidden) {

                    await loadComments(
                        post.id,
                        article
                    );

                }

            }
        );

    }


    if (deleteButton) {

        deleteButton.addEventListener(
            "click",
            async () => {

                await deleteCommunityPost(
                    post.id
                );

            }
        );

    }


    const commentForm =
        article.querySelector(
            ".comment-form"
        );


    if (commentForm) {

        commentForm.addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                const input =
                    commentForm.querySelector(
                        ".comment-input"
                    );


                const message =
                    input?.value.trim();


                if (!message) {
                    return;
                }


                await addComment(
                    post.id,
                    message,
                    input,
                    article
                );

            }
        );

    }

}


/* =========================================================
   LIKE / REACTION
   ========================================================= */

async function toggleReaction(
    postId,
    button
) {

    if (!currentUser) {
        return;
    }


    button.disabled = true;


    try {

        const {
            data: existing,
            error: checkError
        } =
            await supabase
                .from("community_reactions")
                .select("id")
                .eq(
                    "post_id",
                    postId
                )
                .eq(
                    "firebase_uid",
                    currentUser.uid
                )
                .maybeSingle();


        if (checkError) {
            throw checkError;
        }


        if (existing) {

            const {
                error
            } =
                await supabase
                    .from("community_reactions")
                    .delete()
                    .eq(
                        "id",
                        existing.id
                    );


            if (error) {
                throw error;
            }


            button.classList.remove(
                "active"
            );


            const icon =
                button.querySelector(
                    "i"
                );


            if (icon) {

                icon.className =
                    "far fa-heart";

            }


        } else {

            const {
                error
            } =
                await supabase
                    .from("community_reactions")
                    .insert({

                        post_id:
                            postId,

                        firebase_uid:
                            currentUser.uid,

                        reaction:
                            "like"

                    });


            if (error) {
                throw error;
            }


            button.classList.add(
                "active"
            );


            const icon =
                button.querySelector(
                    "i"
                );


            if (icon) {

                icon.className =
                    "fas fa-heart";

            }

        }


        const article =
            button.closest(
                ".community-post"
            );


        await updatePostCounters(
            article,
            postId
        );


    } catch (error) {

        console.error(
            "Reaction error:",
            error
        );

        alert(
            "Unable to update reaction."
        );

    } finally {

        button.disabled = false;

    }

}


/* =========================================================
   POST COUNTERS
   ========================================================= */

async function updatePostCounters(
    article,
    postId
) {

    if (!article) {
        return;
    }


    try {

        const {
            count: likes
        } =
            await supabase
                .from("community_reactions")
                .select(
                    "*",
                    {
                        count: "exact",
                        head: true
                    }
                )
                .eq(
                    "post_id",
                    postId
                );


        const {
            count: comments
        } =
            await supabase
                .from("community_comments")
                .select(
                    "*",
                    {
                        count: "exact",
                        head: true
                    }
                )
                .eq(
                    "post_id",
                    postId
                );


        const likeCount =
            article.querySelector(
                ".like-count"
            );


        const commentCount =
            article.querySelector(
                ".comment-count"
            );


        if (likeCount) {

            likeCount.textContent =
                likes || 0;

        }


        if (commentCount) {

            commentCount.textContent =
                comments || 0;

        }


        if (currentUser) {

            const {
                data: myReaction
            } =
                await supabase
                    .from("community_reactions")
                    .select("id")
                    .eq(
                        "post_id",
                        postId
                    )
                    .eq(
                        "firebase_uid",
                        currentUser.uid
                    )
                    .maybeSingle();


            const likeButton =
                article.querySelector(
                    ".like-post-btn"
                );


            if (likeButton) {

                const icon =
                    likeButton.querySelector(
                        "i"
                    );


                if (myReaction) {

                    likeButton.classList.add(
                        "active"
                    );


                    if (icon) {

                        icon.className =
                            "fas fa-heart";

                    }

                } else {

                    likeButton.classList.remove(
                        "active"
                    );


                    if (icon) {

                        icon.className =
                            "far fa-heart";

                    }

                }

            }

        }

    } catch (error) {

        /*
         * Do not destroy the feed if
         * reaction/comment tables are
         * temporarily unavailable.
         */

        console.warn(
            "Counter loading skipped:",
            error
        );

    }

}


/* =========================================================
   COMMENTS
   ========================================================= */

async function loadComments(
    postId,
    article
) {

    const list =
        article.querySelector(
            ".comments-list"
        );


    if (!list) {
        return;
    }


    list.innerHTML = `
        <div class="comments-loading">
            Loading comments...
        </div>
    `;


    try {

        const {
            data,
            error
        } =
            await supabase
                .from("community_comments")
                .select("*")
                .eq(
                    "post_id",
                    postId
                )
                .order(
                    "created_at",
                    {
                        ascending: true
                    }
                );


        if (error) {
            throw error;
        }


        if (!data?.length) {

            list.innerHTML = `
                <div class="no-comments">
                    No comments yet.
                </div>
            `;

            return;

        }


        list.innerHTML = "";


        data.forEach(
            comment => {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "community-comment";


                const isOwner =
                    currentUser &&
                    comment.firebase_uid ===
                    currentUser.uid;


                item.innerHTML = `

                    <img
                        src="${
                            escapeAttribute(
                                comment.author_photo ||
                                "../images/user.png"
                            )
                        }"
                        alt="Profile"
                    >


                    <div class="comment-content">

                        <div class="comment-top">

                            <strong>
                                ${
                                    escapeHtml(
                                        comment.author_name ||
                                        "Scholar"
                                    )
                                }
                            </strong>

                            ${
                                isOwner
                                    ? `
                                        <button
                                            type="button"
                                            class="delete-comment"
                                            title="Delete comment"
                                        >
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    `
                                    : ""
                            }

                        </div>


                        <p>
                            ${
                                escapeHtml(
                                    comment.message ||
                                    ""
                                )
                            }
                        </p>


                        <small>
                            ${
                                escapeHtml(
                                    formatRelativeTime(
                                        comment.created_at
                                    )
                                )
                            }
                        </small>

                    </div>

                `;


                const deleteButton =
                    item.querySelector(
                        ".delete-comment"
                    );


                if (deleteButton) {

                    deleteButton.addEventListener(
                        "click",
                        async () => {

                            await deleteComment(
                                comment.id,
                                postId,
                                article
                            );

                        }
                    );

                }


                list.appendChild(
                    item
                );

            }
        );

    } catch (error) {

        console.error(
            "Comments error:",
            error
        );


        list.innerHTML = `
            <div class="no-comments">
                Comments are currently unavailable.
            </div>
        `;

    }

}


/* =========================================================
   ADD COMMENT
   ========================================================= */

async function addComment(
    postId,
    message,
    input,
    article
) {

    if (!currentUser) {
        return;
    }


    try {

        const payload = {

            post_id:
                postId,

            firebase_uid:
                currentUser.uid,

            author_name:
                getFullName(),

            author_photo:
                await getCurrentPhotoUrl(),

            role:
                getUserRole(),

            message:
                message

        };


        const {
            error
        } =
            await supabase
                .from("community_comments")
                .insert(
                    payload
                );


        if (error) {
            throw error;
        }


        input.value = "";


        await loadComments(
            postId,
            article
        );


        await updatePostCounters(
            article,
            postId
        );


    } catch (error) {

        console.error(
            "Add comment error:",
            error
        );


        alert(
            "Unable to post your comment."
        );

    }

}


/* =========================================================
   DELETE COMMENT
   ========================================================= */

async function deleteComment(
    commentId,
    postId,
    article
) {

    if (!currentUser) {
        return;
    }


    const confirmed =
        confirm(
            "Delete this comment?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const {
            error
        } =
            await supabase
                .from("community_comments")
                .delete()
                .eq(
                    "id",
                    commentId
                )
                .eq(
                    "firebase_uid",
                    currentUser.uid
                );


        if (error) {
            throw error;
        }


        await loadComments(
            postId,
            article
        );


        await updatePostCounters(
            article,
            postId
        );


    } catch (error) {

        console.error(
            "Delete comment error:",
            error
        );


        alert(
            "Unable to delete comment."
        );

    }

}


/* =========================================================
   CREATE POST
   ========================================================= */

function setupCommunityComposer() {

    const textarea =
        document.getElementById(
            "postMessage"
        );


    const publishButton =
        document.getElementById(
            "publishPostBtn"
        );


    const counter =
        document.getElementById(
            "characterCount"
        );


    if (!textarea) {
        return;
    }


    textarea.addEventListener(
        "input",
        () => {

            const length =
                textarea.value.length;


            if (counter) {

                counter.textContent =
                    `${length} / 1000`;

            }

        }
    );


    if (publishButton) {

        publishButton.addEventListener(
            "click",
            publishCommunityPost
        );

    }


    textarea.addEventListener(
        "keydown",
        event => {

            if (
                (event.ctrlKey ||
                 event.metaKey) &&
                event.key === "Enter"
            ) {

                event.preventDefault();

                publishCommunityPost();

            }

        }
    );

}


/* =========================================================
   PUBLISH POST
   ========================================================= */

async function publishCommunityPost() {

    if (isPublishing) {
        return;
    }


    if (!currentUser) {

        alert(
            "Please log in first."
        );

        return;
    }


    const textarea =
        document.getElementById(
            "postMessage"
        );


    const button =
        document.getElementById(
            "publishPostBtn"
        );


    if (!textarea) {
        return;
    }


    const message =
        textarea.value.trim();


    if (!message) {

        alert(
            "Please write something before posting."
        );

        textarea.focus();

        return;
    }


    if (message.length > 1000) {

        alert(
            "Your post cannot exceed 1000 characters."
        );

        return;
    }


    isPublishing = true;


    if (button) {

        button.disabled = true;

        button.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            Posting...
        `;

    }


    try {

        const photo =
            await getCurrentPhotoUrl();


        const postData = {

            firebase_uid:
                currentUser.uid,

            author_name:
                getFullName(),

            author_photo:
                photo,

            role:
                getUserRole(),

            scholar_id:
                getScholarId(),

            program:
                getScholarshipProgram(),

            message:
                message,

            is_pinned:
                false,

            is_deleted:
                false

        };


        const {
            data,
            error
        } =
            await supabase
                .from("community_posts")
                .insert(
                    postData
                )
                .select()
                .single();


        if (error) {
            throw error;
        }


        textarea.value = "";


        const counter =
            document.getElementById(
                "characterCount"
            );


        if (counter) {

            counter.textContent =
                "0 / 1000";

        }


        /*
         * Realtime normally adds the post.
         * This fallback makes the new post
         * appear immediately if realtime
         * has a short delay.
         */

        if (data) {

            const exists =
                communityPosts.some(
                    post =>
                        post.id === data.id
                );


            if (!exists) {

                communityPosts.unshift(
                    data
                );

                await renderCommunityPosts();

            }

        }


    } catch (error) {

        console.error(
            "Publish post error:",
            error
        );


        alert(
            "Unable to publish your post. Please try again."
        );

    } finally {

        isPublishing = false;


        if (button) {

            button.disabled = false;

            button.innerHTML = `
                <i class="fas fa-paper-plane"></i>
                Post
            `;

        }

    }

}


/* =========================================================
   DELETE POST
   ========================================================= */

async function deleteCommunityPost(
    postId
) {

    if (!currentUser) {
        return;
    }


    const confirmed =
        confirm(
            "Are you sure you want to delete this post?"
        );


    if (!confirmed) {
        return;
    }


    try {

        /*
         * Soft delete instead of permanently
         * deleting the record.
         */

        const {
            error
        } =
            await supabase
                .from("community_posts")
                .update({

                    is_deleted:
                        true

                })
                .eq(
                    "id",
                    postId
                )
                .eq(
                    "firebase_uid",
                    currentUser.uid
                );


        if (error) {
            throw error;
        }


        communityPosts =
            communityPosts.filter(
                post =>
                    post.id !== postId
            );


        await renderCommunityPosts();


    } catch (error) {

        console.error(
            "Delete post error:",
            error
        );


        alert(
            "Unable to delete this post."
        );

    }

}


/* =========================================================
   SEARCH
   ========================================================= */

function setupCommunitySearch() {

    const searchInput =
        document.getElementById(
            "communitySearch"
        );


    if (!searchInput) {
        return;
    }


    let timer;


    searchInput.addEventListener(
        "input",
        () => {

            clearTimeout(timer);


            timer =
                setTimeout(
                    async () => {

                        currentSearch =
                            searchInput.value;


                        await renderCommunityPosts();

                    },
                    250
                );

        }
    );

}


/* =========================================================
   REALTIME COMMUNITY
   ========================================================= */

function setupRealtimeCommunity() {

    if (realtimeChannel) {

        supabase.removeChannel(
            realtimeChannel
        );

        realtimeChannel = null;

    }


    realtimeChannel =
        supabase
            .channel(
                "scholarlink-community-posts"
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "community_posts"
                },
                async payload => {

                    console.log(
                        "Community realtime event:",
                        payload
                    );


                    if (
                        payload.eventType ===
                        "INSERT"
                    ) {

                        const post =
                            payload.new;


                        if (
                            post.is_deleted ===
                            true
                        ) {
                            return;
                        }


                        const exists =
                            communityPosts.some(
                                item =>
                                    item.id ===
                                    post.id
                            );


                        if (!exists) {

                            communityPosts.unshift(
                                post
                            );

                        }


                        await renderCommunityPosts();


                        return;

                    }


                    if (
                        payload.eventType ===
                        "UPDATE"
                    ) {

                        const index =
                            communityPosts.findIndex(
                                item =>
                                    item.id ===
                                    payload.new.id
                            );


                        if (
                            payload.new.is_deleted
                        ) {

                            if (
                                index !== -1
                            ) {

                                communityPosts.splice(
                                    index,
                                    1
                                );

                            }

                        } else {

                            if (
                                index !== -1
                            ) {

                                communityPosts[index] =
                                    payload.new;

                            } else {

                                communityPosts.unshift(
                                    payload.new
                                );

                            }

                        }


                        await renderCommunityPosts();


                        return;

                    }


                    if (
                        payload.eventType ===
                        "DELETE"
                    ) {

                        communityPosts =
                            communityPosts.filter(
                                item =>
                                    item.id !==
                                    payload.old.id
                            );


                        await renderCommunityPosts();

                    }

                }
            )
            .subscribe(
                status => {

                    console.log(
                        "Community realtime status:",
                        status
                    );

                }
            );

}


/* =========================================================
   PINNED POSTS
   ========================================================= */

async function loadPinnedPosts() {

    const container =
        document.getElementById(
            "pinnedPosts"
        );


    if (!container) {
        return;
    }


    try {

        const {
            data,
            error
        } =
            await supabase
                .from("community_posts")
                .select("*")
                .eq(
                    "is_deleted",
                    false
                )
                .eq(
                    "is_pinned",
                    true
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )
                .limit(5);


        if (error) {
            throw error;
        }


        if (!data?.length) {

            container.innerHTML = `
                <div class="side-empty">
                    <i class="fas fa-thumbtack"></i>
                    <span>No pinned posts.</span>
                </div>
            `;

            return;

        }


        container.innerHTML = "";


        data.forEach(
            post => {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "pinned-post-item";


                item.innerHTML = `

                    <strong>
                        ${escapeHtml(
                            post.author_name ||
                            "ScholarLink"
                        )}
                    </strong>

                    <p>
                        ${escapeHtml(
                            truncateText(
                                post.message ||
                                "",
                                100
                            )
                        )}
                    </p>

                    <small>
                        ${escapeHtml(
                            formatRelativeTime(
                                post.created_at
                            )
                        )}
                    </small>

                `;


                item.addEventListener(
                    "click",
                    () => {

                        const target =
                            document.querySelector(
                                `[data-post-id="${CSS.escape(
                                    post.id
                                )}"]`
                            );


                        if (target) {

                            target.scrollIntoView({
                                behavior:
                                    "smooth",
                                block:
                                    "center"
                            });


                            target.classList.add(
                                "post-highlight"
                            );


                            setTimeout(
                                () => {

                                    target.classList.remove(
                                        "post-highlight"
                                    );

                                },
                                1800
                            );

                        }

                    }
                );


                container.appendChild(
                    item
                );

            }
        );

    } catch (error) {

        console.warn(
            "Pinned posts unavailable:",
            error
        );


        container.innerHTML = `
            <div class="side-empty">
                No pinned posts.
            </div>
        `;

    }

}


/* =========================================================
   ONLINE COMMUNITY
   ========================================================= */

async function loadOnlineCommunity() {

    const countElement =
        document.getElementById(
            "onlineCount"
        );


    const membersElement =
        document.getElementById(
            "onlineMembers"
        );


    if (!countElement || !membersElement) {
        return;
    }


    /*
     * This function intentionally does
     * not invent online users.
     *
     * It uses a Supabase presence channel.
     */

    const channel =
        supabase.channel(
            "scholarlink-online-community",
            {
                config: {
                    presence: {
                        key:
                            currentUser?.uid ||
                            crypto.randomUUID()
                    }
                }
            }
        );


    channel
        .on(
            "presence",
            {
                event: "sync"
            },
            () => {

                const state =
                    channel.presenceState();


                const users = [];


                Object.values(state)
                    .forEach(
                        entries => {

                            entries.forEach(
                                entry => {

                                    users.push(
                                        entry
                                    );

                                }
                            );

                        }
                    );


                renderOnlineMembers(
                    users,
                    countElement,
                    membersElement
                );

            }
        )
        .subscribe(
            async status => {

                if (
                    status ===
                    "SUBSCRIBED"
                ) {

                    await channel.track({

                        uid:
                            currentUser.uid,

                        name:
                            getFullName(),

                        role:
                            getUserRole(),

                        photo:
                            await getCurrentPhotoUrl()

                    });

                }

            }
        );

}


/* =========================================================
   RENDER ONLINE MEMBERS
   ========================================================= */

function renderOnlineMembers(
    users,
    countElement,
    membersElement
) {

    const unique =
        new Map();


    users.forEach(
        user => {

            if (
                user.uid &&
                !unique.has(
                    user.uid
                )
            ) {

                unique.set(
                    user.uid,
                    user
                );

            }

        }
    );


    const members =
        [...unique.values()];


    countElement.textContent =
        `${members.length} online`;


    membersElement.innerHTML = "";


    if (!members.length) {

        membersElement.innerHTML = `
            <div class="side-empty">
                No scholars online.
            </div>
        `;

        return;

    }


    members
        .slice(0, 10)
        .forEach(
            member => {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "online-member";


                item.innerHTML = `

                    <div class="online-avatar-wrap">

                        <img
                            src="${
                                escapeAttribute(
                                    member.photo ||
                                    "../images/user.png"
                                )
                            }"
                            alt="Profile"
                        >

                        <span
                            class="online-dot"
                        ></span>

                    </div>


                    <div>

                        <strong>
                            ${
                                escapeHtml(
                                    member.name ||
                                    "Scholar"
                                )
                            }
                        </strong>

                        <small>
                            Online
                        </small>

                    </div>

                `;


                membersElement.appendChild(
                    item
                );

            }
        );

}


/* =========================================================
   START ONLINE PRESENCE
   ========================================================= */

async function setupOnlineCommunity() {

    if (!currentUser) {
        return;
    }


    try {

        await loadOnlineCommunity();

    } catch (error) {

        console.warn(
            "Online community unavailable:",
            error
        );

    }

}


/* =========================================================
   SIDEBAR
   ========================================================= */

function setupSidebar() {

    const sidebar = document.querySelector(".sidebar");

    if (!sidebar) {
        console.warn("Sidebar element not found.");
        return;
    }

    const sidebarLinks = sidebar.querySelectorAll("a");

    const currentPage =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();

    sidebarLinks.forEach(link => {

        const href =
            link.getAttribute("href");

        if (!href) {
            return;
        }

        const linkPage =
            href
                .split("/")
                .pop()
                .split("?")[0]
                .split("#")[0]
                .toLowerCase();

        if (
            linkPage &&
            linkPage === currentPage
        ) {
            link.classList.add("active");
        }

        link.addEventListener("click", () => {

            sidebarLinks.forEach(item => {
                item.classList.remove("active");
            });

            link.classList.add("active");

        });

    });

}


/* =========================================================
   MOBILE COMMUNITY
   ========================================================= */

function setupMobileCommunity() {

    const menuButton =
        document.getElementById(
            "mobileMenuBtn"
        );


    const sidebar =
        document.querySelector(
            ".sidebar"
        );


    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );


    if (
        !menuButton ||
        !sidebar ||
        !overlay
    ) {

        return;

    }


    function openSidebar() {

        sidebar.classList.add(
            "mobile-open"
        );


        overlay.classList.add(
            "active"
        );


        menuButton.innerHTML =
            '<i class="fas fa-xmark"></i>';


        menuButton.setAttribute(
            "aria-label",
            "Close menu"
        );

    }


    function closeSidebar() {

        sidebar.classList.remove(
            "mobile-open"
        );


        overlay.classList.remove(
            "active"
        );


        menuButton.innerHTML =
            '<i class="fas fa-bars"></i>';


        menuButton.setAttribute(
            "aria-label",
            "Open menu"
        );

    }


    menuButton.addEventListener(
        "click",
        () => {

            if (
                sidebar.classList.contains(
                    "mobile-open"
                )
            ) {

                closeSidebar();

            } else {

                openSidebar();

            }

        }
    );


    overlay.addEventListener(
        "click",
        closeSidebar
    );


    sidebar
        .querySelectorAll("a")
        .forEach(
            link => {

                link.addEventListener(
                    "click",
                    () => {

                        if (
                            window.innerWidth <=
                            900
                        ) {

                            closeSidebar();

                        }

                    }
                );

            }
        );


    window.addEventListener(
        "resize",
        () => {

            if (
                window.innerWidth > 900
            ) {

                closeSidebar();

            }

        }
    );

}


/* =========================================================
   LOGOUT
   ========================================================= */

function setupLogout() {

    const logout =
        document.getElementById(
            "sidebarlogout"
        );


    const modal =
        document.getElementById(
            "logoutModal"
        );


    const cancel =
        document.getElementById(
            "cancelLogout"
        );


    const confirmButton =
        document.getElementById(
            "confirmLogout"
        );


    if (!logout) {
        return;
    }


    logout.addEventListener(
        "click",
        event => {

            event.preventDefault();


            if (modal) {

                modal.classList.add(
                    "active"
                );

            }

        }
    );


    if (cancel) {

        cancel.addEventListener(
            "click",
            () => {

                modal?.classList.remove(
                    "active"
                );

            }
        );

    }


    if (confirmButton) {

        confirmButton.addEventListener(
            "click",
            async () => {

                try {

                    confirmButton.disabled =
                        true;


                    confirmButton.textContent =
                        "Logging out...";


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


                    if (realtimeChannel) {

                        await supabase
                            .removeChannel(
                                realtimeChannel
                            );

                        realtimeChannel =
                            null;

                    }


                    await signOut(
                        auth
                    );


                    window.location.href =
                        "../login/index.html";


                } catch (error) {

                    console.error(
                        "Logout error:",
                        error
                    );


                    confirmButton.disabled =
                        false;


                    confirmButton.textContent =
                        "Logout";


                    alert(
                        "Unable to logout. Please try again."
                    );

                }

            }
        );

    }


    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    modal
                ) {

                    modal.classList.remove(
                        "active"
                    );

                }

            }
        );

    }


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                modal?.classList.remove(
                    "active"
                );

            }

        }
    );

}


/* =========================================================
   CURRENT PHOTO URL
   ========================================================= */

async function getCurrentPhotoUrl() {

    const directPhoto =
        currentUserData.photoURL ||
        currentUserData.photo ||
        currentScholar.photoURL ||
        currentScholar.photo;


    if (directPhoto) {

        return directPhoto;

    }


    const photo =
        currentApplication.files?.applicantPhoto ||
        currentApplication.applicantPhoto ||
        currentScholar.applicantPhoto;


    if (!photo) {

        return "../images/user.png";

    }


    let path =
        photo.storagePath ||
        photo.storage_path ||
        photo.path ||
        photo.filePath ||
        photo.file_path ||
        "";


    if (!path) {

        return "../images/user.png";

    }


    path =
        normalizeStoragePath(
            path
        );


    try {

        const {
            data,
            error
        } =
            await supabase.storage
                .from("applicant-photos")
                .createSignedUrl(
                    path,
                    3600
                );


        if (
            !error &&
            data?.signedUrl
        ) {

            return data.signedUrl;

        }

    } catch (error) {

        console.warn(
            "Could not get profile photo:",
            error
        );

    }


    return "../images/user.png";

}


/* =========================================================
   FORMAT ROLE
   ========================================================= */

function formatRole(role) {

    return String(
        role ||
        "scholar"
    )
        .replace(
            /_/g,
            " "
        )
        .replace(
            /\b\w/g,
            char =>
                char.toUpperCase()
        );

}


/* =========================================================
   RELATIVE TIME
   ========================================================= */

function formatRelativeTime(
    value
) {

    if (!value) {
        return "Recently";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Recently";

    }


    const diff =
        Date.now() -
        date.getTime();


    if (diff < 60000) {
        return "Just now";
    }


    const minutes =
        Math.floor(
            diff / 60000
        );


    if (minutes < 60) {

        return `${minutes} min ago`;

    }


    const hours =
        Math.floor(
            minutes / 60
        );


    if (hours < 24) {

        return `${hours} hr ago`;

    }


    const days =
        Math.floor(
            hours / 24
        );


    if (days < 7) {

        return `${days} day${
            days === 1
                ? ""
                : "s"
        } ago`;

    }


    return date.toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );

}


/* =========================================================
   TRUNCATE TEXT
   ========================================================= */

function truncateText(
    text,
    max
) {

    const value =
        String(
            text ||
            ""
        );


    if (
        value.length <=
        max
    ) {

        return value;

    }


    return (
        value.substring(
            0,
            max
        ) +
        "..."
    );

}


/* =========================================================
   COMMUNITY ERROR
   ========================================================= */

function showCommunityError(
    message
) {

    const feed =
        document.getElementById(
            "communityFeed"
        );


    if (!feed) {
        return;
    }


    feed.innerHTML = `

        <div class="community-error">

            <div class="error-icon">
                <i class="fas fa-circle-exclamation"></i>
            </div>

            <h3>
                Something went wrong
            </h3>

            <p>
                ${escapeHtml(message)}
            </p>

            <button
                type="button"
                id="retryCommunityBtn"
            >
                <i class="fas fa-rotate-right"></i>
                Try Again
            </button>

        </div>

    `;


    const retry =
        document.getElementById(
            "retryCommunityBtn"
        );


    if (retry) {

        retry.addEventListener(
            "click",
            async () => {

                await loadCommunityPosts();

            }
        );

    }

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


/* =========================================================
   ESCAPE ATTRIBUTE
   ========================================================= */

function escapeAttribute(
    value
) {

    return escapeHtml(
        value
    );

}


/* =========================================================
   CLEANUP
   ========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        if (realtimeChannel) {

            supabase.removeChannel(
                realtimeChannel
            );

        }

    }
);


/* =========================================================
   START ONLINE PRESENCE AFTER AUTH
   ========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {
            return;
        }


        /*
         * Small delay so Firebase user
         * information is already loaded.
         */

        setTimeout(
            () => {

                setupOnlineCommunity();

            },
            800
        );

    }
);